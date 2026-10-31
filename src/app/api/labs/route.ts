import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/origin";
import { createServiceSupabase } from "@/lib/supabase/admin";

const schema = z.object({
  templateSlug: z.string().min(2).max(80),
});

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { data } = await db
    .from("lab_instances")
    .select("id, status, expires_at, created_at, template_id, lab_templates(slug, title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ instances: data ?? [] });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Unknown template." }, { status: 400 });
  const { data: template } = await db
    .from("lab_templates")
    .select("*")
    .eq("slug", body.data.templateSlug)
    .eq("enabled", true)
    .maybeSingle();
  if (!template) return NextResponse.json({ error: "Template disabled." }, { status: 404 });

  const { data: active } = await db
    .from("lab_instances")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "running");
  if ((active?.length ?? 0) >= 2) {
    return NextResponse.json({ error: "Stop an existing lab before starting another." }, { status: 409 });
  }

  const expires = new Date(Date.now() + template.expires_minutes * 60_000).toISOString();
  let gatewayRef: string | null = null;
  let status = "running";
  let notes = "Logical lab reservation recorded. Attach LAB_GATEWAY_URL for container launch.";

  const gateway = process.env.LAB_GATEWAY_URL;
  const secret = process.env.LAB_GATEWAY_SECRET;
  if (gateway && secret) {
    const response = await fetch(`${gateway.replace(/\/$/, "")}/instances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-lab-secret": secret,
      },
      body: JSON.stringify({
        userId: user.id,
        template: template.slug,
        image: template.image_ref,
        cpu: template.cpu_limit,
        memory: template.memory_limit,
        expiresAt: expires,
      }),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Lab gateway rejected the start request." }, { status: 502 });
    }
    const payload = await response.json();
    gatewayRef = payload.id ?? null;
    notes = "Container requested through isolated lab gateway.";
  }

  const { data: instance, error: insertError } = await db
    .from("lab_instances")
    .insert({
      template_id: template.id,
      user_id: user.id,
      status,
      gateway_ref: gatewayRef,
      expires_at: expires,
      resource_notes: notes,
    })
    .select("id, status, expires_at")
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ instance });
}

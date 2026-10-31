import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getAdminSession } from "@/lib/admin-session";
import { assertSameOrigin } from "@/lib/origin";
import { createServiceSupabase } from "@/lib/supabase/admin";

const schema = z.object({
  action: z.enum(["stop", "reset"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const { id } = await context.params;
  const { user } = await requireUser();
  const admin = await getAdminSession();
  if (!user && !admin) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const { data: instance } = await db.from("lab_instances").select("*").eq("id", id).maybeSingle();
  if (!instance) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!admin && instance.user_id !== user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (instance.gateway_ref && process.env.LAB_GATEWAY_URL && process.env.LAB_GATEWAY_SECRET) {
    await fetch(`${process.env.LAB_GATEWAY_URL.replace(/\/$/, "")}/instances/${instance.gateway_ref}/${body.data.action}`, {
      method: "POST",
      headers: { "x-lab-secret": process.env.LAB_GATEWAY_SECRET },
    });
  }

  const status = body.data.action === "stop" ? "stopped" : "running";
  await db
    .from("lab_instances")
    .update({
      status,
      expires_at:
        body.data.action === "reset"
          ? new Date(Date.now() + 60 * 60_000).toISOString()
          : instance.expires_at,
    })
    .eq("id", id);
  return NextResponse.json({ ok: true, status });
}

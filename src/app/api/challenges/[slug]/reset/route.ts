import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/origin";
import { createServiceSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { slug } = await context.params;
  const { data: challenge } = await db.from("challenges").select("id").eq("slug", slug).maybeSingle();
  if (!challenge) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await db
    .from("user_progress")
    .update({ status: "reset" })
    .eq("user_id", user.id)
    .eq("challenge_id", challenge.id);
  return NextResponse.json({
    ok: true,
    message: "Progress marker reset. First-solve XP is kept to prevent score farming.",
  });
}

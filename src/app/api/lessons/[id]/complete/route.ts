import { NextResponse } from "next/server";
import { addXp } from "@/lib/achievements";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/origin";
import { createServiceSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { id } = await context.params;
  const { data: lesson } = await db.from("lessons").select("id, course_id").eq("id", id).maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  const { data: existing } = await db
    .from("user_progress")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("lesson_id", id)
    .maybeSingle();
  if (existing) {
    await db.from("user_progress").update({ status: "completed" }).eq("id", existing.id);
  } else {
    await db.from("user_progress").insert({
      user_id: user.id,
      lesson_id: id,
      course_id: lesson.course_id,
      status: "completed",
    });
  }
  if (existing?.status !== "completed") {
    await addXp(db, user.id, 25, `lesson:${id}`);
  }
  return NextResponse.json({ ok: true, xp: existing?.status === "completed" ? 0 : 25 });
}

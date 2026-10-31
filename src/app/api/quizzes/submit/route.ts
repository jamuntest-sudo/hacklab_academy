import { NextResponse } from "next/server";
import { z } from "zod";
import { addXp } from "@/lib/achievements";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/origin";
import { createServiceSupabase } from "@/lib/supabase/admin";

const schema = z.object({
  questionId: z.string().uuid(),
  selectedIndex: z.number().int().min(0).max(8),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid quiz payload." }, { status: 400 });

  const { data: answer } = await db
    .from("quiz_answers")
    .select("correct_index")
    .eq("question_id", body.data.questionId)
    .maybeSingle();
  if (!answer) return NextResponse.json({ error: "Question not found." }, { status: 404 });
  const correct = answer.correct_index === body.data.selectedIndex;
  await db.from("quiz_attempts").insert({
    question_id: body.data.questionId,
    user_id: user.id,
    selected_index: body.data.selectedIndex,
    correct,
  });
  if (correct) {
    const { data: prior } = await db
      .from("quiz_attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("question_id", body.data.questionId)
      .eq("correct", true);
    if ((prior?.length ?? 0) <= 1) {
      await addXp(db, user.id, 15, `quiz:${body.data.questionId}`);
    }
  }
  return NextResponse.json({ correct, message: correct ? "Correct. +15 XP on first success." : "Not yet." });
}

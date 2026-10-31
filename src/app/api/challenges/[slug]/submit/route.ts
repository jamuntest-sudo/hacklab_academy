import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { recordSolve, validateFlag } from "@/lib/challenges";
import { assertSameOrigin } from "@/lib/origin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/admin";

const schema = z.object({
  flag: z.string().min(4).max(200),
});

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const limited = rateLimit(`flag:${clientIp(request)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many submissions. Wait and retry." }, { status: 429 });
  }

  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const { slug } = await context.params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Provide a flag." }, { status: 400 });

  const { data: challenge } = await db
    .from("challenges")
    .select("id, slug, category, xp_reward, enabled")
    .eq("slug", slug)
    .maybeSingle();
  if (!challenge?.enabled) {
    return NextResponse.json({ error: "Challenge unavailable." }, { status: 404 });
  }

  const ok = await validateFlag(db, challenge.id, body.data.flag);
  await db.from("challenge_submissions").insert({
    challenge_id: challenge.id,
    user_id: user.id,
    correct: ok,
  });
  if (!ok) {
    return NextResponse.json({ correct: false, message: "Incorrect flag." });
  }
  const result = await recordSolve(db, user.id, challenge);
  return NextResponse.json({
    correct: true,
    already: result.already,
    xp: result.awarded,
    message: result.already ? "Already solved." : `Correct. +${result.awarded} XP`,
  });
}

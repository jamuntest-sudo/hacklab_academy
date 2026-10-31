import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { addXp, grantAchievement, maybeGrantTierBadges } from "@/lib/achievements";
import { hashFlag, hashesEqual } from "@/lib/crypto";

export async function alreadySolved(db: SupabaseClient, userId: string, challengeId: string) {
  const { data } = await db
    .from("challenge_submissions")
    .select("id")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .eq("correct", true)
    .maybeSingle();
  return Boolean(data);
}

export async function recordSolve(
  db: SupabaseClient,
  userId: string,
  challenge: { id: string; slug: string; category: string; xp_reward: number },
) {
  if (await alreadySolved(db, userId, challenge.id)) {
    return { awarded: 0, already: true };
  }
  await db.from("challenge_submissions").insert({
    challenge_id: challenge.id,
    user_id: userId,
    correct: true,
  });
  const { data: progress } = await db
    .from("user_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("challenge_id", challenge.id)
    .maybeSingle();
  if (progress) {
    await db.from("user_progress").update({ status: "completed" }).eq("id", progress.id);
  } else {
    await db.from("user_progress").insert({
      user_id: userId,
      challenge_id: challenge.id,
      status: "completed",
    });
  }
  await addXp(db, userId, challenge.xp_reward, `solve:${challenge.slug}`);
  if (challenge.category === "beginner") await grantAchievement(db, userId, "linux-explorer");
  if (challenge.slug === "dns-lab-resolve") await grantAchievement(db, userId, "network-apprentice");
  if (challenge.category === "intermediate") await grantAchievement(db, userId, "web-security-student");
  if (challenge.category === "advanced") await grantAchievement(db, userId, "security-analyst");
  if (challenge.slug === "cert-assessment") await grantAchievement(db, userId, "master-hacker");
  await maybeGrantTierBadges(db, userId);
  return { awarded: challenge.xp_reward, already: false };
}

export async function validateFlag(db: SupabaseClient, challengeId: string, flag: string) {
  const { data: rows } = await db.from("challenge_flags").select("flag_hash").eq("challenge_id", challengeId);
  const submitted = hashFlag(flag);
  return (rows ?? []).some((row) => hashesEqual(submitted, row.flag_hash));
}

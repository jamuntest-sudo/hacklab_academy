import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function grantAchievement(
  db: SupabaseClient,
  userId: string,
  slug: string,
) {
  const { data: achievement } = await db
    .from("achievements")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!achievement) return;
  await db.from("user_achievements").upsert(
    { user_id: userId, achievement_id: achievement.id },
    { onConflict: "user_id,achievement_id" },
  );
}

export async function addXp(
  db: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
) {
  if (amount === 0) return;
  const { data: profile } = await db
    .from("profiles")
    .select("xp")
    .eq("id", userId)
    .single();
  const next = Math.max(0, (profile?.xp ?? 0) + amount);
  await db.from("profiles").update({ xp: next }).eq("id", userId);
  await db.from("xp_events").insert({ user_id: userId, amount, reason });
}

export async function maybeGrantTierBadges(db: SupabaseClient, userId: string) {
  const [{ count }, { data: profile }] = await Promise.all([
    db
      .from("challenge_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("correct", true),
    db.from("profiles").select("xp").eq("id", userId).single(),
  ]);
  if ((count ?? 0) >= 8) await grantAchievement(db, userId, "ctf-champion");
  if ((profile?.xp ?? 0) >= 1800) await grantAchievement(db, userId, "master-hacker");
}

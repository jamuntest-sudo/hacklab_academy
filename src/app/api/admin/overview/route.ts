import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (gate.error) return gate.error;
  const db = gate.db;
  const [
    users,
    active,
    solves,
    labs,
    activity,
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
    db.from("challenge_submissions").select("*", { count: "exact", head: true }).eq("correct", true),
    db.from("lab_instances").select("*", { count: "exact", head: true }).eq("status", "running"),
    db.from("xp_events").select("id, reason, amount, created_at, user_id").order("created_at", { ascending: false }).limit(12),
  ]);
  return NextResponse.json({
    totalUsers: users.count ?? 0,
    activeUsers: active.count ?? 0,
    completedChallenges: solves.count ?? 0,
    activeLabs: labs.count ?? 0,
    recentActivity: activity.data ?? [],
  });
}

import { NextResponse } from "next/server";
import { clearAdminCookie, getAdminSession } from "@/lib/admin-session";
import { audit } from "@/lib/admin-guard";
import { createServiceSupabase } from "@/lib/supabase/admin";

export async function POST() {
  const session = await getAdminSession();
  const db = createServiceSupabase();
  if (session && db) await audit(db, "admin_logout", session.email, "auth");
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}

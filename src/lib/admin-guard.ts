import "server-only";

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/origin";

export async function requireAdmin(request: Request, write = false) {
  if (write && !assertSameOrigin(request)) {
    return { error: NextResponse.json({ error: "Invalid origin." }, { status: 403 }) };
  }
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Administrator authentication required." }, { status: 401 }) };
  }
  const db = createServiceSupabase();
  if (!db) {
    return { error: NextResponse.json({ error: "Database unavailable." }, { status: 503 }) };
  }
  return { session, db };
}

export async function audit(
  db: ReturnType<typeof createServiceSupabase>,
  action: string,
  actor: string,
  target?: string,
  metadata: Record<string, unknown> = {},
  ip?: string | null,
) {
  if (!db) return;
  await db.from("admin_audit_logs").insert({
    actor_email: actor,
    action,
    target,
    metadata,
    ip,
  });
}

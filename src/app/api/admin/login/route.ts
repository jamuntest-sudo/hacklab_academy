import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminToken, setAdminCookie } from "@/lib/admin-session";
import { audit } from "@/lib/admin-guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/admin";

const schema = z.object({
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const limited = rateLimit(`admin-login:${clientIp(request)}`, 5, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many login attempts. Try later." }, { status: 429 });
  }
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Password required." }, { status: 400 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { data: owners } = await db.from("admin_owners").select("email, password_hash").limit(1);
  const owner = owners?.[0];
  if (!owner) return NextResponse.json({ error: "Owner is not provisioned." }, { status: 403 });
  const ok = await bcrypt.compare(body.data.password, owner.password_hash);
  if (!ok) {
    await audit(db, "admin_login_failed", owner.email, "auth", {}, clientIp(request));
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }
  await db.from("admin_owners").update({ last_login_at: new Date().toISOString() }).eq("email", owner.email);
  await audit(db, "admin_login", owner.email, "auth", {}, clientIp(request));
  const token = await createAdminToken(owner.email);
  await setAdminCookie(token);
  return NextResponse.json({ ok: true });
}

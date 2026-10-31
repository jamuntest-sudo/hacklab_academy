import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { tokensEqual } from "@/lib/crypto";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { createAdminToken, setAdminCookie } from "@/lib/admin-session";
import { audit } from "@/lib/admin-guard";

const schema = z.object({
  token: z.string().min(16).max(200),
  email: z.string().email().max(320),
  password: z.string().min(16).max(128),
});

export async function POST(request: Request) {
  const limited = rateLimit(`admin-setup:${clientIp(request)}`, 5, 15 * 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  const expected = process.env.OWNER_SETUP_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Owner setup is not configured." }, { status: 503 });
  }

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Email, 16+ character password, and setup token required." }, { status: 400 });
  }
  if (!tokensEqual(body.data.token, expected)) {
    return NextResponse.json({ error: "Invalid setup token." }, { status: 403 });
  }

  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { count } = await db.from("admin_owners").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Owner already provisioned." }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(body.data.password, 12);
  const { error } = await db.from("admin_owners").insert({
    email: body.data.email.toLowerCase(),
    password_hash,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(db, "owner_provisioned", body.data.email, "admin_owners", {}, clientIp(request));
  const token = await createAdminToken(body.data.email.toLowerCase());
  await setAdminCookie(token);
  return NextResponse.json({ ok: true });
}

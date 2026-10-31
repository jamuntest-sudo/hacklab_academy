import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { tokensEqual } from "@/lib/crypto";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { audit } from "@/lib/admin-guard";

const schema = z.object({
  token: z.string().min(16),
  email: z.string().email(),
  password: z.string().min(16).max(128),
});

export async function POST(request: Request) {
  const limited = rateLimit(`admin-recover:${clientIp(request)}`, 3, 30 * 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const expected = process.env.OWNER_RECOVERY_TOKEN;
  if (!expected) return NextResponse.json({ error: "Recovery is not configured." }, { status: 503 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid recovery payload." }, { status: 400 });
  if (!tokensEqual(body.data.token, expected)) {
    return NextResponse.json({ error: "Invalid recovery token." }, { status: 403 });
  }
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { data: owner } = await db
    .from("admin_owners")
    .select("id, email")
    .eq("email", body.data.email.toLowerCase())
    .maybeSingle();
  if (!owner) return NextResponse.json({ error: "Owner email does not match." }, { status: 403 });
  const password_hash = await bcrypt.hash(body.data.password, 12);
  await db.from("admin_owners").update({ password_hash }).eq("id", owner.id);
  await audit(db, "owner_password_recovered", owner.email, "admin_owners", {}, clientIp(request));
  return NextResponse.json({ ok: true });
}

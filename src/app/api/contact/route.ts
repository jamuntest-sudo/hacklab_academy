import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/origin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(320),
  topic: z.string().min(3).max(80),
  message: z.string().min(10).max(4000),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const limited = rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many messages." }, { status: 429 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Check the form fields." }, { status: 400 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  await db.from("contact_messages").insert(body.data);
  return NextResponse.json({ ok: true });
}

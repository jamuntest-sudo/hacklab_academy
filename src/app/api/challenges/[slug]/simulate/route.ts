import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { alreadySolved } from "@/lib/challenges";
import { assertSameOrigin } from "@/lib/origin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/admin";

const schema = z.object({
  username: z.string().max(120).optional(),
  password: z.string().max(120).optional(),
  payload: z.string().max(500).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const limited = rateLimit(`sim:${clientIp(request)}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited." }, { status: 429 });

  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const db = createServiceSupabase();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const { slug } = await context.params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { data: challenge } = await db
    .from("challenges")
    .select("id, slug")
    .eq("slug", slug)
    .eq("enabled", true)
    .maybeSingle();
  if (!challenge) return NextResponse.json({ error: "Unknown training app." }, { status: 404 });

  const solved = await alreadySolved(db, user.id, challenge.id);

  if (slug === "training-shop-login") {
    const username = body.data.username ?? "";
    const looksInjected = /'\s*or\s+'?1'?\s*=\s*'?1/i.test(username) || username.includes("'--");
    if (!looksInjected) {
      return NextResponse.json({
        ok: false,
        message: "Login failed on the training shop. This simulator is not a general database.",
      });
    }
    return NextResponse.json({
      ok: true,
      message: solved
        ? "Training condition matched. Submit the flag you already collected."
        : "Training condition matched on the isolated shop. Submit the issued training flag on this page.",
      flagHint: "The flag uses the HLA{...} format and names the durable defensive control.",
    });
  }

  if (slug === "xss-sandbox") {
    const payload = body.data.payload ?? "";
    const hit = /<script>alert\((['"])hla\1\)<\/script>/i.test(payload);
    if (!hit) {
      return NextResponse.json({
        ok: false,
        rendered: "Training output encoding blocked this input.",
      });
    }
    return NextResponse.json({
      ok: true,
      rendered: "Sandbox marker accepted. Encode untrusted output in production.",
      flagHint: "Submit the HLA flag that names output encoding.",
    });
  }

  return NextResponse.json({ error: "No simulator for this challenge." }, { status: 400 });
}

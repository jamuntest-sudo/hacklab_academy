import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/admin-guard";
import { clientIp } from "@/lib/rate-limit";

const patchSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (gate.error) return gate.error;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  let query = gate.db.from("profiles").select("id, handle, display_name, xp, status, created_at").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);
  const { data } = await query;
  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(request: Request) {
  const gate = await requireAdmin(request, true);
  if (gate.error) return gate.error;
  const body = patchSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid user update." }, { status: 400 });
  await gate.db.from("profiles").update({ status: body.data.status }).eq("id", body.data.userId);
  await audit(gate.db, body.data.status === "suspended" ? "user_suspended" : "user_restored", gate.session.email, body.data.userId, {}, clientIp(request));
  return NextResponse.json({ ok: true });
}

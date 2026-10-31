import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/admin-guard";
import { clientIp } from "@/lib/rate-limit";

const courseSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(80),
  title: z.string().min(3).max(160),
  summary: z.string().min(10).max(500),
  level: z.number().int().min(1).max(4),
  published: z.boolean().optional(),
});

const lessonSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  slug: z.string().min(2).max(80),
  title: z.string().min(3).max(160),
  summary: z.string().min(8).max(400),
  content: z.array(z.object({ type: z.string(), text: z.string() })).optional(),
  delete: z.boolean().optional(),
});

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (gate.error) return gate.error;
  const [{ data: courses }, { data: lessons }, { data: paths }] = await Promise.all([
    gate.db.from("courses").select("*").order("sort_order"),
    gate.db.from("lessons").select("*").order("sort_order"),
    gate.db.from("learning_paths").select("*").order("sort_order"),
  ]);
  return NextResponse.json({ courses: courses ?? [], lessons: lessons ?? [], paths: paths ?? [] });
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request, true);
  if (gate.error) return gate.error;
  const json = await request.json().catch(() => null);
  if (json?.entity === "lesson") {
    const body = lessonSchema.safeParse(json);
    if (!body.success) return NextResponse.json({ error: "Invalid lesson." }, { status: 400 });
    if (body.data.delete && body.data.id) {
      await gate.db.from("lessons").delete().eq("id", body.data.id);
      await audit(gate.db, "lesson_deleted", gate.session.email, body.data.id, {}, clientIp(request));
      return NextResponse.json({ ok: true });
    }
    const payload = {
      course_id: body.data.course_id,
      slug: body.data.slug,
      title: body.data.title,
      summary: body.data.summary,
      content: body.data.content ?? [{ type: "p", text: body.data.summary }],
    };
    if (body.data.id) await gate.db.from("lessons").update(payload).eq("id", body.data.id);
    else await gate.db.from("lessons").insert(payload);
    await audit(gate.db, "lesson_saved", gate.session.email, body.data.slug, {}, clientIp(request));
    return NextResponse.json({ ok: true });
  }
  const body = courseSchema.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid course." }, { status: 400 });
  const payload = {
    slug: body.data.slug,
    title: body.data.title,
    summary: body.data.summary,
    level: body.data.level,
    published: body.data.published ?? true,
  };
  if (body.data.id) await gate.db.from("courses").update(payload).eq("id", body.data.id);
  else await gate.db.from("courses").insert(payload);
  await audit(gate.db, "course_saved", gate.session.email, body.data.slug, {}, clientIp(request));
  return NextResponse.json({ ok: true });
}

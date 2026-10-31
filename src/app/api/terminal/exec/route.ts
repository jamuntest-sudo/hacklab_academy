import { NextResponse } from "next/server";
import { z } from "zod";
import { listingFromFiles } from "@/lib/terminal/engine";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/origin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const LAB_HOSTS: Record<string, { ip: string; txt?: string }> = {
  "lab.hacklab.internal": { ip: "10.8.0.10", txt: "authorized-training-resolver" },
  "shop.lab.hacklab.internal": { ip: "10.8.0.20" },
  "soc.lab.hacklab.internal": { ip: "10.8.0.30" },
};

const bodySchema = z.object({
  challengeSlug: z.string().max(80).optional(),
  cat: z.string().max(200).optional(),
  ls: z
    .object({
      path: z.string().max(200),
      all: z.boolean(),
    })
    .optional(),
  net: z
    .object({
      cmd: z.enum(["dig", "ping"]),
      host: z.string().max(120),
    })
    .optional(),
});

const SANDBOX = [
  { path: "/", is_dir: true, content: null as string | null },
  { path: "/home", is_dir: true, content: null },
  { path: "/home/cadet", is_dir: true, content: null },
  {
    path: "/home/cadet/README.txt",
    is_dir: false,
    content:
      "Authorized training home. Challenge files load when you open a CTF with an attached terminal.",
  },
  { path: "/etc", is_dir: true, content: null },
  { path: "/etc/hostname", is_dir: false, content: "hacklab-workstation" },
];

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const limited = rateLimit(`term:${clientIp(request)}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many terminal requests." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid terminal request." }, { status: 400 });
  }

  const { user, error } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: error ?? "Login required for lab terminal." }, { status: 401 });
  }

  const db = createServiceSupabase();
  let files = SANDBOX;
  if (parsed.data.challengeSlug && db) {
    const { data: challenge } = await db
      .from("challenges")
      .select("id")
      .eq("slug", parsed.data.challengeSlug)
      .eq("enabled", true)
      .maybeSingle();
    if (challenge) {
      const { data } = await db
        .from("terminal_files")
        .select("path, is_dir, content")
        .eq("challenge_id", challenge.id);
      if (data?.length) files = data;
    }
  }

  if (parsed.data.ls) {
    const names = listingFromFiles(files, parsed.data.ls.path, parsed.data.ls.all);
    return NextResponse.json({ lines: names });
  }

  if (parsed.data.cat) {
    const file = files.find((item) => item.path === parsed.data.cat && !item.is_dir);
    if (!file) {
      return NextResponse.json({ lines: [`cat: ${parsed.data.cat}: no such training file`] });
    }
    return NextResponse.json({ lines: (file.content ?? "").split("\n") });
  }

  if (parsed.data.net) {
    const record = LAB_HOSTS[parsed.data.net.host];
    if (!record) {
      return NextResponse.json({
        lines: [`${parsed.data.net.cmd}: host is not in the authorized lab zone`],
      });
    }
    if (parsed.data.net.cmd === "ping") {
      return NextResponse.json({
        lines: [
          `PING ${parsed.data.net.host} (${record.ip}) 56(84) bytes of data.`,
          `64 bytes from ${record.ip}: icmp_seq=1 ttl=64 time=0.4 ms`,
          "training host reachable",
        ],
      });
    }
    const lines = [
      `; <<>> simulated dig @10.8.0.53 ${parsed.data.net.host}`,
      `${parsed.data.net.host}.  300  IN  A  ${record.ip}`,
    ];
    if (parsed.data.challengeSlug === "dns-lab-resolve" && parsed.data.net.host === "lab.hacklab.internal") {
      const txt = files.find((item) => item.path === "/etc/lab-txt");
      if (txt?.content) lines.push(txt.content);
    }
    return NextResponse.json({ lines });
  }

  return NextResponse.json({ lines: [] });
}

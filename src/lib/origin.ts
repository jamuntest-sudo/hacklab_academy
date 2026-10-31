import "server-only";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || !site) return true;
  try {
    return new URL(origin).origin === new URL(site).origin;
  } catch {
    return false;
  }
}

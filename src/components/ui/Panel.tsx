import { cn } from "@/lib/cn";

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glow-border rounded-lg border border-line bg-bg-panel p-6", className)}>
      {children}
    </section>
  );
}

export function StatusNote({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error" | "ok";
}) {
  const color =
    tone === "error" ? "border-danger text-danger" : tone === "ok" ? "border-neon text-neon" : "border-line text-muted";
  return <p className={cn("rounded border px-3 py-2 font-mono text-sm", color)}>{children}</p>;
}

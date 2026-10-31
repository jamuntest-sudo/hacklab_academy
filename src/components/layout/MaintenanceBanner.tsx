import { createServerSupabase } from "@/lib/supabase/server";

export async function MaintenanceBanner() {
  if (process.env.MAINTENANCE_MODE === "true") {
    return (
      <p className="border-b border-warn/40 bg-warn/10 px-4 py-2 text-center font-mono text-xs text-warn">
        Maintenance mode is enabled. Student labs may be unavailable.
      </p>
    );
  }
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("site_settings").select("maintenance_mode, announcement").eq("id", 1).maybeSingle();
  if (!data) return null;
  if (data.maintenance_mode) {
    return (
      <p className="border-b border-warn/40 bg-warn/10 px-4 py-2 text-center font-mono text-xs text-warn">
        {data.announcement || "HackLab Academy is in maintenance mode."}
      </p>
    );
  }
  if (data.announcement) {
    return (
      <p className="border-b border-line bg-bg-raised px-4 py-2 text-center font-mono text-xs text-neon">
        {data.announcement}
      </p>
    );
  }
  return null;
}

import { getSupabaseAdmin } from "./supabase";

export async function logEvent(
  event: string,
  tier?: number,
  detail?: Record<string, unknown>,
) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("logs").insert({
      event,
      tier: tier ?? null,
      detail: detail ?? null,
    });
  } catch {
    // Never let logging break the app
  }
}

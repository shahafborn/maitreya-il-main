import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCountryCode } from "./useCountryCode";

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image_storage_path: string | null;
  event_date: string | null;
  event_end_date: string | null;
  link_url: string;
  region: "il" | "international" | "all";
  language: "he" | "en";
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Today in Israel as YYYY-MM-DD, to compare against the dates stored on a promotion. */
const todayInIsrael = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/**
 * A promotion for an event that is over hides itself, without anyone having to
 * remember to switch it off: once the last day has passed it drops out. A
 * promotion with no dates at all is evergreen and always shows.
 */
export function hasEnded(p: Pick<Promotion, "event_date" | "event_end_date">, today = todayInIsrael()) {
  const last = (p.event_end_date ?? p.event_date ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(last) && last < today;
}

/** Active promotions filtered by user's detected region, minus anything already over. */
export function useActivePromotions() {
  const { countryCode, loading: geoLoading } = useCountryCode();

  const query = useQuery<Promotion[]>({
    queryKey: ["promotions", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Promotion[];
    },
  });

  const userRegion = countryCode === "IL" ? "il" : "international";
  const filtered = (query.data ?? []).filter(
    (p) => (p.region === "all" || p.region === userRegion) && !hasEnded(p),
  );

  return {
    ...query,
    data: filtered,
    loading: query.isLoading || geoLoading,
  };
}

/** All promotions for admin management. */
export function useAllPromotions() {
  return useQuery<Promotion[]>({
    queryKey: ["promotions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Promotion[];
    },
  });
}

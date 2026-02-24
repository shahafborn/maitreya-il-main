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

/** Active promotions filtered by user's detected region. */
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
    (p) => p.region === "all" || p.region === userRegion,
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

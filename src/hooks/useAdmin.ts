import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "super_admin" | "admin" | "editor" | "registrar";

const ROLE_PRIORITY: Record<AppRole, number> = {
  super_admin: 3,
  admin: 2,
  editor: 1,
  // Registrar only registers people who paid directly (PayPal / cash) - see
  // /admin/registrations. It is NOT an admin role anywhere else on the site.
  registrar: 0,
};

/** Check the current user's admin/editor/registrar role (highest takes precedence). */
export function useAdmin() {
  const { user } = useAuth();

  const query = useQuery<AppRole | null>({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin", "editor", "registrar"]);
      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Pick the highest-priority role
      let best: AppRole | null = null;
      for (const row of data) {
        const role = row.role as AppRole;
        if (!best || ROLE_PRIORITY[role] > ROLE_PRIORITY[best]) {
          best = role;
        }
      }
      return best;
    },
    enabled: !!user,
  });

  const role = query.data ?? null;

  return {
    role,
    isSuperAdmin: role === "super_admin",
    isAdminOrAbove: role === "super_admin" || role === "admin",
    isEditor: role === "editor",
    /** True if user has an admin role (super_admin, admin, or editor). A registrar is NOT an admin. */
    isAdmin: role !== null && role !== "registrar",
    isRegistrar: role === "registrar",
    /** May register people who paid directly (PayPal / cash): any staff role, including registrar. */
    canRegisterPayments: role !== null,
    loading: query.isLoading,
  };
}

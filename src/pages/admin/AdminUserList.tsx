import { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRole } from "@/hooks/useAdmin";

const PAGE_SIZE = 25;

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  editor: "bg-green-100 text-green-800 border-green-200",
};

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in: string | null;
}

function useUsers(page: number, search: string) {
  return useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = supabase
        .from("profiles")
        .select("id, email, full_name, created_at, last_sign_in", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.trim()) {
        q = q.ilike("email", `%${search.trim()}%`);
      }

      const { data, count, error } = await q;
      if (error) throw error;
      return { users: (data ?? []) as UserRow[], total: count ?? 0 };
    },
  });
}

function useAllRoles() {
  return useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;

      const map = new Map<string, AppRole[]>();
      for (const row of data ?? []) {
        const role = row.role as AppRole;
        if (["super_admin", "admin", "editor"].includes(role)) {
          if (!map.has(row.user_id)) map.set(row.user_id, []);
          map.get(row.user_id)!.push(role);
        }
      }
      return map;
    },
  });
}

function useEnrollmentCounts() {
  return useQuery({
    queryKey: ["admin-enrollment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("user_id");
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
      }
      return counts;
    },
  });
}

const AdminUserList = () => {
  useDocumentTitle("Users | Admin | Maitreya");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useUsers(page, search);
  const { data: rolesMap } = useAllRoles();
  const { data: enrollmentCounts } = useEnrollmentCounts();

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-primary">Users</h2>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="animate-pulse text-muted-foreground">Loading users...</div>
      ) : (
        <>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roles = rolesMap?.get(user.id) ?? [];
                  const enrollCount = enrollmentCounts?.get(user.id) ?? 0;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_sign_in
                          ? new Date(user.last_sign_in).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>{enrollCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={ROLE_COLORS[role]}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUserList;

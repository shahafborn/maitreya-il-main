import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AppRole } from "@/hooks/useAdmin";

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  editor: "bg-green-100 text-green-800 border-green-200",
};

const ASSIGNABLE_ROLES: AppRole[] = ["super_admin", "admin", "editor"];

interface StaffMember {
  userId: string;
  email: string;
  fullName: string;
  roles: AppRole[];
}

function useStaffList() {
  return useQuery({
    queryKey: ["admin-staff-list"],
    queryFn: async () => {
      // Get all role assignments (for privileged roles)
      const { data: roleRows, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) throw rErr;

      // Filter to privileged roles
      const privileged = (roleRows ?? []).filter((r) =>
        ["super_admin", "admin", "editor"].includes(r.role),
      );

      // Group by user_id
      const userRoles = new Map<string, AppRole[]>();
      for (const row of privileged) {
        if (!userRoles.has(row.user_id)) userRoles.set(row.user_id, []);
        userRoles.get(row.user_id)!.push(row.role as AppRole);
      }

      // Get profiles for these users
      const userIds = [...userRoles.keys()];
      if (userIds.length === 0) return [];

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);
      if (pErr) throw pErr;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p]),
      );

      return userIds.map((uid): StaffMember => {
        const profile = profileMap.get(uid);
        return {
          userId: uid,
          email: profile?.email ?? "unknown",
          fullName: profile?.full_name ?? "",
          roles: userRoles.get(uid) ?? [],
        };
      });
    },
  });
}

function useSuperAdminCount() {
  return useQuery({
    queryKey: ["admin-super-admin-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin");
      if (error) throw error;
      return (data ?? []).length;
    },
  });
}

const AdminStaffManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: staff = [], isLoading } = useStaffList();
  const { data: superAdminCount = 0 } = useSuperAdminCount();

  // Add staff dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; email: string; full_name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>("editor");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-staff-list"] });
    queryClient.invalidateQueries({ queryKey: ["admin-super-admin-count"] });
    queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", `%${searchEmail.trim()}%`)
        .limit(10);
      if (error) throw error;
      setSearchResults(data ?? []);
    } finally {
      setSearching(false);
    }
  };

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role })
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setAddOpen(false);
      setSearchEmail("");
      setSearchResults([]);
    },
  });

  const revokeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Safety: prevent revoking own super_admin
      if (userId === user?.id && role === "super_admin") {
        throw new Error("Cannot revoke your own super_admin role");
      }
      // Safety: prevent revoking last super_admin
      if (role === "super_admin" && superAdminCount <= 1) {
        throw new Error("Cannot revoke the last super_admin");
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-primary">Staff Management</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                />
                <Button
                  variant="outline"
                  onClick={searchUsers}
                  disabled={searching}
                >
                  {searching ? "..." : "Search"}
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Role to assign</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-mono text-sm">{u.email}</p>
                        {u.full_name && (
                          <p className="text-xs text-muted-foreground">{u.full_name}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => assignRole.mutate({ userId: u.id, role: selectedRole })}
                        disabled={assignRole.isPending}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {assignRole.isError && (
                <p className="text-sm text-destructive">
                  {(assignRole.error as Error).message}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-muted-foreground">Loading staff...</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-mono text-sm">{member.email}</TableCell>
                  <TableCell>{member.fullName || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {member.roles.map((role) => (
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
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      {member.roles.map((role) => {
                        const isSelf = member.userId === user?.id && role === "super_admin";
                        const isLastSuper = role === "super_admin" && superAdminCount <= 1;
                        const disabled = isSelf || isLastSuper || revokeRole.isPending;

                        return (
                          <Button
                            key={role}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive text-xs"
                            disabled={disabled}
                            title={
                              isSelf
                                ? "Cannot revoke your own super_admin role"
                                : isLastSuper
                                  ? "Cannot revoke the last super_admin"
                                  : `Revoke ${role}`
                            }
                            onClick={() =>
                              revokeRole.mutate({ userId: member.userId, role })
                            }
                          >
                            Revoke {role}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No staff members.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {revokeRole.isError && (
        <p className="text-sm text-destructive mt-4">
          {(revokeRole.error as Error).message}
        </p>
      )}
    </div>
  );
};

export default AdminStaffManagement;

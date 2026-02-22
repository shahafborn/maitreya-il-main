import { useState, lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminCourseList from "./AdminCourseList";
import AdminCourseEditor from "./AdminCourseEditor";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const AdminAnalytics = lazy(() => import("./AdminAnalytics"));
const AdminUserList = lazy(() => import("./AdminUserList"));
const AdminStaffManagement = lazy(() => import("./AdminStaffManagement"));

const AdminLogin = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error: authError } = await signIn(email, password);
      if (authError) setError(authError.message);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="ltr" className="min-h-screen flex items-center justify-center bg-background font-body">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-lg">
        <h1 className="font-heading text-2xl font-bold text-primary text-center mb-6">
          Admin Login
        </h1>

        <Button
          type="button"
          variant="outline"
          className="w-full py-3 text-base rounded-full font-bold mb-4"
          onClick={() => signInWithGoogle("/admin")}
        >
          Sign in with Google
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="text-left"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="text-left"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full font-bold py-3 text-base rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

const LazyFallback = () => (
  <div className="animate-pulse text-muted-foreground">Loading...</div>
);

const AdminDashboard = () => {
  useDocumentTitle("Admin | Maitreya");
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isAdminOrAbove, isSuperAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Loading...</div>
      </div>
    );
  }

  // Not logged in → show login form
  if (!user) {
    return <AdminLogin />;
  }

  // Logged in but not admin/editor → access denied
  if (!isAdmin) {
    return (
      <div dir="ltr" className="min-h-screen flex items-center justify-center bg-background font-body">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
        </div>
      </div>
    );
  }

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`hover:text-foreground transition-colors ${
        location.pathname.includes(to)
          ? "text-foreground font-medium"
          : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div dir="ltr" className="min-h-screen bg-background font-body">
      {/* Admin header */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="font-heading text-lg font-bold text-primary">Admin</h1>
          <nav className="flex gap-4 text-sm">
            {navLink("/admin/courses", "Courses")}
            {isAdminOrAbove && navLink("/admin/analytics", "Analytics")}
            {isAdminOrAbove && navLink("/admin/users", "Users")}
            {isSuperAdmin && navLink("/admin/staff", "Staff")}
          </nav>
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Admin routes */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route index element={<Navigate to="courses" replace />} />
            <Route path="courses" element={<AdminCourseList />} />
            <Route path="courses/:courseId" element={<AdminCourseEditor />} />
            {isAdminOrAbove && (
              <Route path="analytics" element={<AdminAnalytics />} />
            )}
            {isAdminOrAbove && (
              <Route path="users" element={<AdminUserList />} />
            )}
            {isSuperAdmin && (
              <Route path="staff" element={<AdminStaffManagement />} />
            )}
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default AdminDashboard;

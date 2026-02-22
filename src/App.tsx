import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import CourseEnrollmentGate from "./components/CourseEnrollmentGate";
import { usePageTracking } from "@/hooks/usePageTracking";

// Lazy-load course registration + admin (code-split)
const CourseRegister = lazy(() => import("./pages/CourseRegister"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground font-body">Loading...</div>
  </div>
);

const AuthGate = () => {
  usePageTracking();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">טוען...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Existing Healing Course routes (unchanged) */}
        <Route
          path="/heb/healing-online-course"
          element={user ? <Index /> : <Register />}
        />
        <Route path="/" element={user ? <Index /> : <Register />} />

        {/* OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Course resource pages (template-driven by :slug) */}
        <Route path="/courses/:slug/register" element={<CourseRegister />} />
        <Route path="/courses/:slug" element={<CourseEnrollmentGate />} />

        {/* Admin CMS */}
        <Route path="/admin/*" element={<AdminDashboard />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/p">
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

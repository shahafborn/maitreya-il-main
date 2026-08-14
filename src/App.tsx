import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import CourseEnrollmentGate from "./components/CourseEnrollmentGate";
import { usePageTracking } from "@/hooks/usePageTracking";

// Lazy-load course registration + admin + public event pages (code-split)
const CourseRegister = lazy(() => import("./pages/CourseRegister"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EinGediRetreat = lazy(() => import("./pages/EinGediRetreat"));
const EinGediRetreatV2 = lazy(() => import("./pages/EinGediRetreatV2"));
const HeartOfWisdomRetreat = lazy(() => import("./pages/HeartOfWisdomRetreat"));
const HeartOfWisdomRetreatEN = lazy(() => import("./pages/HeartOfWisdomRetreatEN"));
const EinGediHealingRetreatEN = lazy(() => import("./pages/EinGediHealingRetreatEN"));
const UmaZubTri = lazy(() => import("./pages/UmaZubTri"));
const YamantakaOnlineRetreat = lazy(() => import("./pages/YamantakaOnlineRetreat"));
const WeeklyPractices = lazy(() => import("./pages/WeeklyPractices"));

// Site pages (WordPress-replacement, /he + /en trees) - see content/README.md
const SiteHome = lazy(() => import("./site/pages/SiteHome"));
const SiteAbout = lazy(() => import("./site/pages/SiteAbout"));
const SiteArticlesIndex = lazy(() => import("./site/pages/SiteArticlesIndex"));
const SiteArticle = lazy(() => import("./site/pages/SiteArticle"));
const SiteEventsIndex = lazy(() => import("./site/pages/SiteEventsIndex"));
const SiteContact = lazy(() => import("./site/pages/SiteContact"));
const SiteGallery = lazy(() => import("./site/pages/SiteGallery"));

const queryClient = new QueryClient();

const ExternalRedirect = ({ url }: { url: string }) => {
  window.location.replace(url);
  return null;
};

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
        {/* Healing Retreat — canonical path */}
        <Route
          path="/discover/healing-retreat"
          element={user ? <Index /> : <Register />}
        />
        {/* Legacy URL → redirect */}
        <Route path="/heb/healing-online-course" element={<Navigate to="/discover/healing-retreat" replace />} />
        {/* Root → external main site */}
        <Route path="/" element={<ExternalRedirect url="https://maitreya.org.il" />} />

        {/* OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Password reset */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Course resource pages (template-driven by :slug) */}
        <Route path="/courses/:slug/register" element={<CourseRegister />} />
        <Route path="/courses/:slug" element={<CourseEnrollmentGate />} />

        {/* Admin CMS */}
        <Route path="/admin/*" element={<AdminDashboard />} />

        <Route path="*" element={<ExternalRedirect url="https://maitreya.org.il" />} />
      </Routes>
    </Suspense>
  );
};

const AppRoutes = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      {/* Public event pages — no auth required */}
      <Route path="/events/ein-gedi-healing-retreat" element={<EinGediRetreatV2 />} />
      <Route path="/events/ein-gedi-v1" element={<EinGediRetreat />} />
      <Route path="/events/ein-gedi-v2" element={<EinGediRetreatV2 />} />
      <Route path="/events/heart-of-wisdom-retreat" element={<HeartOfWisdomRetreat />} />
      <Route path="/events/en/heart-of-wisdom-retreat" element={<HeartOfWisdomRetreatEN />} />
      <Route path="/events/en/ein-gedi-healing-retreat" element={<EinGediHealingRetreatEN />} />

      {/* Uma Zub Tri online course (Hebrew, public) */}
      <Route path="/events/uma-zub-tri" element={<UmaZubTri />} />

      {/* Yamantaka three-month online retreat (Hebrew, public) */}
      <Route path="/events/yamantaka-online-2026" element={<YamantakaOnlineRetreat />} />

      {/* Weekly practices schedule (Hebrew, public) */}
      <Route path="/practices" element={<WeeklyPractices />} />

      {/* Site pages (WordPress replacement) - public, bilingual trees */}
      <Route path="/he" element={<SiteHome lang="he" />} />
      <Route path="/he/about" element={<SiteAbout lang="he" />} />
      <Route path="/he/events" element={<SiteEventsIndex lang="he" />} />
      <Route path="/he/articles" element={<SiteArticlesIndex lang="he" />} />
      <Route path="/he/articles/:slug" element={<SiteArticle lang="he" />} />
      <Route path="/he/gallery" element={<SiteGallery lang="he" />} />
      <Route path="/he/contact" element={<SiteContact lang="he" />} />
      <Route path="/en" element={<SiteHome lang="en" />} />
      <Route path="/en/about" element={<SiteAbout lang="en" />} />
      <Route path="/en/events" element={<SiteEventsIndex lang="en" />} />
      <Route path="/en/articles" element={<SiteArticlesIndex lang="en" />} />
      <Route path="/en/articles/:slug" element={<SiteArticle lang="en" />} />
      <Route path="/en/contact" element={<SiteContact lang="en" />} />

      {/* Root: the site's Hebrew front door (replaces the old redirect to WordPress) */}
      <Route path="/" element={<Navigate to="/he" replace />} />

      {/* Everything else goes through AuthGate */}
      <Route path="/*" element={<AuthGate />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/p">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

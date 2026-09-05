import { lazy, Suspense, useEffect, useRef } from "react";
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
import { takePrerendered, releasePrerendered } from "./prerendered";

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
const SiteDana = lazy(() => import("./site/pages/SiteDana"));
const SiteDocPage = lazy(() => import("./site/pages/SiteDocPage"));

const queryClient = new QueryClient();

/**
 * Suspense fallback. On a pre-rendered page the first fallback shows the
 * server HTML verbatim (src/prerendered.ts) so a lazy route chunk loading
 * never blanks the screen; everywhere else it is the usual pulse.
 */
const Loading = () => {
  const prerendered = useRef<string | null | undefined>(undefined);
  if (prerendered.current === undefined) prerendered.current = takePrerendered();
  // The fallback unmounts exactly when the real page component mounts
  useEffect(() => () => releasePrerendered(), []);
  if (prerendered.current) return <div dangerouslySetInnerHTML={{ __html: prerendered.current }} />;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground font-body">Loading...</div>
    </div>
  );
};

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

        {/* OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Password reset */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Course resource pages (template-driven by :slug) */}
        <Route path="/courses/:slug/register" element={<CourseRegister />} />
        <Route path="/courses/:slug" element={<CourseEnrollmentGate />} />

        {/* Admin CMS */}
        <Route path="/admin/*" element={<AdminDashboard />} />

        {/* Unknown URL: a real 404 page (the server also serves 404.html with a 404 status) */}
        <Route path="*" element={<NotFound />} />
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

      {/* Terms pages (migrated from WordPress): linked from the registration forms */}
      <Route
        path="/events/ein-gedi-healing-retreat/terms"
        element={<SiteDocPage lang="he" name="ein-gedi-terms" path="/events/ein-gedi-healing-retreat/terms" />}
      />
      <Route path="/events/online-terms" element={<SiteDocPage lang="he" name="online-terms" path="/events/online-terms" />} />

      {/*
        Site pages (the WordPress replacement) - public, bilingual.
        Hebrew is the primary language and lives unprefixed at the root;
        English lives under /en. The scheme is defined once in src/site/content.ts
        (sitePath) - keep these routes in sync with it. The old /he/... WordPress
        URLs are redirected server-side (scripts/redirects.mjs).
      */}
      <Route path="/" element={<SiteHome lang="he" />} />
      <Route path="/about" element={<SiteAbout lang="he" />} />
      <Route path="/events" element={<SiteEventsIndex lang="he" />} />
      <Route path="/articles" element={<SiteArticlesIndex lang="he" />} />
      <Route path="/articles/:slug" element={<SiteArticle lang="he" />} />
      <Route path="/gallery" element={<SiteGallery lang="he" />} />
      <Route path="/dana" element={<SiteDana lang="he" />} />
      <Route path="/contact" element={<SiteContact lang="he" />} />
      <Route path="/en" element={<SiteHome lang="en" />} />
      <Route path="/en/about" element={<SiteAbout lang="en" />} />
      <Route path="/en/events" element={<SiteEventsIndex lang="en" />} />
      <Route path="/en/articles" element={<SiteArticlesIndex lang="en" />} />
      <Route path="/en/articles/:slug" element={<SiteArticle lang="en" />} />
      <Route path="/en/dana" element={<SiteDana lang="en" />} />
      <Route path="/en/contact" element={<SiteContact lang="en" />} />

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
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

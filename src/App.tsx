import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface AppProps {
  pendingOAuthTokens?: { access_token: string; refresh_token: string } | null;
}

const App = ({ pendingOAuthTokens }: AppProps) => {
  useEffect(() => {
    if (!pendingOAuthTokens) return;

    console.log("[AUTH DEBUG] App mounted, calling setSession...");
    supabase.auth
      .setSession(pendingOAuthTokens)
      .then((result) => {
        console.log("[AUTH DEBUG] setSession SUCCESS:", result.data?.session ? "session established" : "no session");
        if (result.error) console.error("[AUTH DEBUG] setSession error:", result.error);
      })
      .catch((err) => {
        console.error("[AUTH DEBUG] setSession EXCEPTION:", err);
      });
  }, [pendingOAuthTokens]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

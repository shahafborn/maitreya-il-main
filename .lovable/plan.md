

## Add Console Logging to Debug OAuth Hash Parsing

Add detailed `console.log` statements throughout the hash parsing logic in `src/main.tsx` so we can see exactly what's happening on the published URL after Google OAuth redirect.

### Changes to `src/main.tsx`

Add logs at every decision point:

```typescript
const hash = window.location.hash;
console.log("[AUTH DEBUG] Hash fragment:", hash ? hash.substring(0, 50) + "..." : "(empty)");
console.log("[AUTH DEBUG] Full URL:", window.location.href.substring(0, 100) + "...");

if (hash && hash.includes("access_token=")) {
  console.log("[AUTH DEBUG] Found access_token in hash, parsing...");
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  console.log("[AUTH DEBUG] Access token found:", !!accessToken);
  console.log("[AUTH DEBUG] Refresh token found:", !!refreshToken);

  if (accessToken && refreshToken) {
    window.history.replaceState(null, "", window.location.pathname);
    console.log("[AUTH DEBUG] Calling setSession...");

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then((result) => {
        console.log("[AUTH DEBUG] setSession SUCCESS:", result.data?.session ? "session established" : "no session returned");
        console.log("[AUTH DEBUG] setSession error:", result.error);
        createRoot(document.getElementById("root")!).render(<App />);
      })
      .catch((err) => {
        console.error("[AUTH DEBUG] setSession EXCEPTION:", err);
        createRoot(document.getElementById("root")!).render(<App />);
      });
  } else {
    console.log("[AUTH DEBUG] Missing tokens, rendering without session");
    createRoot(document.getElementById("root")!).render(<App />);
  }
} else {
  console.log("[AUTH DEBUG] No hash tokens found, normal render");
  createRoot(document.getElementById("root")!).render(<App />);
}
```

### After publishing, please:
1. Go to `maitreya-il.lovable.app/admin`
2. Click Google login
3. After redirect, open DevTools (F12 or right-click > Inspect > Console)
4. Copy/paste all lines starting with `[AUTH DEBUG]` and share them here

This will tell us exactly where the flow breaks.


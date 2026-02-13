

## Rebuild: Admin Login Flow From Scratch

The current auth logic has accumulated patches that created complexity. This plan rewrites the entire auth flow in `src/pages/Admin.tsx` with a clean, simple approach.

### Problem
The current auth initialization has multiple competing mechanisms (getSession, onAuthStateChange, token detection, safety timeouts) that conflict with each other, causing redirect loops after Google login.

### New Approach
A single, clean auth flow with clear state management:

1. **Only use `onAuthStateChange`** as the single source of truth for auth state -- no manual `getSession()` call needed
2. **Detect `__lovable_token` in URL** to know we're in an OAuth callback and should stay in loading state until the auth bridge processes the token
3. **One simple timeout** as a safety net

### Technical Changes

**File: `src/pages/Admin.tsx`** -- Replace the auth `useEffect` (lines 48-118) entirely:

```typescript
useEffect(() => {
  let isMounted = true;
  const isOAuthCallback = window.location.search.includes('__lovable_token');

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (isMounted) setIsAdmin(!!data);
    } catch {
      if (isMounted) setIsAdmin(false);
    }
    if (isMounted) setLoading(false);
  };

  // Single source of truth for auth state
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        // Use setTimeout to avoid Supabase auth deadlock
        setTimeout(() => checkAdminRole(currentUser.id), 0);
      } else {
        setIsAdmin(false);
        // Only show login form if this is NOT an OAuth callback in progress
        if (!isOAuthCallback) {
          setLoading(false);
        }
      }
    }
  );

  // Safety timeout: always clear loading after 5 seconds
  const timeout = setTimeout(() => {
    if (isMounted) setLoading(false);
  }, 5000);

  return () => {
    isMounted = false;
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}, []);
```

### Why This Works

- **No `getSession()` call** -- eliminates the race condition entirely. `onAuthStateChange` fires on mount with the current session AND fires again when the auth bridge processes the OAuth token.
- **`isOAuthCallback` flag** -- captured once on mount. If the URL has `__lovable_token`, we know we're returning from Google and should NOT show the login form when the first `onAuthStateChange` fires with `null`.
- **`setLoading(false)` inside `checkAdminRole`** -- loading clears only after both auth AND role check are complete.
- **5-second safety timeout** -- ultimate fallback to prevent infinite loading.
- **No more `getSession` vs `onAuthStateChange` conflict** -- one mechanism, one flow.

### What Stays the Same
- Login form UI (email/password + Google)
- Admin dashboard UI (videos + content tabs)
- All save/update handlers
- Google sign-in redirect to `/admin`
- Role checking via `user_roles` table

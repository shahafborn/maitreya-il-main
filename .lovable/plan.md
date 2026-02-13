

## Fix: Admin Page Stuck on "Loading..."

### Root Cause
The Admin component relies entirely on `supabase.auth.onAuthStateChange()` to set `loading` to `false`. The `getSession()` call is made *after* setting up the listener, but in certain scenarios (Supabase JS v2.95+), the INITIAL_SESSION event from `onAuthStateChange` may not fire reliably, causing `setLoading(false)` to never execute. The page remains stuck on the "Loading..." screen.

### Solution
Restructure the auth initialization in `Admin.tsx` to:

1. Call `getSession()` explicitly and handle its result directly (set user, check admin role, set loading=false)
2. Keep `onAuthStateChange` only for **subsequent** auth state changes (sign-in, sign-out, token refresh)
3. This guarantees `setLoading(false)` is always called regardless of event listener behavior

### Technical Changes

**File: `src/pages/Admin.tsx`**

Replace the `useEffect` that handles auth (lines ~51-69) with:

```typescript
useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    if (currentUser) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    }
    setLoading(false);
  };

  checkSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

Key differences:
- `getSession()` result is handled directly via `await`, guaranteeing `setLoading(false)` runs
- `onAuthStateChange` listener remains for live updates (logout, token refresh) but does not control the loading state
- No behavioral changes to the rest of the component


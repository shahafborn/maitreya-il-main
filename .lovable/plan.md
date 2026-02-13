

## Fix: Admin Page Stuck on "Loading..." - Robust Solution

### Root Cause

The `checkSession()` function calls `await supabase.auth.getSession()` without any error handling. If this call throws an error (e.g., corrupt localStorage token, internal auth initialization lock) or hangs indefinitely, `setLoading(false)` never executes, leaving the page permanently stuck on "Loading...".

Evidence: After 15+ seconds, zero XHR/Fetch network requests are observed, meaning the Supabase client's internal auth initialization is not completing.

### Solution

Make the auth initialization bulletproof with three changes:

1. **Set up `onAuthStateChange` BEFORE calling `getSession()`** - This follows the Supabase-recommended initialization order and prevents internal deadlocks
2. **Wrap `getSession()` in try/catch/finally** - Guarantees `setLoading(false)` runs even if the call throws
3. **Add a safety timeout** - If auth initialization takes more than 5 seconds, force `setLoading(false)` so the user sees the login form instead of an infinite spinner

### Technical Changes

**File: `src/pages/Admin.tsx`**

Replace the auth `useEffect` (lines 48-85) with:

```typescript
useEffect(() => {
  let isMounted = true;

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
  };

  // Set up listener FIRST (Supabase recommended order)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setTimeout(() => checkAdminRole(currentUser.id), 0);
      } else {
        setIsAdmin(false);
      }
    }
  );

  // Then fetch initial session with error protection
  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await checkAdminRole(currentUser.id);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  // Safety timeout - show login form after 5s no matter what
  const timeout = setTimeout(() => {
    if (isMounted) setLoading(false);
  }, 5000);

  initializeAuth().then(() => clearTimeout(timeout));

  return () => {
    isMounted = false;
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}, []);
```

### What This Fixes

- **`try/catch/finally`**: Even if `getSession()` throws, `setLoading(false)` runs in `finally`
- **`onAuthStateChange` before `getSession()`**: Prevents potential internal deadlocks in Supabase JS v2.95+
- **`isMounted` guard**: Prevents state updates on unmounted components
- **5-second timeout**: Ultimate safety net -- user always sees either login or admin UI
- **`setTimeout(() => checkAdminRole(...), 0)`** in onAuthStateChange: Prevents Supabase auth deadlock when making DB queries inside the auth callback


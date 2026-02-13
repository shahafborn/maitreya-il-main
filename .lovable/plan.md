

## Fix: Login Form Flashing After OAuth Redirect

### Current Situation
The admin dashboard works correctly in the preview environment. If you're testing on the published URL (maitreya-il.lovable.app), you need to **publish the app** first for the latest fixes to take effect.

### Remaining Issue: Race Condition
After Google OAuth redirects back to `/admin`, there's a race condition:
1. Page loads at `/admin?__lovable_token=...`
2. React mounts, `getSession()` runs immediately and returns `null` (token not yet processed)
3. `setLoading(false)` runs with no user -- login form appears
4. Lovable auth bridge processes the token, calls `setSession()`
5. `onAuthStateChange` fires, but user already sees the login form

### Solution
Detect the `__lovable_token` query parameter in the URL. If present, **delay showing the login form** to give the auth bridge time to process the token.

### Technical Change

**File: `src/pages/Admin.tsx`**

In the `initializeAuth` function, after `getSession()` returns null, check if the URL contains `__lovable_token`. If it does, wait briefly (up to 3 seconds) for the auth bridge to process the token before showing the login form:

```typescript
const initializeAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!isMounted) return;

    if (session?.user) {
      setUser(session.user);
      await checkAdminRole(session.user.id);
    } else {
      // If there's a lovable token in the URL, wait for auth bridge to process it
      const hasToken = window.location.search.includes('__lovable_token');
      if (hasToken) {
        // Don't set loading=false yet; let onAuthStateChange handle it
        // Set a shorter timeout for this case
        setTimeout(() => {
          if (isMounted && !user) setLoading(false);
        }, 3000);
        return; // Skip the finally block's setLoading(false)
      }
    }
  } catch (error) {
    console.error("Auth initialization error:", error);
  } finally {
    if (isMounted) setLoading(false);
  }
};
```

Also update the `onAuthStateChange` listener to clear the loading state when it receives a session:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (_event, session) => {
    if (!isMounted) return;
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    if (currentUser) {
      setTimeout(() => checkAdminRole(currentUser.id), 0);
      setLoading(false); // Clear loading when auth bridge delivers the session
    } else {
      setIsAdmin(false);
    }
  }
);
```

### What This Fixes
- When redirected back from Google with a token, the page shows "Loading..." instead of the login form while the token is processed
- Once `onAuthStateChange` fires with the session, the admin dashboard appears immediately
- 3-second timeout ensures users aren't stuck if something goes wrong
- No change for normal page visits without a token

### Important
After approving, **publish the app** so the fixes are live on maitreya-il.lovable.app.

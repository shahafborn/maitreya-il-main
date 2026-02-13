

## Fix: Remove URL-Based OAuth Detection, Use Event-Based Auth Flow

### Root Cause
The current code checks for `__lovable_token` in the URL to detect OAuth callbacks. This parameter only exists in the preview environment -- it is NOT present on the published URL after Google OAuth redirect. So on the published site, the code immediately shows the login form before the auth bridge can deliver the session.

### Solution
Replace `__lovable_token` detection with an event-based approach that works in both environments:

### Technical Changes

**File: `src/pages/Admin.tsx`** -- Replace the auth useEffect (lines 48-94):

```typescript
useEffect(() => {
  let isMounted = true;
  let hasReceivedSession = false;

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

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        hasReceivedSession = true;
        setTimeout(() => checkAdminRole(currentUser.id), 0);
      } else {
        setIsAdmin(false);
        // Wait briefly before showing login form -- the auth bridge
        // may deliver a session shortly after the initial null
        setTimeout(() => {
          if (isMounted && !hasReceivedSession) {
            setLoading(false);
          }
        }, 1500);
      }
    }
  );

  // Safety timeout
  const timeout = setTimeout(() => {
    if (isMounted) setLoading(false);
  }, 8000);

  return () => {
    isMounted = false;
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}, []);
```

### How This Solves the Problem

1. **No URL dependency** -- removes the `__lovable_token` check entirely. Works identically on preview and published URLs.

2. **`hasReceivedSession` flag** -- once a valid session arrives, it prevents later null events from reverting to the login form.

3. **1.5-second grace period** -- when `onAuthStateChange` fires with null, we wait 1.5 seconds before showing the login form. This gives the auth bridge time to process the OAuth token and deliver the real session. If the session arrives within that window, `hasReceivedSession` becomes true and the login form never appears.

4. **8-second safety timeout** -- ensures the page never gets stuck loading forever.

### On the published URL, the new flow:
1. User completes Google OAuth, lands at `/admin`
2. `onAuthStateChange` fires with null -- starts 1.5s timer
3. Auth bridge processes token, fires `onAuthStateChange` with valid session
4. `hasReceivedSession = true`, admin role checked, dashboard shown
5. Timer fires but `hasReceivedSession` is true, so login form is never shown

### For non-OAuth visits (normal page load, no session):
1. `onAuthStateChange` fires with null -- starts 1.5s timer
2. No session arrives
3. After 1.5 seconds, login form appears (small acceptable delay)




## Fix: Google Login Redirects to Homepage Instead of Admin Page

### Root Cause

In `src/pages/Admin.tsx` line 147, the Google sign-in redirect URL is set to `window.location.origin` (e.g., `https://maitreya-il.lovable.app`). After Google authentication completes, the user lands on the homepage `/` instead of `/admin`. When they manually navigate back to `/admin`, the session token from the OAuth flow may not yet be processed, so the login form appears again.

### Solution

Change the `redirect_uri` from `window.location.origin` to `window.location.origin + '/admin'` so that after Google login, the user is redirected back to the admin page where the auth session will be picked up automatically.

### Technical Change

**File: `src/pages/Admin.tsx`** (line 147)

Change:
```typescript
const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
```

To:
```typescript
const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + '/admin' });
```

This single-line fix ensures the OAuth callback returns the user to `/admin`, where the existing auth initialization logic will detect the session and show the admin dashboard.


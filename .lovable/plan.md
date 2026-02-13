

## Fix: Write OAuth Tokens Directly to localStorage

The root cause is that `supabase.auth.setSession()` uses Web Locks internally, which conflicts with the client's own initialization lock -- causing `AbortError` every time. No amount of delaying fixes this.

### New Strategy

Instead of calling `setSession()`, we write the tokens directly into localStorage in the format the Supabase client expects. When the client initializes, it finds an existing session and uses it -- no lock conflicts.

### Changes

**1. `index.html` -- Enhanced inline script**

The inline script will now:
- Extract ALL token parameters from the hash (access_token, refresh_token, expires_in, expires_at, token_type)
- Write them directly to localStorage under the key `sb-wdvnesawgmaujdkfppad-auth-token` (the key the Supabase client uses)
- Clear the hash from the URL
- No longer use sessionStorage at all

**2. `src/main.tsx` -- Simplify back to basic**

Remove all manual token handling. Just render the app:
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### Why This Works

The Supabase client is configured with `storage: localStorage` and `persistSession: true`. During initialization, it checks localStorage for an existing session before doing anything else. By placing the tokens there before the client loads, it simply resumes the session as if the user had logged in previously -- no `setSession()` call needed, no Web Locks conflict.

### Technical Details

The localStorage key format is `sb-{project-ref}-auth-token` and the value is a JSON object with `access_token`, `refresh_token`, `token_type`, `expires_in`, and `expires_at`.


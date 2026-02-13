

## Fix: RLS Policies Blocking All Data Access

### Problem
All RLS policies on `transcripts`, `site_content`, and `user_roles` tables are set as **RESTRICTIVE**. PostgreSQL requires at least one PERMISSIVE policy to grant initial access -- RESTRICTIVE policies can only further narrow access. With zero PERMISSIVE policies, all queries return empty results, causing:

- **Main page**: Blank for seconds because `transcripts` and `site_content` SELECT returns nothing
- **Admin page**: Stuck on "Loading..." because `user_roles` SELECT returns nothing, so admin status is never resolved

### Solution
Create a database migration that drops the existing RESTRICTIVE policies and recreates them as PERMISSIVE for the following:

1. **`site_content`** table:
   - SELECT policy "Anyone can read site content" -- change to PERMISSIVE
   - UPDATE policy "Admins can update site content" -- change to PERMISSIVE

2. **`transcripts`** table:
   - SELECT policy "Anyone can read transcripts" -- change to PERMISSIVE
   - UPDATE policy "Admins can update transcripts" -- change to PERMISSIVE

3. **`user_roles`** table:
   - SELECT policy "Users can read own roles" -- change to PERMISSIVE

The INSERT/DELETE deny policies (using `false`) can stay RESTRICTIVE since they're intentionally blocking all access.

### Technical Details

A single SQL migration will:

```text
For each table:
  DROP the existing RESTRICTIVE policy
  CREATE the same policy as PERMISSIVE (default)
```

No code changes are needed -- only the database policies need updating.

### Expected Result
- Main page loads instantly with all video and content data
- Admin page correctly resolves admin role and shows the management interface


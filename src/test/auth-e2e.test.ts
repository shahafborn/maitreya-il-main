/**
 * E2E integration test — hits the real remote Supabase.
 *
 * Verifies the full signup → profile creation → signin → signout chain.
 * This catches real DB issues (like the broken handle_new_user trigger)
 * that mocked tests cannot detect.
 *
 * Gated: only runs when RUN_E2E=1 is set.
 * Cleanup: only deletes users matching the test-e2e-* pattern.
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe.skipIf(!process.env.RUN_E2E)("Auth E2E (real Supabase)", () => {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? "";
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const TEST_EMAIL = `test-e2e-${Date.now()}@test.local`;
  const TEST_PASSWORD = "TestPass123!";

  let supabase: ReturnType<typeof createClient>;
  let adminClient: ReturnType<typeof createClient> | null;
  let testUserId: string | null = null;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    adminClient = SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  });

  afterAll(async () => {
    if (!testUserId || !adminClient) return;
    if (!TEST_EMAIL.startsWith("test-e2e-") || !TEST_EMAIL.endsWith("@test.local")) {
      console.warn("Refusing to delete user — email doesn't match test pattern");
      return;
    }

    const { error } = await adminClient.auth.admin.deleteUser(testUserId);
    if (error) {
      console.warn(`Cleanup: failed to delete test user ${testUserId}:`, error.message);
    }
  });

  it("signs up a new user without error", async () => {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(error).toBeNull();
    expect(data.user).toBeTruthy();
    expect(data.user!.email).toBe(TEST_EMAIL);

    testUserId = data.user!.id;
  });

  it("creates a profile row for the new user", async () => {
    expect(testUserId).toBeTruthy();

    // Sign in first to get an authenticated session for querying profiles
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(signInData.session).toBeTruthy();

    // Query profiles table — RLS allows users to read their own profile
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", testUserId!)
      .single();

    expect(error).toBeNull();
    expect(profiles).toBeTruthy();
    expect(profiles!.email).toBe(TEST_EMAIL);
  });

  it("signs in with correct credentials", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(error).toBeNull();
    expect(data.session).toBeTruthy();
    expect(data.session!.access_token).toBeTruthy();
  });

  it("returns session from getSession after sign-in", async () => {
    const { data } = await supabase.auth.getSession();

    expect(data.session).toBeTruthy();
    expect(data.session!.user.email).toBe(TEST_EMAIL);
  });

  it("clears session after sign-out", async () => {
    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();

    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  });

  it("rejects sign-in with wrong password", async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: "wrong-password",
    });

    expect(error).toBeTruthy();
    expect(error!.message).toContain("Invalid login credentials");
  });
});

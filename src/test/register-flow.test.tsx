/**
 * UI-level tests for the Register / Auth flow.
 *
 * Renders the real <AuthProvider> + <AuthGate> tree (matching App.tsx)
 * with a mocked Supabase client — no network calls are made.
 *
 * The key insight: signUp/signIn don't set `user` directly.
 * State transitions happen via the `onAuthStateChange` listener,
 * so tests must fire the captured callback to simulate the SDK.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Register from "@/pages/Register";

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

// Captured onAuthStateChange callback — tests fire this to simulate auth events
let authChangeCallback: ((event: string, session: any) => void) | null = null;

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockFunctionsInvoke = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (cb: (event: string, session: any) => void) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
    from: () => ({
      update: () => ({
        eq: () => ({
          then: (cb: any) => cb?.({ error: null }),
        }),
      }),
    }),
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
};

const mockSession = {
  access_token: "mock-token",
  user: mockUser,
};

/** Simple video library stand-in — the real Index component has heavy deps */
const VideoLibraryStub = () => {
  const { signOut } = useAuth();
  return (
    <div>
      <h1>Video Library</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

/** Mirrors the AuthGate in App.tsx but uses the stub for Index */
const AuthGate = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <Routes>
      <Route path="/" element={user ? <VideoLibraryStub /> : <Register />} />
      <Route path="/heb/healing-online-course" element={user ? <VideoLibraryStub /> : <Register />} />
    </Routes>
  );
};

/**
 * Render the full app tree.
 * Uses MemoryRouter (instead of BrowserRouter) because jsdom's URL is "/"
 * which doesn't match basename="/p". MemoryRouter with initialEntries
 * simulates navigating to the app's base route.
 */
function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  authChangeCallback = null;

  // Default: no existing session
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockSignOut.mockResolvedValue({ error: null });
  mockFunctionsInvoke.mockResolvedValue({ data: null, error: null });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Register flow", () => {
  it("renders the registration form with all fields", async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText("הרשמה לצפייה בקורס")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("אימייל")).toBeInTheDocument();
    expect(screen.getByLabelText("סיסמה")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /הרשמה חינם/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("blocks form submit when consent is not checked", async () => {
    mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });
    renderApp();

    await waitFor(() => screen.getByLabelText("אימייל"));

    fireEvent.change(screen.getByLabelText("אימייל"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /הרשמה חינם/i }));

    // signUp should NOT have been called
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("blocks Google sign-in when consent is not checked", async () => {
    renderApp();

    await waitFor(() => screen.getByRole("button", { name: /google/i }));

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    expect(mockSignInWithOAuth).not.toHaveBeenCalled();
  });

  it("calls signUp and transitions to video library on successful signup", async () => {
    mockSignUp.mockImplementation(async () => {
      // Simulate Supabase SDK: after signup, fire the auth state change
      setTimeout(() => {
        act(() => {
          authChangeCallback?.("SIGNED_IN", mockSession);
        });
      }, 0);
      return { data: { user: mockUser }, error: null };
    });

    renderApp();

    await waitFor(() => screen.getByLabelText("אימייל"));

    // Check consent
    const consentCheckbox = screen.getByRole("checkbox");
    fireEvent.click(consentCheckbox);

    // Fill form
    fireEvent.change(screen.getByLabelText("אימייל"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "password123" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /הרשמה חינם/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });

    // After auth state change fires, should see the video library
    await waitFor(() => {
      expect(screen.getByText("Video Library")).toBeInTheDocument();
    });
  });

  it("displays signup error from Supabase", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: "Database error saving new user" },
    });

    renderApp();

    await waitFor(() => screen.getByLabelText("אימייל"));

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("אימייל"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /הרשמה חינם/i }));

    await waitFor(() => {
      expect(screen.getByText("Database error saving new user")).toBeInTheDocument();
    });
  });

  it("switches to login mode", async () => {
    renderApp();

    await waitFor(() => screen.getByText("כבר רשומים? התחברו כאן"));

    fireEvent.click(screen.getByText("כבר רשומים? התחברו כאן"));

    expect(screen.getByText("כניסה לחשבון")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^כניסה$/i })).toBeInTheDocument();
    // Consent checkbox should not be visible in login mode
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("calls signIn and transitions to video library on successful login", async () => {
    mockSignInWithPassword.mockImplementation(async () => {
      setTimeout(() => {
        act(() => {
          authChangeCallback?.("SIGNED_IN", mockSession);
        });
      }, 0);
      return { data: { user: mockUser, session: mockSession }, error: null };
    });

    renderApp();

    await waitFor(() => screen.getByText("כבר רשומים? התחברו כאן"));

    // Switch to login mode
    fireEvent.click(screen.getByText("כבר רשומים? התחברו כאן"));

    // Fill form
    fireEvent.change(screen.getByLabelText("אימייל"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "password123" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /^כניסה$/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Video Library")).toBeInTheDocument();
    });
  });

  it("displays login error from Supabase", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    renderApp();

    await waitFor(() => screen.getByText("כבר רשומים? התחברו כאן"));

    fireEvent.click(screen.getByText("כבר רשומים? התחברו כאן"));

    fireEvent.change(screen.getByLabelText("אימייל"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /^כניסה$/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });
  });

  it("calls signInWithOAuth with correct redirectTo when Google button clicked with consent", async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
    renderApp();

    await waitFor(() => screen.getByRole("button", { name: /google/i }));

    // Check consent first
    fireEvent.click(screen.getByRole("checkbox"));

    // Click Google
    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expect.stringContaining("/p/heb/healing-online-course"),
        },
      });
    });
  });
});

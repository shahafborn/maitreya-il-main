/**
 * Tests for /auth/callback — where a person lands after signing in with Google.
 *
 * The destination can arrive in the "next" query parameter (which survives the
 * sign-in finishing in a different browser than it started in) or in
 * localStorage (which does not). With neither, the person goes to their most
 * recent course, and failing that, to the home page.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AuthCallback from "@/pages/AuthCallback";
import { OAUTH_REDIRECT_KEY } from "@/lib/authRedirect";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockAuth: { user: { id: string } | null; loading: boolean } = {
  user: { id: "user-1" },
  loading: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

/** What the enrollment lookup resolves to. Overridden per test. */
let enrollmentResult: unknown = { data: [], error: null };
let enrollmentDelayMs = 0;

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () =>
              new Promise((resolve) =>
                setTimeout(() => resolve(enrollmentResult), enrollmentDelayMs),
              ),
          }),
        }),
      }),
    }),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders the callback and shows whichever page it lands on. */
function renderCallback(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/courses/:slug" element={<div>COURSE PAGE</div>} />
        <Route path="/courses/:slug/register" element={<div>COURSE REGISTER</div>} />
        <Route path="/discover/healing-retreat" element={<div>VIDEO LIBRARY</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const landsOn = (text: string) =>
  waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockAuth = { user: { id: "user-1" }, loading: false };
  enrollmentResult = { data: [], error: null };
  enrollmentDelayMs = 0;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthCallback destination", () => {
  it("uses the next parameter from the address", async () => {
    renderCallback("/auth/callback?next=%2Fcourses%2Fdeath-dying-enlightenment");
    await landsOn("COURSE PAGE");
  });

  it("prefers the address over localStorage", async () => {
    localStorage.setItem(OAUTH_REDIRECT_KEY, "/discover/healing-retreat");
    renderCallback("/auth/callback?next=%2Fcourses%2Fuma-zub-tri");
    await landsOn("COURSE PAGE");
  });

  it("falls back to localStorage when the address carries nothing", async () => {
    localStorage.setItem(OAUTH_REDIRECT_KEY, "/discover/healing-retreat");
    renderCallback("/auth/callback");
    await landsOn("VIDEO LIBRARY");
  });

  it("clears the stored destination once it has been used", async () => {
    localStorage.setItem(OAUTH_REDIRECT_KEY, "/discover/healing-retreat");
    renderCallback("/auth/callback");
    await landsOn("VIDEO LIBRARY");
    expect(localStorage.getItem(OAUTH_REDIRECT_KEY)).toBeNull();
  });

  it("ignores an absolute address pointing at another site", async () => {
    enrollmentResult = { data: [], error: null };
    renderCallback("/auth/callback?next=https%3A%2F%2Fevil.example.com");
    await landsOn("HOME");
  });

  it("ignores a protocol-relative address", async () => {
    renderCallback("/auth/callback?next=%2F%2Fevil.example.com");
    await landsOn("HOME");
  });

  it("sends a person with one course to that course", async () => {
    enrollmentResult = {
      data: [{ enrolled_at: "2026-09-13T05:43:32Z", courses: { slug: "death-dying-enlightenment" } }],
      error: null,
    };
    renderCallback("/auth/callback");
    await landsOn("COURSE PAGE");
  });

  it("sends a person with several courses to the most recent one", async () => {
    // The query orders by enrolled_at desc and takes one, so the most recent
    // row is all that comes back.
    enrollmentResult = {
      data: [{ enrolled_at: "2026-09-13T05:43:32Z", courses: [{ slug: "uma-zub-tri" }] }],
      error: null,
    };
    renderCallback("/auth/callback");
    await landsOn("COURSE PAGE");
  });

  it("sends a person with no course to the home page", async () => {
    enrollmentResult = { data: [], error: null };
    renderCallback("/auth/callback");
    await landsOn("HOME");
  });

  it("sends a person to the home page when the lookup fails", async () => {
    enrollmentResult = { data: null, error: { message: "boom" } };
    renderCallback("/auth/callback");
    await landsOn("HOME");
  });

  it("sends someone who is not signed in to the home page", async () => {
    mockAuth = { user: null, loading: false };
    renderCallback("/auth/callback");
    await landsOn("HOME");
  });

  it("waits while auth is still loading", async () => {
    mockAuth = { user: null, loading: true };
    renderCallback("/auth/callback");
    expect(screen.getByText("Redirecting...")).toBeInTheDocument();
  });

  it("never lands anyone on the video library by accident", async () => {
    enrollmentResult = { data: [], error: null };
    renderCallback("/auth/callback");
    await landsOn("HOME");
    expect(screen.queryByText("VIDEO LIBRARY")).not.toBeInTheDocument();
  });
});

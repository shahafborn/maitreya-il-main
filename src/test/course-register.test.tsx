/**
 * Tests for CourseRegister — verifies that after auth, users are
 * automatically enrolled (no separate access code step).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ slug: "test-course" }),
    useNavigate: () => mockNavigate,
  };
});

const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockSignInWithGoogle = vi.fn();
let mockUser: any = null;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    signUp: mockSignUp,
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    loading: false,
  }),
}));

let mockCourse: any = null;
let mockCourseLoading = false;

vi.mock("@/hooks/useCourse", () => ({
  useCourse: () => ({
    data: mockCourse,
    isLoading: mockCourseLoading,
  }),
}));

let mockIsEnrolled = false;
let mockEnrollmentLoading = false;
const mockMutateAsync = vi.fn();

vi.mock("@/hooks/useCourseEnrollment", () => ({
  useCourseEnrollment: () => ({
    isEnrolled: mockIsEnrolled,
    isLoading: mockEnrollmentLoading,
  }),
  useEnrollInCourse: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock the logo import
vi.mock("@/assets/maitreya-logo.png", () => ({ default: "logo.png" }));

import CourseRegister from "@/pages/CourseRegister";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const testCourse = {
  id: "course-1",
  slug: "test-course",
  title: "Test Course",
  description: "A test course",
  access_code: null,
  default_dir: "ltr" as const,
  hero_image_url: null,
  course_start_date: null,
  is_published: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/courses/test-course/register"]}>
        <CourseRegister />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = null;
  mockCourse = testCourse;
  mockCourseLoading = false;
  mockIsEnrolled = false;
  mockEnrollmentLoading = false;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CourseRegister", () => {
  it("defaults to register mode with prominent sign-in button and no access code field", () => {
    renderComponent();

    expect(screen.getByText("Access the Resources for This Course")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Access Code")).not.toBeInTheDocument();

    // Prominent sign-in button is visible
    expect(screen.getByRole("button", { name: "Sign In to Your Account" })).toBeInTheDocument();
  });

  it("logged-in user auto-enrolls without showing a separate enrollment form", async () => {
    mockUser = { id: "u1", email: "test@example.com" };
    mockMutateAsync.mockResolvedValue("enrolled");

    renderComponent();

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ courseId: testCourse.id });
    });
  });

  it("redirects to course page when already enrolled", () => {
    mockUser = { id: "u1", email: "test@example.com" };
    mockIsEnrolled = true;

    renderComponent();

    expect(mockNavigate).toHaveBeenCalledWith("/courses/test-course", { replace: true });
  });
});

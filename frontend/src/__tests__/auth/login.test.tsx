/**
 * Tests for the Login page.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

// --- Mocks ---

const mockLogin = jest.fn();
const mockPush = jest.fn();

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isLoading: false,
    isAuthenticated: false,
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// --- Tests ---

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /connexion/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /se connecter/i })
    ).toBeInTheDocument();
  });

  it("shows a link to the register page", () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole("link", { name: /cr/i });
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/adresse email invalide/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when password is empty", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/adresse email/i);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByRole("button", { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/le mot de passe est requis/i)
      ).toBeInTheDocument();
    });
  });

  it("calls login with email and password on valid submit", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/adresse email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "MyPassword1");

    const submitButton = screen.getByRole("button", { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "MyPassword1");
    });
  });

  it("redirects to /dashboard on successful login", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "test@example.com");
    await user.type(screen.getByLabelText(/mot de passe/i), "MyPassword1");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows server error when login fails", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error("Identifiants invalides"));
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "test@example.com");
    await user.type(screen.getByLabelText(/mot de passe/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /identifiants invalides/i
      );
    });
  });
});

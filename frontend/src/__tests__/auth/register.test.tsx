/**
 * Tests for the Register page.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";

// --- Mocks ---

const mockRegister = jest.fn();
const mockPush = jest.fn();

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: jest.fn(),
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

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: /cr/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cr/i })
    ).toBeInTheDocument();
  });

  it("shows link to login page", () => {
    render(<RegisterPage />);

    const loginLink = screen.getByRole("link", { name: /se connecter/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows password mismatch error when passwords differ", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "MyPassword1");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "DifferentPass1"
    );

    await user.click(screen.getByRole("button", { name: /cr/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/les mots de passe ne correspondent pas/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for weak password (no uppercase)", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "password123"
    );

    await user.click(screen.getByRole("button", { name: /cr/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/au moins une majuscule/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for password that is too short", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "Short1");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "Short1"
    );

    await user.click(screen.getByRole("button", { name: /cr/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/au moins 8 caract/i)
      ).toBeInTheDocument();
    });
  });

  it("calls register with email and password on valid submit", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(undefined);
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "MyPassword1");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "MyPassword1"
    );

    await user.click(screen.getByRole("button", { name: /cr/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("test@example.com", "MyPassword1");
    });
  });

  it("redirects to /dashboard on successful registration", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(undefined);
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "MyPassword1");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "MyPassword1"
    );

    await user.click(screen.getByRole("button", { name: /cr/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows server error when registration fails", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(new Error("Email deja utilise"));
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/adresse email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "MyPassword1");
    await user.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      "MyPassword1"
    );

    await user.click(screen.getByRole("button", { name: /cr/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /email deja utilise/i
      );
    });
  });
});

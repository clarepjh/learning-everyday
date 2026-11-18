import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), initializationError: null as string | null }));

vi.mock("./AuthProvider", () => ({
  useAuth: () => ({
    signIn: mocks.signIn,
    configurationError: null,
    initializationError: mocks.initializationError,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
    mocks.initializationError = null;
  });

  it("uses email/password sign-in and offers no public registration", async () => {
    mocks.signIn.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "owner@example.test" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "synthetic-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith(
        "owner@example.test",
        "synthetic-password",
      );
    });
    expect(screen.queryByRole("link", { name: /register|sign up/i })).not.toBeInTheDocument();
  });

  it("shows saved-session initialization errors", () => {
    mocks.initializationError = "Could not check the saved session.";
    render(<LoginPage />);

    expect(screen.getByText("Could not check the saved session.")).toBeInTheDocument();
  });
});

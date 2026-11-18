import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";

vi.mock("./lib/supabase", () => ({
  supabase: null,
  supabaseConfigError: "Supabase is not configured.",
}));

describe("authenticated app shell", () => {
  it("shows only the sign-in screen while there is no session", async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Learning Everyday" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
  });
});

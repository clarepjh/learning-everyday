import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import * as auth from "./auth/AuthProvider";
import * as learningData from "./lib/learningData";

vi.mock("./lib/supabase", () => ({
  supabase: null,
  supabaseConfigError: "Supabase is not configured.",
}));

describe("authenticated app shell", () => {
  it("shows only the sign-in screen while there is no session", async () => {
    render(
      <auth.AuthProvider>
        <App />
      </auth.AuthProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Learning Everyday" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
  });

  it("combines search, subject, and revision status and clears zero results", async () => {
    const account = { id: "owner", email: "owner@example.test", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" };
    const timestamps = { user_id: account.id, created_at: "", updated_at: "" };
    const note = { ...timestamps, topic: "", content_md: "Binary search", mistakes_md: null, learned_on: "2026-01-01", tags: [] };
    const spies = [
      vi.spyOn(auth, "useAuth").mockReturnValue({
        session: { user: account, access_token: "", refresh_token: "", expires_in: 3600, token_type: "bearer" },
        loading: false, configurationError: null, initializationError: null,
        signIn: vi.fn(), signOut: vi.fn(),
      }),
      vi.spyOn(learningData, "listSubjects").mockResolvedValue([
        { ...timestamps, id: "algorithms", name: "Algorithms" },
        { ...timestamps, id: "databases", name: "Databases" },
      ]),
      vi.spyOn(learningData, "listNotes").mockResolvedValue([
        { ...note, id: "a", title: "Sorted arrays", subject_id: "algorithms", needs_revision: true },
        { ...note, id: "b", title: "Query indexes", subject_id: "databases", needs_revision: true },
        { ...note, id: "c", title: "Boundary cases", subject_id: "algorithms", needs_revision: false },
      ]),
      vi.spyOn(learningData, "listStudyLogs").mockResolvedValue([]),
    ];

    try {
      render(<App />);
      await screen.findByRole("heading", { name: "A little progress, every day." });
      fireEvent.click(screen.getAllByRole("button", { name: "All notes" })[0]);
      expect(screen.getByRole("heading", { name: "Query indexes" })).toBeInTheDocument();

      fireEvent.change(screen.getByRole("searchbox", { name: "Search notes" }), { target: { value: "BINARY" } });
      fireEvent.change(screen.getByRole("combobox", { name: "Filter by subject" }), { target: { value: "algorithms" } });
      fireEvent.change(screen.getByRole("combobox", { name: "Revision status" }), { target: { value: "marked" } });

      expect(screen.getByRole("heading", { name: "Sorted arrays" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Query indexes" })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Boundary cases" })).not.toBeInTheDocument();

      fireEvent.change(screen.getByRole("searchbox", { name: "Search notes" }), { target: { value: "missing" } });
      expect(screen.getByText(/No notes match/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(screen.getByRole("heading", { name: "Query indexes" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Boundary cases" })).toBeInTheDocument();
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import * as auth from "./auth/AuthProvider";
import * as learningData from "./lib/learningData";
import { DEFAULT_SUBJECT_COLOR } from "./lib/subjectColors";

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
        { ...timestamps, id: "algorithms", name: "Algorithms", color: DEFAULT_SUBJECT_COLOR },
        { ...timestamps, id: "databases", name: "Databases", color: DEFAULT_SUBJECT_COLOR },
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

      const subject = screen.getByRole("combobox", { name: "Filter by subject" });
      const revision = screen.getByRole("combobox", { name: "Revision status" });
      expect(subject).toHaveDisplayValue("All subjects");
      expect(revision).toHaveDisplayValue("Any status");
      expect(document.querySelector(`label[for="${subject.id}"]`)).toHaveAttribute("data-shrink", "true");
      expect(document.querySelector(`label[for="${revision.id}"]`)).toHaveAttribute("data-shrink", "true");

      fireEvent.change(screen.getByRole("searchbox", { name: "Search notes" }), { target: { value: "BINARY" } });
      fireEvent.change(subject, { target: { value: "algorithms" } });
      fireEvent.change(revision, { target: { value: "marked" } });

      expect(screen.getByRole("heading", { name: "Sorted arrays" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Query indexes" })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Boundary cases" })).not.toBeInTheDocument();

      fireEvent.change(screen.getByRole("searchbox", { name: "Search notes" }), { target: { value: "missing" } });
      expect(screen.getByText(/No notes match/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(subject).toHaveDisplayValue("All subjects");
      expect(revision).toHaveDisplayValue("Any status");
      expect(screen.getByRole("heading", { name: "Query indexes" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Boundary cases" })).toBeInTheDocument();
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });

  it("announces successful note changes without announcing a failed save", async () => {
    const account = { id: "owner", email: "owner@example.test", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" };
    const timestamps = { user_id: account.id, created_at: "", updated_at: "" };
    let notes: learningData.Note[] = [];
    const save = vi.spyOn(learningData, "saveNote").mockImplementation((draft, id) => {
      const saved = { ...timestamps, ...draft, id: id ?? "note-id", mistakes_md: draft.mistakes_md ?? null };
      notes = [saved];
      return Promise.resolve(saved);
    });
    const spies = [
      save,
      vi.spyOn(auth, "useAuth").mockReturnValue({
        session: { user: account, access_token: "", refresh_token: "", expires_in: 3600, token_type: "bearer" },
        loading: false, configurationError: null, initializationError: null,
        signIn: vi.fn(), signOut: vi.fn(),
      }),
      vi.spyOn(learningData, "listSubjects").mockResolvedValue([{ ...timestamps, id: "algorithms", name: "Algorithms", color: DEFAULT_SUBJECT_COLOR }]),
      vi.spyOn(learningData, "listNotes").mockImplementation(() => Promise.resolve(notes)),
      vi.spyOn(learningData, "listStudyLogs").mockResolvedValue([]),
      vi.spyOn(learningData, "deleteNote").mockImplementation(() => {
        notes = [];
        return Promise.resolve();
      }),
    ];

    try {
      render(<App />);
      await screen.findByRole("heading", { name: "A little progress, every day." });
      fireEvent.click(screen.getAllByRole("button", { name: "All notes" })[0]);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "New note" }));
      const create = within(await screen.findByRole("dialog", { name: "New note" }));
      fireEvent.change(create.getByRole("textbox", { name: /title/i }), { target: { value: "Sorted arrays" } });
      save.mockRejectedValueOnce(new Error("Could not save note."));
      fireEvent.click(create.getByRole("button", { name: "Save note" }));
      expect(await screen.findByText("Could not save note.")).toBeInTheDocument();
      expect(screen.queryByText("Note created.")).not.toBeInTheDocument();

      fireEvent.click(create.getByRole("button", { name: "Save note" }));
      expect(await screen.findByRole("status")).toHaveTextContent("Note created.");

      fireEvent.click(screen.getByRole("button", { name: "Edit Sorted arrays" }));
      const edit = within(await screen.findByRole("dialog", { name: "Edit note" }));
      fireEvent.change(edit.getByRole("textbox", { name: /title/i }), { target: { value: "Binary search" } });
      fireEvent.click(edit.getByRole("button", { name: "Save note" }));
      expect(await screen.findByText("Note updated.")).toBeInTheDocument();

      fireEvent.click(await screen.findByRole("button", { name: "Add to revision list" }));
      expect(await screen.findByText("Note added to revision list.")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Remove from revision list" }));
      expect(await screen.findByText("Note removed from revision list.")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Delete Binary search" }));
      fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }));
      const toast = await screen.findByRole("status");
      expect(toast).toHaveTextContent("Note deleted.");
      fireEvent.click(within(toast).getByRole("button", { name: "Close" }));
      expect(screen.queryByText("Note deleted.")).not.toBeInTheDocument();
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });
});

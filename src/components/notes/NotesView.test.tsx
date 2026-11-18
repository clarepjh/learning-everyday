import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Note, Subject } from "../../lib/learningData";
import { NotesView } from "./NotesView";
import { DEFAULT_SUBJECT_COLOR } from "../../lib/subjectColors";

const subject: Subject = {
  id: "subject-1",
  user_id: "owner",
  name: "Algorithms",
  color: DEFAULT_SUBJECT_COLOR,
  created_at: "",
  updated_at: "",
};

const note: Note = {
  id: "note-1",
  user_id: "owner",
  subject_id: subject.id,
  title: "Binary search",
  topic: "Arrays",
  content_md: "Keep the interval sorted.",
  mistakes_md: "I used the wrong midpoint.",
  learned_on: "2026-01-01",
  needs_revision: false,
  tags: [],
  created_at: "",
  updated_at: "",
};

describe("NotesView", () => {
  it("starts collapsed and lets each note expand and collapse", async () => {
    render(
      <NotesView
        page="All notes"
        notes={[note]}
        subjects={[subject]}
        filtersActive={false}
        onClearFilters={vi.fn()}
        filters={null}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleRevision={vi.fn()}
        onExportNotes={vi.fn()}
      />,
    );

    expect(screen.queryByText(note.content_md)).not.toBeInTheDocument();
    expect(screen.getByTestId("CircleRoundedIcon")).toHaveAttribute("color", subject.color);
    const expand = screen.getByRole("button", { name: "Expand note Binary search" });
    fireEvent.click(expand);
    expect(screen.getByText(note.content_md)).toBeInTheDocument();
    expect(screen.getByText(note.mistakes_md as string)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse note Binary search" }));
    await waitFor(() => {
      expect(screen.queryByText(note.content_md)).not.toBeInTheDocument();
    });
  });

  it("toggles all visible notes without changing the state of filtered-out notes", async () => {
    const second = { ...note, id: "note-2", title: "Merge sort", content_md: "Merge the sorted halves." };
    const props = {
      page: "All notes",
      subjects: [subject],
      filters: null,
      onClearFilters: vi.fn(),
      onCreate: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onToggleRevision: vi.fn(),
      onExportNotes: vi.fn(),
    };
    const { rerender } = render(<NotesView {...props} notes={[note, second]} filtersActive={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Expand note Binary search" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand all notes" }));
    expect(screen.getByText(note.content_md)).toBeVisible();
    expect(screen.getByText(second.content_md)).toBeVisible();

    rerender(<NotesView {...props} notes={[note]} filtersActive />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse all notes" }));
    await waitFor(() => expect(screen.queryByText(note.content_md)).not.toBeInTheDocument());

    rerender(<NotesView {...props} notes={[note, second]} filtersActive={false} />);
    expect(screen.getByRole("button", { name: "Expand note Binary search" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Collapse note Merge sort" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Expand all notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse all notes" }));
    await waitFor(() => {
      expect(screen.queryByText(note.content_md)).not.toBeInTheDocument();
      expect(screen.queryByText(second.content_md)).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Expand all notes" })).toBeVisible();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubjectDialog, emptySubjectDraft } from "./SubjectDialog";
import { SUBJECT_COLORS } from "../../lib/subjectColors";

describe("SubjectDialog", () => {
  it("lets a user choose a subject colour", () => {
    const onChange = vi.fn();
    render(
      <SubjectDialog
        open
        editing={false}
        saving={false}
        draft={emptySubjectDraft()}
        onChange={onChange}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Blue/ }));

    expect(onChange).toHaveBeenCalledWith({
      name: "",
      color: SUBJECT_COLORS[1].value,
    });
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownPreview } from "./MarkdownEditor";

describe("MarkdownPreview", () => {
  it("renders Markdown and keeps raw HTML inert", () => {
    render(
      <MarkdownPreview value={"## A note\n\n<script>alert('x')</script>\n\n**safe**"} />,
    );

    expect(screen.getByRole("heading", { name: "A note" })).toBeInTheDocument();
    expect(screen.getByText("safe").tagName).toBe("STRONG");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("does not render a javascript link target", () => {
    render(<MarkdownPreview value="[unsafe](javascript:alert%281%29)" />);

    const link = screen.getByText("unsafe").closest("a");
    expect(link).not.toHaveAttribute("href");
  });
});

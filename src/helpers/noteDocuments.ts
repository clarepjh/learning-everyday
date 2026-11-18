import type { Note, Subject } from "../lib/learningData";
import { today } from "./localDate";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createNotesDocumentHtml(
  notes: Note[],
  subjects: Subject[],
): string {
  const subjectNames = new Map(subjects.map(({ id, name }) => [id, name]));
  const content = notes
    .map((note) => {
      const subject = subjectNames.get(note.subject_id) ?? "Subject";
      return `<article>
        <h1>${escapeHtml(note.title)}</h1>
        <p><strong>Subject:</strong> ${escapeHtml(subject)} &nbsp; <strong>Topic:</strong> ${escapeHtml(note.topic)} &nbsp; <strong>Learned:</strong> ${escapeHtml(note.learned_on)}</p>
        <h2>Notes</h2>
        <pre>${escapeHtml(note.content_md)}</pre>
        ${note.mistakes_md ? `<h2>What I got wrong</h2><pre>${escapeHtml(note.mistakes_md)}</pre>` : ""}
        ${note.tags.length ? `<p><strong>Tags:</strong> ${note.tags.map(escapeHtml).join(", ")}</p>` : ""}
      </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Learning Everyday notes</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1d1d1d; margin: 2rem; }
    article { break-after: page; page-break-after: always; }
    article:last-child { break-after: auto; page-break-after: auto; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
    h1 { border-bottom: 1px solid #ccc; padding-bottom: .4rem; }
    @media print { body { margin: 1.5cm; } }
  </style>
</head>
<body>${content}</body>
</html>`;
}

export function downloadNotesAsDoc(notes: Note[], subjects: Subject[]): void {
  const blob = new Blob([createNotesDocumentHtml(notes, subjects)], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `learning-everyday-notes-${today()}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printNotesAsPdf(notes: Note[], subjects: Subject[]): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Allow pop-ups to export notes as PDF.");
  }

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  printWindow.document.open();
  printWindow.document.write(createNotesDocumentHtml(notes, subjects));
  printWindow.document.close();
}

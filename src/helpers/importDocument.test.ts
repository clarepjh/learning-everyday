import { describe, expect, it, vi } from "vitest";
import { readDocumentText } from "./importDocument";

const { getDocumentMock, parseMsDocMock } = vi.hoisted(() => ({
  getDocumentMock: vi.fn(),
  parseMsDocMock: vi.fn(),
}));

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: getDocumentMock,
  GlobalWorkerOptions: { workerSrc: "" },
}));

vi.mock("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url", () => ({
  default: "pdf-worker.js",
}));

vi.mock("@file-viewer/doc", () => ({
  parseMsDoc: parseMsDocMock,
}));
function createFile(contents: string, name: string, type = ""): File {
  const file = new File([contents], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(contents).buffer,
  });
  return file;
}

describe("document import", () => {
  it("extracts readable text from Word HTML without including executable content", async () => {
    const file = createFile(
      "<html><body><h1>Lesson</h1><p>Readable text</p><script>alert(1)</script></body></html>",
      "lesson.doc",
      "application/msword",
    );

    await expect(readDocumentText(file)).resolves.toContain("Lesson");
    await expect(readDocumentText(file)).resolves.toContain("Readable text");
    await expect(readDocumentText(file)).resolves.not.toContain("alert");
  });

  it("extracts text and table contents from a legacy binary Word document", async () => {
    parseMsDocMock.mockReturnValueOnce({
      meta: { fib: { fEncrypted: false } },
      blocks: [
        { type: "paragraph", text: "Legacy lesson text" },
        {
          type: "table",
          rows: [{ cells: [{ paragraphs: [{ text: "Table cell" }] }] }],
        },
      ],
    });
    const file = createFile("\0legacy binary", "lesson.doc");
    const extracted = await readDocumentText(file);

    expect(extracted).toContain("Legacy lesson text");
    expect(extracted).toContain("Table cell");
  });

  it("rejects damaged legacy binary Word documents with a useful error", async () => {
    parseMsDocMock.mockImplementationOnce(() => {
      throw new Error("Untrusted parser detail");
    });
    const file = createFile("\0legacy binary", "lesson.doc");
    await expect(readDocumentText(file)).rejects.toThrow("could not be read");
  });

  it("extracts selectable PDF text", async () => {
    getDocumentMock.mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({
            items: [{ str: "Extracted lesson text", hasEOL: true }],
          }),
          cleanup: vi.fn(),
        }),
      }),
      destroy: vi.fn(),
    });
    const file = createFile("fake pdf bytes", "lesson.pdf", "application/pdf");

    await expect(readDocumentText(file)).resolves.toBe("Extracted lesson text");
  });
});

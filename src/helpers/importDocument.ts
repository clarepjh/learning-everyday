import type { MsDocBlock } from "@file-viewer/doc";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
} from "pdfjs-dist";
import { MAX_BACKUP_BYTES } from "../lib/backup";

const MAX_PDF_PAGES = 100;
const MAX_DOCUMENT_TEXT_LENGTH = 1_000_000;

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("The selected document could not be read."));
    };
    reader.onerror = () => reject(new Error("The selected document could not be read."));
    reader.readAsArrayBuffer(file);
  });
}

function extractWordHtmlText(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed
    .querySelectorAll("script, style, iframe, object, embed, svg")
    .forEach((element) => element.remove());

  const blockTags = new Set([
    "address", "article", "blockquote", "br", "dd", "div", "dl", "dt",
    "h1", "h2", "h3", "h4", "h5", "h6", "li", "ol", "p", "pre",
    "section", "table", "tr", "ul",
  ]);
  const textFromNode = (node: Node): string => {
    if (node.nodeType === 3) return node.textContent ?? "";
    if (node.nodeType !== 1) return "";
    const element = node as Element;
    const children = [...element.childNodes].map(textFromNode).join("");
    return blockTags.has(element.tagName.toLowerCase())
      ? `\n${children}\n`
      : children;
  };

  return textFromNode(parsed.body).replace(/\n{3,}/g, "\n\n").trim();
}

async function extractPdfText(file: File): Promise<string> {
  let loadingTask: PDFDocumentLoadingTask;
  let document: PDFDocumentProxy;
  try {
    const [pdfjs, worker] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await readFileAsArrayBuffer(file)),
    });
    document = await loadingTask.promise;
  } catch {
    throw new Error("This PDF could not be read. It may be encrypted or damaged.");
  }

  try {
    if (document.numPages > MAX_PDF_PAGES) {
      throw new Error(`PDFs must contain ${MAX_PDF_PAGES} pages or fewer.`);
    }

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const text = await page.getTextContent();
      pages.push(
        text.items
          .filter((item) => "str" in item)
          .map((item) => ("str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : ""))
          .join("")
          .trim(),
      );
      page.cleanup();
    }

    const extracted = pages.join("\n\n").trim();
    if (!extracted) {
      throw new Error("No selectable text was found in the PDF. Scanned PDFs need OCR first.");
    }
    return extracted;
  } finally {
    await loadingTask.destroy();
  }
}

async function extractDocText(file: File): Promise<string> {
  const buffer = await readFileAsArrayBuffer(file);
  const text = new TextDecoder().decode(buffer);
  let extracted: string;
  if (/<(?:!doctype\s+html|html|body)\b/i.test(text)) {
    extracted = extractWordHtmlText(text);
  } else if (text.includes("\0")) {
    try {
      const { parseMsDoc } = await import("@file-viewer/doc");
      const parsed = parseMsDoc(buffer);
      if (parsed.meta.fib.fEncrypted) {
        throw new Error("Encrypted Word documents are not supported.");
      }
      extracted = parsed.blocks.map(textFromMsDocBlock).filter(Boolean).join("\n\n");
    } catch {
      throw new Error(
        "This Word .doc file could not be read. It may be encrypted, damaged, or unsupported.",
      );
    }
  } else {
    extracted = text.trim();
  }

  if (!extracted) {
    throw new Error("The Word document contains no readable text.");
  }
  return extracted;
}

function textFromMsDocBlock(block: MsDocBlock): string {
  if (block.type === "paragraph") return block.text;
  if (block.type === "table") {
    return block.rows
      .map((row) =>
        row.cells
          .map((cell) => cell.paragraphs.map(({ text }) => text).join("\n"))
          .join("\t"),
      )
      .join("\n");
  }
  return "";
}

export async function readDocumentText(file: File): Promise<string> {
  if (file.size > MAX_BACKUP_BYTES) {
    throw new Error("Document exceeds the 10 MB size limit.");
  }

  const extension = file.name.split(".").at(-1)?.toLowerCase();
  let text: string;
  if (extension === "pdf") {
    text = await extractPdfText(file);
  } else if (extension === "doc") {
    text = await extractDocText(file);
  } else {
    throw new Error("Choose a JSON backup, PDF, or Word .doc file.");
  }

  if (text.length > MAX_DOCUMENT_TEXT_LENGTH) {
    throw new Error("Extracted document text exceeds the 1 MB limit.");
  }
  return text;
}

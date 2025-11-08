'use client';

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import type { PlaceholderField } from "./ai";

export async function extractTextFromDocx(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided");
  }

  const arrayBuffer = await file.arrayBuffer();

  const mammothModule = await import("mammoth/mammoth.browser");
  const result = await mammothModule.extractRawText({ arrayBuffer });

  return result.value ?? "";
}

type GenerateDocxArgs = {
  buffer: ArrayBuffer;
  placeholders: PlaceholderField[];
  answers: Record<string, string>;
  fileName?: string;
};

export async function generateCompletedDocx({
  buffer,
  placeholders,
  answers,
  fileName = "lexsy-completed-safe.docx",
}: GenerateDocxArgs): Promise<void> {
  if (!buffer) {
    throw new Error("Missing original document data.");
  }
 
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    delimiters: {
      start: "[",
      end: "]",
    },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
    parser(tag) {
      return {
        get(scope) {
          return scope[tag];
        },
      };
    },
  });

  const templateData = buildTemplateData(placeholders, answers);

  doc.setData(templateData);

  try {
    doc.render();
  } catch (error) {
    console.error("Docxtemplater render error", error);
    throw new Error(
      "Unable to merge answers into the document template. Please review the placeholders and try again.",
    );
  }

  const blob = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  saveAs(blob, fileName);
}

function buildTemplateData(
  placeholders: PlaceholderField[],
  answers: Record<string, string>,
): Record<string, string> {
  const data: Record<string, string> = {};

  placeholders.forEach((field) => {
    const key = extractPlaceholderToken(field.placeholder);
    if (!key) {
      return;
    }

    const answer = answers[field.id];

    if (answer === undefined) {
      return;
    }

    data[key] = answer;
  });

  return data;
}

function extractPlaceholderToken(raw?: string | null): string | null {
  if (!raw) {
    return null;
  }

  const match = raw.match(/\[(.*?)\]/);
  const token = (match?.[1] ?? raw).trim();

  if (!token.length) {
    return null;
  }

  return token;
}


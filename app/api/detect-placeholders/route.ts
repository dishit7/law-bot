import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const MODEL_NAME = "gemini-2.0-flash";

const SYSTEM_PROMPT = `You analyze legal documents and identify template placeholders.

Return ONLY valid JSON (no markdown, no explanations) in the following format:
[
  {
    "id": "companyName",
    "placeholder": "[Company Name]",
    "fieldName": "Company Name",
    "fieldType": "text",
    "example": "Acme Inc.",
    "question": "What is the company name?"
  }
]

Rules:
- Use camelCase for "id".
- Only include fields that correspond to dynamic placeholders or blanks.
- Provide a concise, human-friendly question for each placeholder.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const documentText = typeof body?.documentText === "string" ? body.documentText : "";

    if (!documentText.trim()) {
      return NextResponse.json(
        { error: "Document text is required for analysis." },
        { status: 400 },
      );
    }

    const { text } = await generateText({
      model: google(MODEL_NAME),
      prompt: `${SYSTEM_PROMPT}\n\nDocument:\n${documentText}`,
    });

    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed response is not an array.");
      }

      return NextResponse.json({ placeholders: parsed });
    } catch (parseError) {
      console.error("Failed to parse Gemini response", { cleaned });
      return NextResponse.json(
        { error: "Gemini returned an unexpected format. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Placeholder detection error", error);
    return NextResponse.json(
      { error: "Unexpected error while analyzing document." },
      { status: 500 },
    );
  }
}



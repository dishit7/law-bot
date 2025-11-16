import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

type ChatMessage = { role: "ai" | "user"; text: string };

type ChatFillRequest = {
  placeholder: {
    id: string;
    fieldName: string;
    placeholder: string;
    question?: string;
    example?: string;
    fieldType?: string;
  };
  message: string;
  conversation?: ChatMessage[];
  confirmedAnswers?: Record<string, string>;
};

const MODEL_NAME = "gemini-2.0-flash";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatFillRequest;

    if (!body?.placeholder || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const { placeholder, message, conversation = [], confirmedAnswers = {} } = body;

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 },
      );
    }

    const conversationContext = conversation
      .map((entry) => `${entry.role === "ai" ? "Assistant" : "User"}: ${entry.text}`)
      .join("\n");

    const confirmedContext = Object.entries(confirmedAnswers)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const prompt = `
You are a legal document assistant tasked with extracting structured values for placeholders within SAFE agreements.

Placeholder metadata:
- id: ${placeholder.id}
- label: ${placeholder.fieldName}
- placeholderText: ${placeholder.placeholder}
- question: ${placeholder.question ?? "n/a"}
- fieldType: ${placeholder.fieldType ?? "unspecified"}
- example: ${placeholder.example ?? "n/a"}

Previously confirmed answers:
${confirmedContext || "none"}

Conversation so far:
${conversationContext || "None"}

Latest user reply:
"${message}"

Extract ONLY the value that should replace this placeholder. Apply appropriate formatting (e.g., currency with $ symbol, capitalization, date formatting) when obvious.

Respond with STRICT JSON (no markdown, no comments, no surrounding text) in the following structure:
{
  "answer": "string",
  "followUp": "string or null"
}

Rules:
- "answer" must be a concise value (single line). Use an empty string if you cannot confidently extract the answer.
- "followUp" should contain the exact message you want to display to the user next. It can be null if you simply confirm the answer, but prefer to include a friendly confirmation or clarification request.
- Do NOT include additional keys in the JSON response.
`;

    const { text } = await generateText({
      model: google(MODEL_NAME),
      prompt,
    });

    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as {
        answer?: string;
        followUp?: string | null;
      };

      if (typeof parsed.answer !== "string") {
        throw new Error("Missing answer field.");
      }

      return NextResponse.json({
        answer: parsed.answer,
        followUp: parsed.followUp ?? null,
      });
    } catch (parseError) {
      console.error("Failed to parse chat-fill response", {
        original: text,
        cleaned,
        parseError,
      });
      return NextResponse.json(
        {
          error:
            "The assistant returned an unexpected format. Please rephrase your answer.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("chat-fill error", error);
    return NextResponse.json(
      { error: "Unexpected error while parsing the answer." },
      { status: 500 },
    );
  }
}



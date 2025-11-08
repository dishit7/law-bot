export type PlaceholderField = {
  id: string;
  placeholder: string;
  fieldName: string;
  fieldType?: string;
  example?: string;
  question?: string;
};

type DetectPlaceholdersResponse =
  | { placeholders: PlaceholderField[] }
  | { error: string };

export async function detectPlaceholders(documentText: string) {
  const response = await fetch("/api/detect-placeholders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documentText }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as DetectPlaceholdersResponse;
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to analyze document with Gemini.",
    );
  }

  const data = (await response.json()) as DetectPlaceholdersResponse;

  if ("placeholders" in data && Array.isArray(data.placeholders)) {
    return data.placeholders;
  }

  throw new Error("Gemini response was not in the expected format.");
}



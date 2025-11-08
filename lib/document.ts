export async function extractTextFromDocx(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided");
  }

  const arrayBuffer = await file.arrayBuffer();

  const mammothModule = await import("mammoth/mammoth.browser");
  const result = await mammothModule.extractRawText({ arrayBuffer });

  return result.value ?? "";
}



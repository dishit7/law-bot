declare module "mammoth/mammoth.browser" {
  export type MammothExtractionResult = {
    value?: string;
    messages: Array<{ message: string; type: string }>;
  };

  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<MammothExtractionResult>;
}



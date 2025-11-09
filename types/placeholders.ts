'use client';

export type ChatMessage = { role: "ai" | "user"; text: string };

export type PlaceholderStatus = "pending" | "pendingConfirmation" | "confirmed";

export type PlaceholderAnswer = {
  status: PlaceholderStatus;
  value: string;
  conversation: ChatMessage[];
};



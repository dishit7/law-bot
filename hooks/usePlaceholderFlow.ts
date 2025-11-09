'use client';

import { useEffect, useMemo, useState } from "react";
import type { PlaceholderField } from "@/lib/ai";
import type {
  ChatMessage,
  PlaceholderAnswer,
} from "@/types/placeholders";

type UsePlaceholderFlowReturn = {
  placeholders: PlaceholderField[];
  answers: Record<string, PlaceholderAnswer>;
  activePlaceholderId: string | null;
  chatLoading: boolean;
  chatError: string | null;
  confirmedAnswersMap: Record<string, string>;
  answeredCount: number;
  missingCount: number;
  initializePlaceholders: (detected: PlaceholderField[]) => void;
  resetFlow: () => void;
  handleSendMessage: (message: string) => Promise<void>;
  handleConfirmActiveAnswer: () => void;
  handleEditActiveAnswer: () => void;
  handleJumpToPlaceholder: (placeholderId: string) => void;
};

export function usePlaceholderFlow(): UsePlaceholderFlowReturn {
  const [placeholders, setPlaceholders] = useState<PlaceholderField[]>([]);
  const [answers, setAnswers] = useState<Record<string, PlaceholderAnswer>>({});
  const [activePlaceholderId, setActivePlaceholderId] = useState<string | null>(
    null,
  );
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const confirmedAnswersMap = useMemo(() => {
    return placeholders.reduce<Record<string, string>>((acc, field) => {
      const record = answers[field.id];
      if (record?.status === "confirmed" && record.value.trim()) {
        acc[field.id] = record.value.trim();
      }
      return acc;
    }, {});
  }, [answers, placeholders]);

  const answeredCount = useMemo(
    () => Object.keys(confirmedAnswersMap).length,
    [confirmedAnswersMap],
  );

  const missingCount = useMemo(
    () => Math.max(placeholders.length - answeredCount, 0),
    [placeholders.length, answeredCount],
  );

  const updateAnswerRecord = (
    placeholderId: string,
    updater: (current: PlaceholderAnswer) => PlaceholderAnswer,
  ) => {
    setAnswers((prev) => {
      const current = prev[placeholderId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [placeholderId]: updater(current),
      };
    });
  };

  const appendMessage = (placeholderId: string, message: ChatMessage) => {
    updateAnswerRecord(placeholderId, (current) => ({
      ...current,
      conversation: [...current.conversation, message],
    }));
  };

  const initializePlaceholders = (detected: PlaceholderField[]) => {
    setPlaceholders(detected);

    const initialAnswers = detected.reduce<Record<string, PlaceholderAnswer>>(
      (acc, field) => {
        acc[field.id] = {
          status: "pending",
          value: "",
          conversation: [],
        };
        return acc;
      },
      {},
    );

    setAnswers(initialAnswers);
    setActivePlaceholderId(detected[0]?.id ?? null);
    setChatLoading(false);
    setChatError(
      detected.length === 0
        ? "I couldn't find any placeholders in this document. Feel free to review the text above."
        : null,
    );
  };

  const resetFlow = () => {
    setPlaceholders([]);
    setAnswers({});
    setActivePlaceholderId(null);
    setChatLoading(false);
    setChatError(null);
  };

  const handleSendMessage = async (message: string) => {
    if (!activePlaceholderId) {
      return;
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    const placeholder = placeholders.find(
      (field) => field.id === activePlaceholderId,
    );
    const record = answers[activePlaceholderId];

    if (!placeholder || !record) {
      return;
    }

    const conversationForLLM = [
      ...record.conversation,
      { role: "user" as const, text: trimmed },
    ];

    appendMessage(activePlaceholderId, { role: "user", text: trimmed });
    setChatError(null);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeholder,
          message: trimmed,
          conversation: conversationForLLM,
          confirmedAnswers: confirmedAnswersMap,
        }),
      });

      if (!response.ok) {
        throw new Error("The assistant couldn't parse that. Please try again.");
      }

      const payload: {
        answer?: string;
        followUp?: string | null;
      } = await response.json();

      const proposedAnswer = payload.answer?.trim() ?? "";
      const followUp =
        payload.followUp?.trim() ||
        (proposedAnswer
          ? `I'll set ${placeholder.fieldName} to "${proposedAnswer}". Does that look right?`
          : `I couldn't determine the value yet. Can you clarify the ${placeholder.fieldName}?`);

      appendMessage(activePlaceholderId, {
        role: "ai",
        text: followUp,
      });

      if (proposedAnswer) {
        updateAnswerRecord(activePlaceholderId, (current) => ({
          ...current,
          status: "pendingConfirmation",
          value: proposedAnswer,
        }));
      } else {
        updateAnswerRecord(activePlaceholderId, (current) => ({
          ...current,
          status: "pending",
        }));
      }
    } catch (err) {
      const fallback =
        err instanceof Error
          ? err.message
          : "Sorry, I ran into an issue. Please try rephrasing your answer.";
      setChatError(fallback);
      appendMessage(activePlaceholderId, {
        role: "ai",
        text: fallback,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const findFirstPendingPlaceholderId = () => {
    const next = placeholders.find((field) => {
      const record = answers[field.id];
      return !record || record.status !== "confirmed";
    });
    return next?.id ?? null;
  };

  const handleConfirmActiveAnswer = () => {
    if (!activePlaceholderId) {
      return;
    }

    updateAnswerRecord(activePlaceholderId, (current) => ({
      ...current,
      status: "confirmed",
    }));
    appendMessage(activePlaceholderId, {
      role: "ai",
      text: "Great! I've logged that answer.",
    });

    const nextPending = findFirstPendingPlaceholderId();
    setActivePlaceholderId(nextPending);
  };

  const handleEditActiveAnswer = () => {
    if (!activePlaceholderId) {
      return;
    }

    updateAnswerRecord(activePlaceholderId, (current) => ({
      ...current,
      status: "pending",
    }));
    appendMessage(activePlaceholderId, {
      role: "ai",
      text: "No problem—let's update that. What's the correct value?",
    });
  };

  const handleJumpToPlaceholder = (placeholderId: string) => {
    setActivePlaceholderId(placeholderId);
    setChatError(null);
  };

  useEffect(() => {
    if (placeholders.length === 0) {
      if (activePlaceholderId !== null) {
        setActivePlaceholderId(null);
      }
      return;
    }

    const firstPending = findFirstPendingPlaceholderId();

    if (!activePlaceholderId) {
      setActivePlaceholderId(firstPending);
      return;
    }

    const currentRecord = answers[activePlaceholderId];
    if (currentRecord?.status === "confirmed") {
      if (firstPending !== activePlaceholderId) {
        setActivePlaceholderId(firstPending);
      }
    }
  }, [activePlaceholderId, answers, placeholders]);

  useEffect(() => {
    if (!activePlaceholderId) {
      return;
    }

    const record = answers[activePlaceholderId];
    const placeholder = placeholders.find(
      (field) => field.id === activePlaceholderId,
    );

    if (!record || !placeholder) {
      return;
    }

    if (record.conversation.length > 0 || record.status !== "pending") {
      return;
    }

    const question =
      placeholder.question ??
      `What is the correct value for ${placeholder.fieldName}?`;

    setAnswers((prev) => {
      const current = prev[activePlaceholderId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [activePlaceholderId]: {
          ...current,
          conversation: [
            ...current.conversation,
            { role: "ai" as const, text: question },
          ],
        },
      };
    });
  }, [activePlaceholderId, answers, placeholders]);

  return {
    placeholders,
    answers,
    activePlaceholderId,
    chatLoading,
    chatError,
    confirmedAnswersMap,
    answeredCount,
    missingCount,
    initializePlaceholders,
    resetFlow,
    handleSendMessage,
    handleConfirmActiveAnswer,
    handleEditActiveAnswer,
    handleJumpToPlaceholder,
  };
}



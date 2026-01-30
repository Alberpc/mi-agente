export type AvatarState = "idle" | "thinking" | "speaking";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  audioDataUrl?: string;
  createdAt: number;
};

export type N8NResponse = {
  success: boolean;
  data?: {
    content?: string;
    audio?: string | null;
  };
  error?: string;
};

export type N8NPayload = {
  id: string;
  text: string | null;
  audio: string | null;
};

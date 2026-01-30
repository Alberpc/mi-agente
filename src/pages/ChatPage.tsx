import { useState, useCallback } from "react";
import type { AvatarState, ChatMessage } from "../types/chat";
import { sendToN8N } from "../lib/api/n8n";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { AvatarStatus } from "../components/avatar/AvatarStatus";
import { ChatWindow } from "../components/chat/ChatWindow";
import { Composer } from "../components/chat/Composer";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const SESSION_ID =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `session-${Date.now()}`;

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [playingAudioMessageId, setPlayingAudioMessageId] = useState<string | null>(null);
  const { play: playAudio } = useAudioPlayer();

  const handlePlayAudio = useCallback(
    (dataUrl: string, messageId?: string) => {
      setPlayingAudioMessageId(messageId ?? null);
      setAvatarState("speaking");
      playAudio(dataUrl, () => {
        setAvatarState("idle");
        setPlayingAudioMessageId(null);
      });
    },
    [playAudio]
  );

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "createdAt">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: generateId(), createdAt: Date.now() },
    ]);
  }, []);

  const sendToBackend = useCallback(
    async (text: string | null, audio: string | null) => {
      setAvatarState("thinking");
      const payload = { id: SESSION_ID, text, audio };
      const response = await sendToN8N(payload);

      if (!response.success) {
        addMessage({
          role: "assistant",
          text: response.error ?? "Error al conectar con el asistente.",
        });
        setAvatarState("idle");
        return;
      }

      const content = response.data?.content?.trim() ?? "";
      const audioDataUrl = response.data?.audio ?? undefined;

      addMessage({
        role: "assistant",
        text: content || undefined,
        audioDataUrl: audioDataUrl ?? undefined,
      });

      setAvatarState("idle");
    },
    [addMessage]
  );

  const handleSendText = useCallback(
    (text: string) => {
      addMessage({ role: "user", text });
      sendToBackend(text, null);
    },
    [addMessage, sendToBackend]
  );

  const handleSendAudio = useCallback(
    (audioDataUrl: string) => {
      addMessage({ role: "user", audioDataUrl });
      sendToBackend(null, audioDataUrl);
    },
    [addMessage, sendToBackend]
  );

  const handlePlayResponse = useCallback(
    (dataUrl: string, messageId: string) => {
      handlePlayAudio(dataUrl, messageId);
    },
    [handlePlayAudio]
  );

  const isThinking = avatarState === "thinking";

  return (
    <div className="relative h-full w-full min-h-screen overflow-hidden bg-black">
      <AvatarStatus state={avatarState} fullScreen />

      <ChatWindow
        messages={messages}
        onPlayAudio={handlePlayResponse}
        playingAudioMessageId={playingAudioMessageId}
      />

      <Composer
        onSendText={handleSendText}
        onSendAudio={handleSendAudio}
        disabled={isThinking}
      />
    </div>
  );
}

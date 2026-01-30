import type { ChatMessage } from "../../types/chat";

type MessageBubbleProps = {
  message: ChatMessage;
  onPlayAudio?: (dataUrl: string, messageId: string) => void;
  isAudioPlaying?: boolean;
};

function isUserVoiceOnly(message: ChatMessage): boolean {
  return (
    message.role === "user" &&
    Boolean(message.audioDataUrl) &&
    !message.text?.trim()
  );
}

function isAssistantAudioOnly(message: ChatMessage): boolean {
  return (
    message.role === "assistant" &&
    Boolean(message.audioDataUrl) &&
    !message.text?.trim()
  );
}

export function MessageBubble({ message, onPlayAudio, isAudioPlaying }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUserVoiceOnly(message)) {
    return (
      <div
        className="flex w-full justify-end"
        data-testid={`message-user-voice-${message.id}`}
      >
        <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-md bg-violet-600/85 px-4 py-2.5 text-white shadow-lg">
          <span className="text-lg" aria-hidden>🎤</span>
          <span className="text-sm font-medium">Mensaje de voz</span>
        </div>
      </div>
    );
  }

  if (isAssistantAudioOnly(message) && onPlayAudio) {
    return (
      <div
        className="flex w-full justify-start"
        data-testid={`message-assistant-audio-${message.id}`}
      >
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/20 px-4 py-2.5 text-neutral-100 shadow-lg">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/80">
            Respuesta de voz
          </p>
          <button
            type="button"
            onClick={() => onPlayAudio(message.audioDataUrl!, message.id)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/25 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/35"
          >
            <span>{isAudioPlaying ? "▶ Reproduciendo..." : "▶ Reproducir respuesta"}</span>
          </button>
        </div>
      </div>
    );
  }

  const hasContent = message.text?.trim() || (message.role === "assistant" && message.audioDataUrl);
  if (!hasContent) {
    return null;
  }

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.role}-${message.id}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-lg ${
          isUser
            ? "rounded-br-md bg-blue-600/90 text-white"
            : "rounded-bl-md bg-white/20 text-neutral-100"
        }`}
      >
        {message.text && <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>}
        {message.role === "assistant" && message.audioDataUrl && onPlayAudio && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => onPlayAudio(message.audioDataUrl!, message.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-white/25 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/35"
            >
              <span>{isAudioPlaying ? "▶ Reproduciendo..." : "▶ Reproducir respuesta"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

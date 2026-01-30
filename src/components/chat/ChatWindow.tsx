import { useRef, useEffect } from "react";
import type { ChatMessage } from "../../types/chat";
import { MessageBubble } from "./MessageBubble";

type ChatWindowProps = {
  messages: ChatMessage[];
  onPlayAudio: (dataUrl: string, messageId: string) => void;
  playingAudioMessageId: string | null;
};

export function ChatWindow({ messages, onPlayAudio, playingAudioMessageId }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed left-0 right-0 top-0 z-10 flex max-h-[calc(100vh-7.5rem)] flex-col overflow-y-auto px-3 pt-4 pb-2">
      {messages.length === 0 && (
        <div className="flex min-h-[3rem] items-center justify-center py-2 text-neutral-500 text-sm">
          Envía un mensaje o graba audio para empezar.
        </div>
      )}
      <div className="mx-auto w-full max-w-2xl space-y-2.5">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onPlayAudio={msg.role === "assistant" ? onPlayAudio : undefined}
            isAudioPlaying={playingAudioMessageId === msg.id}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

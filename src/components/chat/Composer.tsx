import { useState, useCallback } from "react";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";

type ComposerProps = {
  onSendText: (text: string) => void;
  onSendAudio: (audioDataUrl: string) => void;
  disabled?: boolean;
};

export function Composer({ onSendText, onSendAudio, disabled }: ComposerProps) {
  const [text, setText] = useState("");
  const { isRecording, startRecording, stopRecording, error: recorderError } = useAudioRecorder();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSendText(trimmed);
      setText("");
    },
    [text, disabled, onSendText]
  );

  const handleToggleRecord = useCallback(async () => {
    if (disabled) return;
    if (isRecording) {
      const dataUrl = await stopRecording();
      if (dataUrl) onSendAudio(dataUrl);
    } else {
      await startRecording();
    }
  }, [disabled, isRecording, startRecording, stopRecording, onSendAudio]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 px-4 pt-3"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-2xl rounded-2xl bg-black/60 px-4 py-3.5 backdrop-blur-md">
        {recorderError && (
          <p className="mb-2 text-sm text-red-400">{recorderError}</p>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={disabled}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-base text-white placeholder-neutral-400 outline-none focus:border-white/40 focus:bg-white/15 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleToggleRecord}
            disabled={disabled}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
              isRecording
                ? "bg-red-500 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={isRecording ? "Detener grabación" : "Grabar audio"}
          >
            {isRecording ? (
              <span className="text-sm font-medium">■</span>
            ) : (
              <span className="text-lg">🎤</span>
            )}
          </button>
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
            title="Enviar"
          >
            ▶
          </button>
        </form>
      </div>
    </div>
  );
}

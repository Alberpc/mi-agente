import { useState, useCallback, useRef } from "react";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";

type VoiceMode = {
  isActive: boolean;
  isListening: boolean;
  error: string | null;
  startVoiceMode: () => Promise<void>;
  stopVoiceMode: () => void;
};

type ComposerProps = {
  onSendText: (text: string) => void;
  onSendAudio: (audioDataUrl: string) => void;
  disabled?: boolean;
  voiceMode: VoiceMode;
};

export function Composer({ onSendText, onSendAudio, disabled, voiceMode }: ComposerProps) {
  const [text, setText] = useState("");
  const { isRecording, startRecording, stopRecording, error: recorderError } = useAudioRecorder();
  const recordingRef = useRef(false);

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

  // Push-to-talk (mantener pulsado)
  const handleRecordStart = useCallback(async () => {
    if (disabled || recordingRef.current || voiceMode.isActive) return;
    recordingRef.current = true;
    await startRecording();
  }, [disabled, startRecording, voiceMode.isActive]);

  const handleRecordEnd = useCallback(async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    const dataUrl = await stopRecording();
    if (dataUrl) onSendAudio(dataUrl);
  }, [stopRecording, onSendAudio]);

  // Toggle modo voz continua
  const handleToggleVoiceMode = useCallback(async () => {
    if (voiceMode.isActive) {
      voiceMode.stopVoiceMode();
    } else {
      await voiceMode.startVoiceMode();
    }
  }, [voiceMode]);

  const error = recorderError || voiceMode.error;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 px-4 pt-3"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-2xl rounded-2xl bg-black/60 px-4 py-3.5 backdrop-blur-md">
        {error && (
          <p className="mb-2 text-sm text-red-400">{error}</p>
        )}

        {voiceMode.isActive ? (
          /* ── Modo voz activo: solo el botón para parar ── */
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex items-center gap-2 text-sm text-white/70">
              {voiceMode.isListening ? (
                <>
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span>Escuchando...</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span>Procesando...</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleVoiceMode}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-transform active:scale-95"
              title="Detener modo voz"
            >
              <span className="text-xl font-bold">■</span>
            </button>
            <span className="text-xs text-white/40">Pulsa para terminar</span>
          </div>
        ) : (
          /* ── Modo normal: texto + push-to-talk + modo voz ── */
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
            {/* Push-to-talk */}
            <button
              type="button"
              onMouseDown={handleRecordStart}
              onMouseUp={handleRecordEnd}
              onMouseLeave={handleRecordEnd}
              onTouchStart={handleRecordStart}
              onTouchEnd={handleRecordEnd}
              onTouchCancel={handleRecordEnd}
              disabled={disabled}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors select-none ${
                isRecording
                  ? "bg-red-500 text-white scale-110"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              title="Mantener para hablar"
            >
              {isRecording ? (
                <span className="text-sm font-medium animate-pulse">●</span>
              ) : (
                <span className="text-lg">🎤</span>
              )}
            </button>
            {/* Botón modo voz continua */}
            <button
              type="button"
              onClick={handleToggleVoiceMode}
              disabled={disabled}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
              title="Modo conversación por voz"
            >
              <span className="text-base">🗣️</span>
            </button>
            {/* Enviar texto */}
            <button
              type="submit"
              disabled={disabled || !text.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
              title="Enviar"
            >
              ▶
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

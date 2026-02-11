import { useState, useCallback, useRef } from "react";

type UseVoiceModeOptions = {
  /** Umbral de volumen para considerar silencio (0-255). Default: 15 */
  silenceThreshold?: number;
  /** Milisegundos de silencio antes de enviar. Default: 1500 */
  silenceDuration?: number;
  /** Callback cuando se detecta audio completo */
  onAudioReady: (audioDataUrl: string) => void;
};

type UseVoiceModeReturn = {
  isActive: boolean;
  isListening: boolean;
  error: string | null;
  startVoiceMode: () => Promise<void>;
  stopVoiceMode: () => void;
  /** Llamar cuando la IA termina de hablar para volver a escuchar */
  resumeListening: () => void;
};

export function useVoiceMode({
  silenceThreshold = 15,
  silenceDuration = 1500,
  onAudioReady,
}: UseVoiceModeOptions): UseVoiceModeReturn {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    rafRef.current = null;
    silenceTimerRef.current = null;

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    mediaRecorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;

    chunksRef.current = [];
    hasSpokenRef.current = false;
  }, []);

  const stopAndSend = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    rafRef.current = null;
    silenceTimerRef.current = null;

    mr.onstop = () => {
      setIsListening(false);
      mediaRecorderRef.current = null;

      if (chunksRef.current.length === 0) return;
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      chunksRef.current = [];
      hasSpokenRef.current = false;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && activeRef.current) {
          onAudioReady(reader.result as string);
        }
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
  }, [onAudioReady]);

  const monitorSilence = useCallback(
    (analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.fftSize);

      const check = () => {
        if (!activeRef.current) return;

        analyser.getByteTimeDomainData(data);
        // Calcular volumen: máxima desviación respecto a 128 (silencio)
        let maxDeviation = 0;
        for (let i = 0; i < data.length; i++) {
          const deviation = Math.abs(data[i] - 128);
          if (deviation > maxDeviation) maxDeviation = deviation;
        }

        if (maxDeviation > silenceThreshold) {
          // Hay sonido → el usuario está hablando
          hasSpokenRef.current = true;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasSpokenRef.current && !silenceTimerRef.current) {
          // Silencio después de haber hablado → iniciar temporizador
          silenceTimerRef.current = setTimeout(() => {
            stopAndSend();
          }, silenceDuration);
        }

        rafRef.current = requestAnimationFrame(check);
      };

      rafRef.current = requestAnimationFrame(check);
    },
    [silenceThreshold, silenceDuration, stopAndSend]
  );

  const startListening = useCallback(async () => {
    if (!activeRef.current) return;
    setError(null);

    try {
      // Reutilizar stream si ya existe, si no pedir uno nuevo
      if (!streamRef.current || streamRef.current.getTracks().every((t) => t.readyState === "ended")) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const stream = streamRef.current;

      // Configurar analyser para detección de silencio
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Iniciar grabación
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      hasSpokenRef.current = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(250); // chunks cada 250ms para mejor captura
      setIsListening(true);

      // Empezar a monitorizar silencio
      monitorSilence(analyser);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al acceder al micrófono";
      setError(message);
      setIsListening(false);
    }
  }, [monitorSilence]);

  const startVoiceMode = useCallback(async () => {
    activeRef.current = true;
    setIsActive(true);
    setError(null);
    await startListening();
  }, [startListening]);

  const stopVoiceMode = useCallback(() => {
    activeRef.current = false;
    setIsActive(false);
    setIsListening(false);
    cleanup();
  }, [cleanup]);

  const resumeListening = useCallback(() => {
    if (!activeRef.current) return;
    // Limpiar recursos del ciclo anterior (pero no el stream)
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    rafRef.current = null;
    silenceTimerRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    hasSpokenRef.current = false;

    startListening();
  }, [startListening]);

  return { isActive, isListening, error, startVoiceMode, stopVoiceMode, resumeListening };
}

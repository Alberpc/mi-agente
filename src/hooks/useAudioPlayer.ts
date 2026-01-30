import { useState, useCallback, useRef } from "react";

type UseAudioPlayerReturn = {
  isPlaying: boolean;
  error: string | null;
  play: (dataUrl: string, onEnded?: () => void) => void;
  stop: () => void;
};

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndedRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    const cb = onEndedRef.current;
    onEndedRef.current = null;
    cb?.();
  }, []);

  const play = useCallback(
    (dataUrl: string, onEnded?: () => void) => {
      setError(null);
      stop();

      const audio = new Audio(dataUrl);
      audioRef.current = audio;
      onEndedRef.current = onEnded ?? null;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        audioRef.current = null;
        setIsPlaying(false);
        onEndedRef.current?.();
        onEndedRef.current = null;
      };
      audio.onerror = () => {
        setError("No se pudo reproducir el audio");
        setIsPlaying(false);
        audioRef.current = null;
      };

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          setError(err instanceof Error ? err.message : "Reproducción bloqueada");
          setIsPlaying(false);
          audioRef.current = null;
        });
      }
    },
    [stop]
  );

  return { isPlaying, error, play, stop };
}

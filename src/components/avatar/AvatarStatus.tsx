import type { AvatarState } from "../../types/chat";

const VIDEO_SRC: Record<AvatarState, string> = {
  idle: "/avatar/idle.mp4",
  thinking: "/avatar/thinking.mp4",
  speaking: "/avatar/speaking.mp4",
};

type AvatarStatusProps = {
  state: AvatarState;
  fullScreen?: boolean;
  className?: string;
};

export function AvatarStatus({ state, fullScreen = false, className = "" }: AvatarStatusProps) {
  const src = VIDEO_SRC[state];
  const loop = state === "idle" || state === "thinking";

  const wrapperClass = fullScreen
    ? `fixed inset-0 z-0 bg-black ${className}`.trim()
    : `overflow-hidden rounded-full bg-neutral-800 ${className}`.trim();

  const videoClass = fullScreen
    ? "absolute inset-0 w-full h-full object-cover"
    : "h-full w-full object-cover";

  return (
    <div className={wrapperClass}>
      <video
        key={state}
        src={src}
        autoPlay
        muted
        loop={loop}
        playsInline
        className={videoClass}
      />
    </div>
  );
}

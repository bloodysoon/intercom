"use client";

import { useEffect, useRef } from "react";

interface CameraFeedProps {
  stream: MediaStream;
  mirrored: boolean;
  className?: string;
}

/**
 * Renders a live MediaStream. Keeps playback alive across rotation,
 * visibility changes and iOS autoplay quirks.
 */
export function CameraFeed({ stream, mirrored, className }: CameraFeedProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;

    const play = () => {
      if (video.paused) void video.play().catch(() => {});
    };
    play();
    video.addEventListener("loadedmetadata", play);
    video.addEventListener("pause", play);
    // Some browsers pause the element on rotation; nudge it back.
    window.addEventListener("orientationchange", play);
    screen.orientation?.addEventListener?.("change", play);
    // If autoplay was blocked, the next touch resumes it.
    window.addEventListener("pointerdown", play, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", play);
      video.removeEventListener("pause", play);
      window.removeEventListener("orientationchange", play);
      screen.orientation?.removeEventListener?.("change", play);
      window.removeEventListener("pointerdown", play);
    };
  }, [stream]);

  useEffect(() => {
    const video = ref.current;
    return () => {
      if (video) video.srcObject = null;
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
      autoPlay
      muted
      playsInline
      disablePictureInPicture
      controls={false}
      aria-hidden
    />
  );
}

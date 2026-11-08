"use client";

import { formatDate, formatTime, useClock } from "@/shared/hooks/use-clock";

interface VideoHudProps {
  resolution: string;
}

/** Security-camera style on-screen data: live marker, camera id, clock. */
export function VideoHud({ resolution }: VideoHudProps) {
  const now = useClock();
  return (
    <div className="hud" aria-hidden>
      <span className="hud__corner hud__corner--tl" />
      <span className="hud__corner hud__corner--tr" />
      <span className="hud__corner hud__corner--bl" />
      <span className="hud__corner hud__corner--br" />
      <div className="hud__row hud__row--top">
        <span className="hud__live">
          <span className="hud__rec" />
          LIVE · CAM 01 · INTRARE
        </span>
        <span>{now ? `${formatDate(now)}  ${formatTime(now)}` : " "}</span>
      </div>
      <div className="hud__row hud__row--bottom">
        <span>{resolution}</span>
        <span>DOCHIȚA AI · v2.0</span>
      </div>
    </div>
  );
}

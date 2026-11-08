import { ImageResponse } from "next/og";

/** Renders the app icon (graphite tile with the gold crest and a glowing lens ring). */
export function renderAppIcon(size: number): ImageResponse {
  const s = size;
  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(170deg, #3a3d42 0%, #1c1d20 100%)",
        }}
      >
        <div
          style={{
            width: s * 0.58,
            height: s * 0.58,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `${s * 0.045}px solid #2fe08a`,
            boxShadow: `0 0 ${s * 0.08}px #2fe08a`,
            background: "radial-gradient(circle, #101a2c 0%, #03050a 70%)",
          }}
        >
          <svg width={s * 0.3} height={s * 0.3} viewBox="0 0 48 48">
            <path d="M14.5 30.5 13 18.5l5.6 4.6L24 14.5l5.4 8.6 5.6-4.6-1.5 12H14.5Z" fill="#d9b25c" />
            <rect x="14.5" y="32.5" width="19" height="3" rx="1" fill="#d9b25c" />
          </svg>
        </div>
      </div>
    ),
    { width: s, height: s },
  );
}

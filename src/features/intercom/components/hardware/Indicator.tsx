export type IndicatorColor = "green" | "amber" | "red" | "blue" | "off";

interface IndicatorProps {
  label: string;
  color: IndicatorColor;
  blink?: boolean;
}

/** Small panel LED with an engraved label. */
export function Indicator({ label, color, blink = false }: IndicatorProps) {
  return (
    <span className="indicator">
      <span className="indicator__led" data-on={color === "off" ? undefined : color} data-blink={blink} />
      <span>{label}</span>
    </span>
  );
}

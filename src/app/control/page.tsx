import type { Metadata } from "next";
import { ControlPanel } from "@/features/scene-control/components/ControlPanel";

export const metadata: Metadata = {
  title: "Dochița — Panou regizor",
};

export default function ControlPage() {
  return <ControlPanel />;
}

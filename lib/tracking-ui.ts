import { LucideIcon, ShoppingBag, Clock, Truck, PackageCheck } from "lucide-react";

export type PipelineStep = {
  id: string;
  label: string;
  icon: LucideIcon;
  match: (stage: string) => boolean;
};

/** Display steps aligned with `orders.pipeline_stage` (supports legacy values). */
export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "Received",
    label: "Received",
    icon: ShoppingBag,
    match: (s) => s === "Received" || s === "received",
  },
  {
    id: "Processing",
    label: "Processing",
    icon: Clock,
    match: (s) =>
      s === "Processing" ||
      s === "processing" ||
      s === "Packaging" ||
      s === "packaging",
  },
  {
    id: "Shipped",
    label: "Shipped",
    icon: Truck,
    match: (s) =>
      s === "Shipped" ||
      s === "shipped" ||
      s === "Ready for delivery" ||
      s === "ready for delivery",
  },
  {
    id: "Delivered",
    label: "Delivered",
    icon: PackageCheck,
    match: (s) => s === "Delivered" || s === "delivered",
  },
];

export function pipelineStepIndex(pipelineStage: string | null | undefined): number {
  const stage = (pipelineStage ?? "Received").trim();
  const idx = PIPELINE_STEPS.findIndex((step) => step.match(stage));
  return idx === -1 ? 0 : idx;
}

import type { Metadata } from "next";
import { DispatchesView } from "@/components/DispatchesView";

export const metadata: Metadata = { title: "Dispatches" };

export default function DispatchesPage() {
  return <DispatchesView />;
}

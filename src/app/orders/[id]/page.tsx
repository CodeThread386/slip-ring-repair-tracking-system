import type { Metadata } from "next";
import { OrderDetailView } from "@/components/OrderDetailView";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailView id={Number(id)} />;
}

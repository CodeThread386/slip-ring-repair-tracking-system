import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersView } from "@/components/OrdersView";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  // OrdersView reads ?status= and ?company= from the URL.
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}

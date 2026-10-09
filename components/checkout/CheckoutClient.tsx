"use client";

import { useRouter } from "next/navigation";
import { CheckoutFlow } from "./CheckoutFlow";
import { createPaymentService } from "./PaymentService";
import type { Order } from "./models";

export function CheckoutClient({ order, audience }: { order: Order; audience: "client" | "talent" }) {
  const router = useRouter();
  const billing = `/${audience}/dashboard?tab=billing`;
  return <CheckoutFlow order={order} paymentService={createPaymentService()} onComplete={() => router.replace(billing)} onCancel={() => router.push(billing)} />;
}

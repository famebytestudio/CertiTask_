"use client";

import React, { useMemo, useState } from "react";
import type { Order, Receipt } from "./models";
import type { PaymentService } from "./PaymentService";
import { ConfirmOrderScreen } from "./ConfirmOrderScreen";
import { OrderPlacedScreen } from "./OrderPlacedScreen";
import { ReceiptScreen } from "./ReceiptScreen";

type CheckoutStep = "confirm" | "placed" | "receipt";

interface Props {
  order: Order;
  paymentService: PaymentService;
  /** Called when the user taps "Done" on the final screen. Navigate home here. */
  onComplete: () => void;
  /** Called when user backs out of confirm screen. */
  onCancel?: () => void;
  /** Optional receipt data override (pre-loaded from server). */
  initialReceipt?: Receipt;
  /** Start the flow at a specific step (e.g. "placed" after a redirect). */
  initialStep?: CheckoutStep;
}

/**
 * CheckoutFlow — orchestrates the three checkout screens.
 * Manages step state and builds the Receipt from the Order after success.
 * Drop this into any page and give it an Order + PaymentService.
 *
 * Usage:
 *   <CheckoutFlow
 *     order={order}
 *     paymentService={createPaymentService()}
 *     onComplete={() => router.replace('/client/dashboard?tab=billing')}
 *   />
 */
export function CheckoutFlow({
  order,
  paymentService,
  onComplete,
  onCancel,
  initialReceipt,
  initialStep = "confirm",
}: Props) {
  const [step, setStep] = useState<CheckoutStep>(initialStep);
  const [receipt, setReceipt] = useState<Receipt | undefined>(initialReceipt);

  // Build a receipt from the order when payment succeeds (before server data arrives).
  const builtReceipt: Receipt = useMemo(
    () =>
      receipt ?? {
        receiptNo: `CT-${new Date().getUTCFullYear()}-000000`,
        cardholder: "Cardholder",
        paymentMethod: "Safepay",
        status: "PAID",
        paymentId: order.id,
        plan: order.plan,
        planName: order.planName,
        total: order.total,
        currency: order.currency,
        paidAt: new Date().toISOString(),
        periodStart: null,
        periodEnd: null,
      },
    [receipt, order]
  );

  const handleSuccess = () => {
    setStep("placed");
  };

  const handleViewReceipt = () => {
    setStep("receipt");
  };

  const handleDone = () => {
    onComplete();
  };

  if (step === "confirm") {
    return (
      <ConfirmOrderScreen
        order={order}
        paymentService={paymentService}
        onSuccess={handleSuccess}
        onCancel={onCancel}
      />
    );
  }

  if (step === "placed") {
    return (
      <OrderPlacedScreen
        order={order}
        receipt={builtReceipt}
        onViewReceipt={handleViewReceipt}
        onDone={handleDone}
      />
    );
  }

  return (
    <ReceiptScreen receipt={builtReceipt} onDone={handleDone} />
  );
}

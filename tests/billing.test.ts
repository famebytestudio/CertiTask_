import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import type { Prisma, PrismaClient } from "@prisma/client";
import { BillingError, confirmPayment, consumeApplication } from "../lib/billing";
import { paymentProvider } from "../lib/payments/safepay";
import { FREE_POSTS } from "../lib/plans";

const globalDb = globalThis as typeof globalThis & { prisma?: PrismaClient };
const originalClient = globalDb.prisma;
afterEach(() => { globalDb.prisma = originalClient; mock.restoreAll(); });

function fakeDatabase(initialStatus = "PENDING") {
  let activations = 0;
  let charges = 0;
  let used = FREE_POSTS - 1;
  let mutex = Promise.resolve();
  const payment = { id: "payment-test", status: initialStatus, clientId: "user-test", subscriptionId: "subscription-test", providerRef: "tracker-test", plan: null, amountCents: 500, currency: "USD", receiptNumber: null as string | null, client: { id: "user-test", name: "Test", email: "test@example.test", role: "CLIENT" } };
  const db = {
    payment: {
      findUnique: async () => ({ ...payment }),
      findUniqueOrThrow: async () => ({ ...payment }),
      findFirst: async () => payment.receiptNumber ? { receiptNumber: payment.receiptNumber } : null,
      update: async ({ data }: { data: { status?: string; receiptNumber?: string } }) => { if (data.status) { payment.status = data.status; charges++; } if (data.receiptNumber) payment.receiptNumber = data.receiptNumber; return { ...payment }; },
    },
    user: { findUniqueOrThrow: async () => ({ emailVerifiedAt: new Date(), verificationStatus: "VERIFIED", freePostsUsed: used }), update: async () => { used++; } },
    subscription: { findFirst: async () => null, updateMany: async () => ({ count: 0 }), update: async () => { activations++; } },
    auditLog: { create: async () => ({}) },
    $executeRaw: async () => 1,
    $transaction: async (work: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
      let release = () => {};
      const tx = { ...db, $queryRaw: async () => {
        const before = mutex;
        mutex = new Promise<void>(resolve => { release = resolve; });
        await before;
        return [{ id: "user-test" }];
      } };
      try { return await work(tx as unknown as Prisma.TransactionClient); }
      finally { release(); }
    },
  };
  globalDb.prisma = db as unknown as PrismaClient;
  return { db, payment, counts: () => ({ activations, charges, used }) };
}

test("Concurrent redirect and webhook confirmation activate a subscription only once", async () => {
  const state = fakeDatabase();
  mock.method(paymentProvider, "fetchStatus", async () => ({ state: "TRACKER_ENDED", paid: true, capturedCents: 500, capturedCurrency: "USD", raw: {} }));
  const results = await Promise.all([confirmPayment("payment-test", "redirect"), confirmPayment("payment-test", "webhook")]);
  assert.deepEqual(results.map(result => result.status), ["SUCCEEDED", "SUCCEEDED"]);
  assert.equal(state.counts().activations, 1);
  assert.equal(state.counts().charges, 1);
  assert.match(state.payment.receiptNumber!, /^CT-\d{4}-\d{6}$/);
});

test("A replay after a refund cannot reactivate a subscription", async () => {
  const state = fakeDatabase("REFUNDED");
  const fetch = mock.method(paymentProvider, "fetchStatus", async () => { throw new Error("Provider must not be called"); });
  assert.equal((await confirmPayment("payment-test", "webhook")).status, "REFUNDED");
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(state.counts().activations, 0);
});

test("A mismatched captured amount cannot activate a subscription", async () => {
  const state = fakeDatabase();
  mock.method(paymentProvider, "fetchStatus", async () => ({ state: "TRACKER_ENDED", paid: true, capturedCents: 1, capturedCurrency: "USD", raw: {} }));
  await assert.rejects(confirmPayment("payment-test", "redirect"), error => error instanceof BillingError && error.code === "PROVIDER");
  assert.equal(state.counts().activations, 0);
  assert.equal(state.payment.status, "PENDING");
});

test("Concurrent applications cannot both consume the last free request", async () => {
  const state = fakeDatabase();
  const apply = () => state.db.$transaction(tx => consumeApplication(tx, "user-test"));
  const results = await Promise.allSettled([apply(), apply()]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const failure = results.find(result => result.status === "rejected") as PromiseRejectedResult;
  assert.ok(failure.reason instanceof BillingError);
  assert.equal(failure.reason.code, "PLAN_REQUIRED");
  assert.equal(state.counts().used, FREE_POSTS);
});

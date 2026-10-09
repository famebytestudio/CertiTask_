import { after } from "next/server";

/** Keep post-response work alive for the lifetime of a Vercel invocation. */
export function background(label: string, work: () => Promise<unknown>): void {
  after(async () => {
    try {
      await work();
    } catch (error) {
      console.error(`${label} failed:`, error);
    }
  });
}

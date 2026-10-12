import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageInclude } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated SSE catch-up stream. Each poll re-derives room membership from
 * the session user; a supplied room/message id never grants access.
 */
export async function GET(req: Request) {
  const auth = await requireRole("CLIENT", "TALENT");
  if (auth instanceof NextResponse) return auth;
  const sinceParam = new URL(req.url).searchParams.get("since");
  const since = sinceParam && !Number.isNaN(Date.parse(sinceParam)) ? new Date(sinceParam) : new Date(Date.now() - 30_000);
  const encoder = new TextEncoder();
  let stopped = false;
  req.signal.addEventListener("abort", () => { stopped = true; });

  const stream = new ReadableStream({
    async start(controller) {
      let cursor = since;
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      send("ready", { at: new Date().toISOString() });
      try {
        for (let tick = 0; tick < 25 && !stopped; tick += 1) {
          const messages = await prisma.chatMessage.findMany({
            where: { createdAt: { gt: cursor }, room: { OR: [{ clientId: auth.userId }, { talentId: auth.userId }] } },
            include: messageInclude,
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 100,
          });
          for (const message of messages) {
            send("message", message);
            if (message.createdAt > cursor) cursor = message.createdAt;
          }
          send("heartbeat", { at: new Date().toISOString() });
          await new Promise(resolve => setTimeout(resolve, 2_000));
        }
      } finally {
        if (!stopped) controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}


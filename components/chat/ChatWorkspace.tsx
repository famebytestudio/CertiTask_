"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ChatWorkspace.module.css";

type Person = { id: string; name: string; avatarUrl: string | null };
type Room = {
  id: string;
  clientId: string;
  talentId: string;
  status: "ACTIVE" | "LOCKED" | "ARCHIVED";
  project: { id: string; title: string };
  client: Person;
  talent: Person;
  messages: Message[];
  unreadCount: number;
  muted: boolean;
};
type Message = {
  id: string;
  roomId: string;
  clientId: string;
  senderId: string | null;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  body: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  deliveryStatus?: string;
  sender?: Person | null;
  replyTo?: {
    id: string;
    body: string;
    senderId: string | null;
    deletedAt: string | null;
  } | null;
  reactions?: { emoji: string; userId: string }[];
  attachments?: {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }[];
  pending?: boolean;
  failed?: boolean;
};

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

export function useChatUnread() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () =>
      jsonFetch("/api/chats")
        .then((data) => {
          if (active) setCount(data.unreadCount ?? 0);
        })
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);
  return count;
}

function labelDay(value: string) {
  const date = new Date(value),
    now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const day = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  if (day === start) return "Today";
  if (day === start - 86_400_000) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function ChatWorkspace({ userId }: { userId: string }) {
  const [rooms, setRooms] = useState<Room[]>([]),
    [roomId, setRoomId] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [cursor, setCursor] = useState<string | null>(null),
    [reply, setReply] = useState<Message | null>(null),
    [sending, setSending] = useState(false),
    [scrolledUp, setScrolledUp] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const room = rooms.find((item) => item.id === roomId) ?? null;
  const other = room
    ? room.clientId === userId
      ? room.talent
      : room.client
    : null;

  const loadRooms = useCallback(async () => {
    const data = await jsonFetch("/api/chats");
    setRooms(data.rooms);
    setRoomId(
      (current) =>
        current ??
        new URLSearchParams(window.location.search).get("room") ??
        data.rooms[0]?.id ??
        null,
    );
  }, []);
  useEffect(() => {
    queueMicrotask(() => void loadRooms().catch((e) => setError(e.message)));
  }, [loadRooms]);
  const loadMessages = useCallback(async (id: string, before?: string) => {
    const data = await jsonFetch(
      `/api/chats/${id}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`,
    );
    setMessages((current) =>
      before ? [...data.messages, ...current] : data.messages,
    );
    setCursor(data.nextCursor);
    if (!before)
      requestAnimationFrame(() =>
        box.current?.scrollTo({ top: box.current.scrollHeight }),
      );
  }, []);
  useEffect(() => {
    if (roomId) queueMicrotask(() => void loadMessages(roomId).catch((e) => setError(e.message)));
  }, [roomId, loadMessages]);

  useEffect(() => {
    let source: EventSource | null = null,
      timer = 0,
      attempt = 0,
      stopped = false;
    const connect = () => {
      if (stopped) return;
      source = new EventSource(
        `/api/chats/stream?since=${encodeURIComponent(new Date(Date.now() - 5000).toISOString())}`,
      );
      source.addEventListener("message", (event) => {
        const message: Message = JSON.parse((event as MessageEvent).data);
        if (message.roomId === roomId)
          setMessages((current) =>
            current.some(
              (item) =>
                item.id === message.id ||
                (item.clientId === message.clientId &&
                  item.senderId === message.senderId),
            )
              ? current.map((item) =>
                  item.clientId === message.clientId ? message : item,
                )
              : [...current, message],
          );
        void loadRooms();
        attempt = 0;
      });
      source.onerror = () => {
        source?.close();
        timer = window.setTimeout(
          connect,
          Math.min(30_000, 1000 * 2 ** attempt++),
        );
      };
    };
    connect();
    return () => {
      stopped = true;
      source?.close();
      window.clearTimeout(timer);
    };
  }, [roomId, loadRooms]);

  useEffect(() => {
    const last = messages.at(-1);
    if (!last || !roomId) return;
    if (!scrolledUp)
      requestAnimationFrame(() =>
        box.current?.scrollTo({ top: box.current.scrollHeight }),
      );
    if (last.senderId !== userId)
      void jsonFetch(`/api/chats/${roomId}/read`, {
        method: "POST",
        body: JSON.stringify({ messageId: last.id }),
      })
        .then(loadRooms)
        .catch(() => undefined);
  }, [messages, roomId, userId, scrolledUp, loadRooms]);

  async function send() {
    if (!roomId || !draft.trim() || sending) return;
    const body = draft.trim(),
      clientId = crypto.randomUUID(),
      optimistic: Message = {
        id: clientId,
        clientId,
        roomId,
        senderId: userId,
        type: "TEXT",
        body,
        createdAt: new Date().toISOString(),
        pending: true,
        reactions: [],
        replyTo: reply
          ? {
              id: reply.id,
              body: reply.body,
              senderId: reply.senderId,
              deletedAt: reply.deletedAt ?? null,
            }
          : null,
      };
    setMessages((current) => [...current, optimistic]);
    setDraft("");
    setReply(null);
    setSending(true);
    setError("");
    try {
      const data = await jsonFetch(`/api/chats/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body, clientId, replyToId: reply?.id }),
      });
      setMessages((current) =>
        current.map((item) =>
          item.clientId === clientId ? data.message : item,
        ),
      );
    } catch (e) {
      setMessages((current) =>
        current.map((item) =>
          item.clientId === clientId
            ? { ...item, pending: false, failed: true }
            : item,
        ),
      );
      setError(e instanceof Error ? e.message : "Message failed");
    } finally {
      setSending(false);
    }
  }

  async function upload(file: File) {
    if (!roomId || sending) return;
    setSending(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("clientId", crypto.randomUUID());
    try {
      const response = await fetch(`/api/chats/${roomId}/attachments`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Upload failed");
      setMessages((current) =>
        current.some((item) => item.id === data.message.id)
          ? current
          : [...current, data.message],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSending(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(message: Message) {
    if (!confirm("Delete this message?")) return;
    await jsonFetch(`/api/messages/${message.id}`, { method: "DELETE" });
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? { ...item, body: "", deletedAt: new Date().toISOString() }
          : item,
      ),
    );
  }
  async function edit(message: Message) {
    const body = prompt("Edit message", message.body);
    if (!body || body === message.body) return;
    const data = await jsonFetch(`/api/messages/${message.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    setMessages((current) =>
      current.map((item) => (item.id === message.id ? data.message : item)),
    );
  }
  async function react(message: Message, emoji: string) {
    const data = await jsonFetch(`/api/messages/${message.id}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, reactions: data.reactions } : item,
      ),
    );
  }
  const groups = useMemo(
    () =>
      messages.map((message, index) => ({
        message,
        day:
          index === 0 ||
          labelDay(messages[index - 1].createdAt) !==
            labelDay(message.createdAt)
            ? labelDay(message.createdAt)
            : null,
      })),
    [messages],
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.rooms} aria-label="Project chats">
        <div className={styles.roomsHead}>
          <h2>Messages</h2>
        </div>
        {rooms.map((item) => {
          const person = item.clientId === userId ? item.talent : item.client;
          return (
            <button
              className={`${styles.room} ${item.id === roomId ? styles.active : ""}`}
              key={item.id}
              onClick={() => setRoomId(item.id)}
            >
              <span className={styles.avatar}>
                  {person.name[0]}
              </span>
              <span>
                <span className={styles.roomName}>{person.name}</span>
                <span className={styles.roomProject}>{item.project.title}</span>
                <span className={styles.preview}>
                  {item.messages[0]?.deletedAt
                    ? "Message deleted"
                    : item.messages[0]?.body || item.project.title}
                </span>
              </span>
              {item.unreadCount > 0 && (
                <span className={styles.badge}>{item.unreadCount}</span>
              )}
            </button>
          );
        })}
        {rooms.length === 0 && (
          <div className={styles.empty}>
            A chat appears here after a project request is accepted.
          </div>
        )}
      </aside>
      <section
        className={styles.chat}
        aria-label={room ? `Chat for ${room.project.title}` : "Chat"}
      >
        {!room ? (
          <div className={styles.empty}>Select a conversation</div>
        ) : (
          <>
            <header className={styles.header}>
              <div>
                <h3>{other?.name}</h3>
                <span className={styles.preview}>
                  {room.project.title} · {room.status.toLowerCase()}
                </span>
              </div>
              <Link href={`/projects/${room.project.id}`}>View project</Link>
            </header>
            {room.status !== "ACTIVE" && (
              <div className={styles.locked}>
                This project chat is read-only. Its history is preserved.
              </div>
            )}
            <div
              className={styles.messages}
              ref={box}
              aria-live="polite"
              onScroll={(event) => {
                const el = event.currentTarget;
                setScrolledUp(
                  el.scrollHeight - el.scrollTop - el.clientHeight > 120,
                );
                if (el.scrollTop < 40 && cursor)
                  void loadMessages(room.id, cursor);
              }}
            >
              {groups.map(({ message, day }) => (
                <div key={message.id}>
                  {day && <div className={styles.day}>{day}</div>}
                  <div
                    id={`message-${message.id}`}
                    className={`${styles.row} ${message.senderId === userId ? styles.mine : ""} ${message.type === "SYSTEM" ? styles.system : ""}`}
                  >
                    <div
                      className={`${styles.bubble} ${message.failed ? styles.failed : ""}`}
                      title={new Date(message.createdAt).toLocaleString()}
                    >
                      {message.replyTo && (
                        <div className={styles.quote}>
                          {message.replyTo.deletedAt
                            ? "Message deleted"
                            : message.replyTo.body.slice(0, 100)}
                        </div>
                      )}
                      {message.deletedAt ? (
                        <em>Message deleted</em>
                      ) : (
                        message.body
                      )}
                      {message.attachments?.map((file) => (
                        <a
                          key={file.id}
                          href={`/api/chat-attachments/${file.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.mimeType.startsWith("image/") ? "View image" : "Download"} - {file.fileName} ({Math.ceil(file.sizeBytes / 1024)} KB)
                        </a>
                      ))}
                      <div className={styles.meta}>
                        {message.editedAt && "edited"}
                        {message.pending
                          ? "sending"
                          : message.failed
                            ? "failed"
                            : message.senderId === userId
                              ? "sent"
                              : ""}{" "}
                        ·{" "}
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {!message.deletedAt && message.type !== "SYSTEM" && (
                        <div className={styles.actions}>
                          <button onClick={() => setReply(message)}>
                            Reply
                          </button>
                          <button onClick={() => void react(message, "👍")}>
                            👍
                          </button>
                          {message.senderId === userId && (
                            <>
                              <button onClick={() => void edit(message)}>
                                Edit
                              </button>
                              <button onClick={() => void remove(message)}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      <div className={styles.reactions}>
                        {Object.entries(
                          (message.reactions ?? []).reduce<
                            Record<string, number>
                          >(
                            (acc, item) => ({
                              ...acc,
                              [item.emoji]: (acc[item.emoji] ?? 0) + 1,
                            }),
                            {},
                          ),
                        ).map(([emoji, count]) => (
                          <button
                            className={styles.reaction}
                            key={emoji}
                            onClick={() => void react(message, emoji)}
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {scrolledUp && (
                <button
                  className={styles.newButton}
                  onClick={() => {
                    box.current?.scrollTo({ top: box.current.scrollHeight });
                    setScrolledUp(false);
                  }}
                >
                  New messages ↓
                </button>
              )}
            </div>
            {room.status === "ACTIVE" && (
              <div className={styles.composer}>
                {reply && (
                  <div className={styles.replying}>
                    Replying to: {reply.body.slice(0, 80)}{" "}
                    <button onClick={() => setReply(null)}>×</button>
                  </div>
                )}
                <div className={styles.composeRow}>
                  <input
                    ref={fileInput}
                    type="file"
                    aria-label="Attach an image, PDF, or document"
                    accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(file);
                    }}
                  />
                  <button
                    type="button"
                    className={styles.send}
                    disabled={sending}
                    onClick={() => fileInput.current?.click()}
                    aria-label="Attach file"
                  >
                    Attach
                  </button>
                  <textarea
                    aria-label="Message"
                    value={draft}
                    placeholder="Write a message…"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <button
                    className={styles.send}
                    disabled={!draft.trim() || sending}
                    onClick={() => void send()}
                  >
                    Send
                  </button>
                </div>
                {error && (
                  <div role="alert" className={styles.preview}>
                    {error}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

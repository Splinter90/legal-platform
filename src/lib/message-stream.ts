type Subscriber = {
  send: (event: string, data: unknown) => void;
};

type Channel = Set<Subscriber>;

const channels: Map<string, Channel> = (globalThis as any).__messageChannels || new Map();
if (!(globalThis as any).__messageChannels) {
  (globalThis as any).__messageChannels = channels;
}

export function channelKey(role: "client" | "lawyer", userId: string): string {
  return `${role}:${userId}`;
}

export function subscribe(key: string, sub: Subscriber): () => void {
  let ch = channels.get(key);
  if (!ch) {
    ch = new Set();
    channels.set(key, ch);
  }
  ch.add(sub);
  return () => {
    const c = channels.get(key);
    if (!c) return;
    c.delete(sub);
    if (c.size === 0) channels.delete(key);
  };
}

export function publishToUser(
  role: "client" | "lawyer",
  userId: string,
  event: string,
  data: unknown
): void {
  const ch = channels.get(channelKey(role, userId));
  if (!ch) return;
  for (const sub of ch) {
    try {
      sub.send(event, data);
    } catch {
      // ignore broken pipe — cleanup is handled by sse handler
    }
  }
}

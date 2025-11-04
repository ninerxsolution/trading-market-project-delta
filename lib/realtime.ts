type Subscriber = {
  userId: string;
  send: (data: any) => void;
  close: () => void;
};

type GlobalRealtime = {
  subscribers: Map<string, Set<Subscriber>>;
};

const g = globalThis as unknown as { __realtime?: GlobalRealtime };
if (!g.__realtime) {
  g.__realtime = { subscribers: new Map() };
}

export function addSubscriber(userId: string, sub: Subscriber) {
  const set = g.__realtime!.subscribers.get(userId) ?? new Set<Subscriber>();
  set.add(sub);
  g.__realtime!.subscribers.set(userId, set);
}

export function removeSubscriber(userId: string, sub: Subscriber) {
  const set = g.__realtime!.subscribers.get(userId);
  if (set) {
    set.delete(sub);
    if (set.size === 0) g.__realtime!.subscribers.delete(userId);
  }
}

export function broadcastTo(userId: string, payload: any) {
  const set = g.__realtime!.subscribers.get(userId);
  if (!set) return;
  for (const sub of set) {
    try { sub.send(payload); } catch {}
  }
}



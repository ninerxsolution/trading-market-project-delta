import { NextRequest } from 'next/server';
import { addSubscriber, removeSubscriber } from '@/lib/realtime';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
  const session = await sessionRes.json().catch(() => ({} as any));
  if (!sessionRes.ok || !session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId: string = session.user.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        const line = `event: message\n` + `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };
      const sub = { userId, send, close: () => controller.close() };
      addSubscriber(userId, sub);

      // heartbeat
      const interval = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keep-alive\n\n')); } catch {}
      }, 25000);

      const close = () => {
        clearInterval(interval);
        removeSubscriber(userId, sub);
        try { controller.close(); } catch {}
      };

      // close on client abort
      (request as any).signal?.addEventListener?.('abort', close);
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}



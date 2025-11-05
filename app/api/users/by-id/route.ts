import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/users/by-id?ids=a,b,c
export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get('ids') || '';
    const ids = idsParam
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ users: [] });

    const users = await prisma.user.findMany({ where: { id: { in: ids } } });
    const payload = users.map(u => ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio }));
    return NextResponse.json({ users: payload });
  } catch (e) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}

// POST /api/users/by-id  { ids: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : [];
    if (ids.length === 0) return NextResponse.json({ users: [] });

    const users = await prisma.user.findMany({ where: { id: { in: ids } } });
    const payload = users.map(u => ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio }));
    return NextResponse.json({ users: payload });
  } catch (e) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}



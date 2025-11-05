import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import type { Order as PrismaOrder } from '@prisma/client';
type OrderDto = Omit<PrismaOrder, 'proofImages'> & { proofImages: string[] };
type PrismaErrorWithCode = { code?: string };

// GET /api/orders - get all orders for current user
export async function GET() {
  try {
    // Debug: Check if prisma is defined
    if (!prisma) {
      console.error('[orders] prisma is undefined!');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get session from cookie directly (same logic as /api/auth/session)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session && session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get orders where user is seller or buyer
    let orders: PrismaOrder[];
    try {
      orders = await prisma.order.findMany({
        where: {
          OR: [
            { sellerId: userId },
            { buyerId: userId },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (err: unknown) {
      // If the Order table/model doesn't exist yet, avoid crashing the page
      if (typeof err === 'object' && err !== null && (err as PrismaErrorWithCode).code === 'P2021') {
        orders = [] as PrismaOrder[];
      } else {
        throw err;
      }
    }

    // Convert proofImages from JSON string to array
    const ordersWithArrays: OrderDto[] = orders.map((order) => ({
      ...order,
      proofImages: order.proofImages ? (JSON.parse(order.proofImages) as string[]) : [],
    }));

    return NextResponse.json({ orders: ordersWithArrays });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 });
  }
}

// POST /api/orders - create a new order
export async function POST(request: NextRequest) {
  try {
    // Get session from cookie directly
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session && session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, itemId, sellerId, buyerId, price } = await request.json();
    
    if (!listingId || !itemId || !sellerId || !buyerId || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Ensure buyer is the current user
    if (buyerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check for existing active orders for this listing
    if (!prisma) {
      console.error('[orders POST] prisma is undefined!');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const existingOrders = await prisma.order.findMany({
      where: {
        listingId,
        status: {
          in: ['RESERVED', 'AWAITING_SELLER_CONFIRM', 'AWAITING_BUYER_CONFIRM'],
        },
      },
    });

    if (existingOrders.length > 0) {
      return NextResponse.json({ error: 'Listing is already reserved' }, { status: 400 });
    }

    // Calculate expiry date (72 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const order = await prisma.order.create({
      data: {
        listingId,
        itemId,
        sellerId,
        buyerId,
        price,
        status: 'RESERVED',
        proofImages: JSON.stringify([]), // Store as JSON string
        expiresAt,
      },
    });

    // Convert proofImages from JSON string to array
    const orderWithArray = {
      ...order,
      proofImages: order.proofImages ? JSON.parse(order.proofImages) : [],
    };

    return NextResponse.json({ success: true, order: orderWithArray });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/orders - get all orders for current user
export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
      credentials: 'include',
      headers: { cookie },
    });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionData.user.id;

    // Get orders where user is seller or buyer
    const orders = await prisma.order.findMany({
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

    // Convert proofImages from JSON string to array
    const ordersWithArrays = orders.map(order => ({
      ...order,
      proofImages: order.proofImages ? JSON.parse(order.proofImages) : [],
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
    const cookie = request.headers.get('cookie') || '';
    const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
      credentials: 'include',
      headers: { cookie },
    });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, itemId, sellerId, buyerId, price } = await request.json();
    
    if (!listingId || !itemId || !sellerId || !buyerId || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Ensure buyer is the current user
    if (buyerId !== sessionData.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check for existing active orders for this listing
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


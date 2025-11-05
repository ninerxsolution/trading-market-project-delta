import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/orders/[id] - get order by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const userId = sessionData.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is seller or buyer
    if (order.sellerId !== userId && order.buyerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Convert proofImages from JSON string to array
    const orderWithArray = {
      ...order,
      proofImages: order.proofImages ? JSON.parse(order.proofImages) : [],
    };

    return NextResponse.json({ order: orderWithArray });
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to get order' }, { status: 500 });
  }
}

// PATCH /api/orders/[id] - update order status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const userId = sessionData.user.id;
    const { status, proofImages, disputeReason } = await request.json();

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is seller or buyer
    if (existingOrder.sellerId !== userId && existingOrder.buyerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Reset expiry when status changes (72 hours from now)
    if (status) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);
      updateData.expiresAt = expiresAt;
    }

    // Update proof images if provided
    if (proofImages && Array.isArray(proofImages)) {
      updateData.proofImages = JSON.stringify(proofImages);
    }

    // Update dispute reason if provided
    if (disputeReason !== undefined) {
      updateData.disputeReason = disputeReason;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Convert proofImages from JSON string to array
    const orderWithArray = {
      ...order,
      proofImages: order.proofImages ? JSON.parse(order.proofImages) : [],
    };

    return NextResponse.json({ success: true, order: orderWithArray });
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}


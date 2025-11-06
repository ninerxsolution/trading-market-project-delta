import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastTo } from '@/lib/realtime';

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
    const requesterId: string = sessionData.user.id;
    const requesterRole: string | undefined = sessionData.user.role;

    const body = await request.json();
    const nextStatus: string | undefined = body?.status;
    const proofImages: string[] | undefined = body?.proofImages;
    const disputeReason: string | undefined = body?.disputeReason;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const isParticipant = requesterId === order.sellerId || requesterId === order.buyerId;
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN';
    if (!isParticipant && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const mergedProofImages = Array.isArray(proofImages) ? JSON.stringify(proofImages) : undefined;
    const current = order.status as string;

    // Non-status update: only update assets
    if (!nextStatus) {
      const updated = await prisma.order.update({
        where: { id },
        data: {
          proofImages: mergedProofImages ?? order.proofImages,
          disputeReason: typeof disputeReason === 'string' ? disputeReason : order.disputeReason,
          updatedAt: new Date(),
        },
      });
      const dto = { ...updated, proofImages: updated.proofImages ? JSON.parse(updated.proofImages) : [] };
      return NextResponse.json({ success: true, order: dto });
    }

    const actingRole: 'SELLER' | 'BUYER' | 'ADMIN' = isSuperAdmin
      ? 'ADMIN'
      : requesterId === order.sellerId
        ? 'SELLER'
        : 'BUYER';

    if (nextStatus === 'AWAITING_BUYER_CONFIRM') {
      if (actingRole !== 'SELLER' && actingRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Only seller can confirm readiness' }, { status: 403 });
      }
      if (current !== 'RESERVED' && current !== 'AWAITING_SELLER_CONFIRM') {
        return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
      }
      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'AWAITING_BUYER_CONFIRM', proofImages: mergedProofImages ?? order.proofImages, updatedAt: new Date() },
      });
      const dto = { ...updated, proofImages: updated.proofImages ? JSON.parse(updated.proofImages) : [] };
      
      // Send automatic message to chat when seller marks as sent
      try {
        const message = await prisma.chatMessage.create({
          data: {
            senderId: order.sellerId,
            receiverId: order.buyerId,
            message: 'Order has been marked as sent. Please confirm receipt.',
            orderId: order.id,
          },
        });

        // Broadcast to both participants
        const payload = { type: 'message', message };
        try { broadcastTo(order.buyerId, payload); } catch {}
        try { broadcastTo(order.sellerId, payload); } catch {}
      } catch (error) {
        // Don't fail order update if message sending fails
        console.error('Failed to send automatic message on mark as sent:', error);
      }
      
      return NextResponse.json({ success: true, order: dto });
    }

    if (nextStatus === 'COMPLETED') {
      if (actingRole !== 'BUYER' && actingRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Only buyer can complete order' }, { status: 403 });
      }
      if (!['AWAITING_BUYER_CONFIRM', 'AWAITING_SELLER_CONFIRM', 'RESERVED'].includes(current)) {
        return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const quantity = (order as unknown as { quantity?: number }).quantity ?? 1;

        // Try to update real listing stock; if listing does not exist (mock listing), skip stock update
        const listing = await tx.saleListing.findUnique({ where: { id: order.listingId } });
        if (listing) {
          const listingWithStock = listing as unknown as { stock?: number; status?: 'ACTIVE' | 'RESERVED' | 'SOLD_OUT' | 'INACTIVE' };
          const currentStock = listingWithStock.stock || 0;
          if (currentStock < quantity) {
            throw new Error('Insufficient stock');
          }
          const newStock = currentStock - quantity;
          await tx.saleListing.update({
            where: { id: listing.id },
            data: {
              stock: newStock,
              status: newStock <= 0 ? 'SOLD_OUT' : listingWithStock.status,
            },
          });
        }

        const completed = await tx.order.update({
          where: { id },
          data: { status: 'COMPLETED', proofImages: mergedProofImages ?? order.proofImages, updatedAt: new Date() },
        });

        await tx.tradeHistory.create({
          data: {
            orderId: completed.id,
            buyerId: completed.buyerId,
            sellerId: completed.sellerId,
            itemId: completed.itemId,
            quantity,
          },
        });

        return completed;
      });

      const dto = { ...result, proofImages: result.proofImages ? JSON.parse(result.proofImages) : [] };
      
      // Send automatic message to chat when buyer confirms receipt
      try {
        const message = await prisma.chatMessage.create({
          data: {
            senderId: order.buyerId,
            receiverId: order.sellerId,
            message: 'Order confirmed and completed. Thank you for the trade!',
            orderId: order.id,
          },
        });

        // Broadcast to both participants
        const payload = { type: 'message', message };
        try { broadcastTo(order.sellerId, payload); } catch {}
        try { broadcastTo(order.buyerId, payload); } catch {}
      } catch (error) {
        // Don't fail order update if message sending fails
        console.error('Failed to send automatic message on order completion:', error);
      }
      
      return NextResponse.json({ success: true, order: dto });
    }

    if (nextStatus === 'CANCELLED' || nextStatus === 'DISPUTE') {
      if (!['RESERVED', 'AWAITING_SELLER_CONFIRM', 'AWAITING_BUYER_CONFIRM'].includes(current)) {
        return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
      }
      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: nextStatus as any,
          disputeReason: typeof disputeReason === 'string' ? disputeReason : order.disputeReason,
          proofImages: mergedProofImages ?? order.proofImages,
          updatedAt: new Date(),
        },
      });
      const dto = { ...updated, proofImages: updated.proofImages ? JSON.parse(updated.proofImages) : [] };
      return NextResponse.json({ success: true, order: dto });
    }

    if (nextStatus === 'AWAITING_SELLER_CONFIRM') {
      if (actingRole !== 'SELLER' && actingRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Only seller can confirm' }, { status: 403 });
      }
      if (current !== 'RESERVED') {
        return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
      }
      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'AWAITING_SELLER_CONFIRM', proofImages: mergedProofImages ?? order.proofImages, updatedAt: new Date() },
      });
      const dto = { ...updated, proofImages: updated.proofImages ? JSON.parse(updated.proofImages) : [] };
      return NextResponse.json({ success: true, order: dto });
    }

    return NextResponse.json({ error: 'Unsupported transition' }, { status: 400 });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Failed to update order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/sale-listings/[id] - update listing price/stock (owner only)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const cookie = request.headers.get('cookie') || '';
    const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listing = await prisma.saleListing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.userId !== sessionData.user.id && sessionData.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates: { price?: number; stock?: number; description?: string; status?: 'ACTIVE' | 'RESERVED' | 'SOLD_OUT' | 'INACTIVE' } = {};

    if (typeof body.price === 'number') {
      if (body.price <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      updates.price = Math.floor(body.price);
    }
    if (typeof body.stock === 'number') {
      if (body.stock < 0) return NextResponse.json({ error: 'Invalid stock' }, { status: 400 });
      updates.stock = Math.floor(body.stock);
      // Auto adjust status when stock becomes 0 or positive
      if (updates.stock === 0) {
        updates.status = 'SOLD_OUT';
      } else if (listing.status === 'SOLD_OUT' || listing.status === 'INACTIVE') {
        updates.status = 'ACTIVE';
      }
    }
    if (typeof body.description === 'string') {
      updates.description = body.description;
    }

    // Handle tags update
    if (Array.isArray(body.tags)) {
      // Delete existing tags
      await prisma.saleListingTag.deleteMany({
        where: { listingId: id },
      });

      // Add new tags
      for (const tagName of body.tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName.trim() },
            update: {},
            create: { name: tagName.trim() },
          });

          await prisma.saleListingTag.create({
            data: {
              listingId: id,
              tagId: tag.id,
            },
          }).catch(() => {});
        }
      }
    }

    if (Object.keys(updates).length === 0 && !Array.isArray(body.tags)) {
      return NextResponse.json({ error: 'No changes' }, { status: 400 });
    }

    const updated = await prisma.saleListing.update({ 
      where: { id }, 
      data: updates,
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    const result = {
      ...updated,
      tags: updated.tags.map(t => t.tag.name),
    };
    
    return NextResponse.json({ success: true, listing: result });
  } catch (e) {
    console.error('PATCH /api/sale-listings/[id] error:', e);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}



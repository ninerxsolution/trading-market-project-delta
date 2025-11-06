'use client';

import React from 'react';
import { X, MessageCircle, Users } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useChat } from '@/lib/contexts/chat-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useOrder } from '@/lib/contexts/order-context';
import { ShoppingCart } from 'lucide-react';

type BasicItem = {
  id: string;
  name: string;
  image: string;
  description: string;
  rarity: string;
  averagePrice?: number;
  avgSellerPrice?: number;
};

interface ItemDetailModalProps {
  item: BasicItem | null;
  onClose: () => void;
}

const rarityColors = {
  Common: 'bg-gray-500',
  Uncommon: 'bg-blue-500',
  Rare: 'bg-purple-500',
  Epic: 'bg-pink-500',
  Legendary: 'bg-yellow-500',
};

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const { openChat } = useChat();
  const { user } = useAuth();
  const { createOrder, getOrdersForListing } = useOrder();
  const [sellers, setSellers] = React.useState<Array<{ id: string; username: string; avatar: string; bio: string; price?: number; stock?: number; listingId?: string }>>([]);
  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!item) return;
      try {
        const res = await fetch(`/api/items/${item.id}/sellers`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setSellers(data.sellers || []);
        } else {
          if (!ignore) setSellers([]);
        }
      } catch {
        if (!ignore) setSellers([]);
      }
    };
    load();
    return () => { ignore = true; };
  }, [item]);

  if (!item) return null;

  const handleChatWithOwner = (sellerId: string) => {
    if (user) {
      openChat(sellerId);
      // Don't close immediately - let user see the chat open
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  const handleBuy = async (sellerId: string, sellerPrice?: number, listingIdFromApi?: string) => {
    if (!user || !item) return;
    
    // Prefer real listing id from API, fallback to mock
    const listingId = listingIdFromApi || `listing-${sellerId}-${item.id}`;
    const price = sellerPrice || item.averagePrice || item.avgSellerPrice || 0;
    
    // Check if there's already an active order for this listing
    const existingOrders = getOrdersForListing(listingId);
    const activeOrder = existingOrders.find(o => 
      o.status === 'RESERVED' || 
      o.status === 'AWAITING_SELLER_CONFIRM' || 
      o.status === 'AWAITING_BUYER_CONFIRM'
    );
    
    if (activeOrder) {
      alert('This listing is already reserved. Please wait for the current order to complete.');
      return;
    }
    
    try {
      // Create order and reserve listing
      await createOrder(listingId, item.id, sellerId, user.id, price);
      
      // Open chat with seller
      openChat(sellerId);
      
      // Close modal
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-card rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="relative w-full md:w-1/2 h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                unoptimized
              />
              <div className={cn(
                "absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-bold text-white",
                rarityColors[item.rarity]
              )}>
                {item.rarity}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{item.name}</h2>
              <p className="text-muted-foreground mb-4">{item.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="font-semibold">Average Price</span>
                  <span className="text-2xl font-bold text-primary">
                    {((item.avgSellerPrice ?? item.averagePrice) ?? 0).toLocaleString()} R$
                  </span>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">
                    {sellers.length} {sellers.length === 1 ? 'user is' : 'users are'} selling this item
                  </span>
                </div>
              </div>
            </div>
          </div>

          {sellers.length > 0 && (
            <div className="border-t border-border pt-6">
              <h3 className="text-xl font-bold mb-4">Current Sellers</h3>
              <div className="space-y-2">
                    {sellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/20">
                        <Image
                          src={seller.avatar}
                          alt={seller.username}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{seller.username}</p>
                        <p className="text-xs text-muted-foreground">{seller.bio}</p>
                        {seller.price ? (
                          <p className="text-xs font-semibold">{seller.price.toLocaleString()} R$ {typeof seller.stock === 'number' ? `(Stock: ${seller.stock})` : ''}</p>
                        ) : (typeof seller.stock === 'number' ? <p className="text-xs text-muted-foreground">Stock: {seller.stock}</p> : null)}
                      </div>
                    </div>
                    {user && user.id !== seller.id && (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={typeof seller.stock === 'number' && seller.stock <= 0}
                          onClick={() => handleBuy(seller.id, seller.price, seller.listingId)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Buy
                        </button>
                        <button
                          onClick={() => handleChatWithOwner(seller.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


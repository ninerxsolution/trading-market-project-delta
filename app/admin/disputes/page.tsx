'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useOrder } from '@/lib/contexts/order-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Order } from '@/lib/types';
import { CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDisputesPage() {
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useOrder();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userCache, setUserCache] = useState<Record<string, { id: string; username: string; avatar: string }>>({});

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.user) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        if (data.user.role !== 'SUPER_ADMIN') {
          setForbidden(true);
          setLoading(false);
          return;
        }
        setLoading(false);
      } catch {
        setForbidden(true);
        setLoading(false);
      }
    };
    run();
  }, []);

  // Load user info for orders
  useEffect(() => {
    const loadUsers = async () => {
      const userIds = new Set<string>();
      orders.forEach(order => {
        userIds.add(order.sellerId);
        userIds.add(order.buyerId);
      });

      const missingIds = Array.from(userIds).filter(id => !userCache[id]);
      
      await Promise.all(missingIds.map(async (id) => {
        try {
          const res = await fetch(`/api/users/by-id/${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUserCache(prev => ({ ...prev, [id]: { id: data.user.id, username: data.user.username, avatar: data.user.avatar } }));
            }
          }
        } catch {}
      }));
    };
    if (orders.length > 0) {
      loadUsers();
    }
  }, [orders]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-red-500">403 — Admins only</p>
        <Link className="text-primary underline" href="/">Go home</Link>
      </div>
    );
  }

  const disputeOrders = orders.filter(o => o.status === 'DISPUTE');
  const seller = selectedOrder ? userCache[selectedOrder.sellerId] : null;
  const buyer = selectedOrder ? userCache[selectedOrder.buyerId] : null;
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; senderId: string; receiverId: string; message: string; timestamp: string }>>([]);

  // Load chat messages for selected order
  useEffect(() => {
    if (!selectedOrder) {
      setChatMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        // Try to load messages between seller and buyer
        const res = await fetch(`/api/inbox/${selectedOrder.sellerId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Filter messages that involve both parties
          const relevantMessages = (data.messages || []).filter((msg: any) => 
            (msg.senderId === selectedOrder.sellerId && msg.receiverId === selectedOrder.buyerId) ||
            (msg.senderId === selectedOrder.buyerId && msg.receiverId === selectedOrder.sellerId)
          );
          setChatMessages(relevantMessages);
        } else {
          // Try the other direction
          const res2 = await fetch(`/api/inbox/${selectedOrder.buyerId}`, { credentials: 'include' });
          if (res2.ok) {
            const data2 = await res2.json();
            const relevantMessages = (data2.messages || []).filter((msg: any) => 
              (msg.senderId === selectedOrder.sellerId && msg.receiverId === selectedOrder.buyerId) ||
              (msg.senderId === selectedOrder.buyerId && msg.receiverId === selectedOrder.sellerId)
            );
            setChatMessages(relevantMessages);
          }
        }
      } catch {
        setChatMessages([]);
      }
    };

    loadMessages();
  }, [selectedOrder]);

  const handleResolve = (orderId: string, action: 'COMPLETE' | 'RETURN' | 'PENALIZE') => {
    if (action === 'COMPLETE') {
      updateOrderStatus(orderId, 'COMPLETED');
    } else if (action === 'RETURN') {
      updateOrderStatus(orderId, 'CANCELLED');
    } else if (action === 'PENALIZE') {
      // Penalize both parties
      updateOrderStatus(orderId, 'CANCELLED');
      // Reputation penalty would be handled in updateOrderStatus
    }
    setSelectedOrder(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dispute Resolution</h1>
          <p className="text-muted-foreground">Review and resolve order disputes</p>
        </div>
        <Link href="/admin" className="text-primary underline">Back to Admin</Link>
      </div>

      {disputeOrders.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No active disputes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispute List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xl font-bold mb-4">Active Disputes ({disputeOrders.length})</h2>
            {disputeOrders.map((order) => {
              const sellerUser = userCache[order.sellerId];
              const buyerUser = userCache[order.buyerId];
              const isSelected = selectedOrder?.id === order.id;
              
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-colors",
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {sellerUser?.username || 'Seller'} → {buyerUser?.username || 'Buyer'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.price.toLocaleString()} R$
                      </p>
                      {order.disputeReason && (
                        <p className="text-xs text-red-600 mt-1 truncate">
                          {order.disputeReason}
                        </p>
                      )}
                    </div>
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dispute Details */}
          {selectedOrder && (
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono text-sm">{selectedOrder.id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold">{selectedOrder.price.toLocaleString()} R$</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Seller</p>
                    {seller ? (
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
                        <p className="font-semibold">{seller.username}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Loading...</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Buyer</p>
                    {buyer ? (
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/20">
                          <Image
                            src={buyer.avatar}
                            alt={buyer.username}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <p className="font-semibold">{buyer.username}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Loading...</p>
                    )}
                  </div>
                </div>

                {/* Dispute Reason */}
                {selectedOrder.disputeReason && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                    <p className="text-sm font-semibold text-red-700 mb-1">Dispute Reason</p>
                    <p className="text-sm text-red-600">{selectedOrder.disputeReason}</p>
                  </div>
                )}

                {/* Proof Images */}
                {selectedOrder.proofImages.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Proof Images ({selectedOrder.proofImages.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.proofImages.map((proof, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-border bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Proof #{idx + 1}</p>
                          {proof.startsWith('http') || proof.startsWith('data:') ? (
                            <div className="relative w-full h-32 rounded overflow-hidden">
                              <Image
                                src={proof}
                                alt={`Proof ${idx + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <p className="text-xs break-all">{proof.substring(0, 100)}...</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                <div>
                  <p className="text-sm font-semibold mb-2">Chat Messages ({chatMessages.length})</p>
                  <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages available</p>
                    ) : (
                      chatMessages.map((msg) => {
                        const msgUser = userCache[msg.senderId];
                        return (
                          <div key={msg.id} className="p-2 rounded bg-background border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-semibold">{msgUser?.username || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedOrder.adminNotes && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
                    <p className="text-sm font-semibold text-blue-700 mb-1">Admin Notes</p>
                    <p className="text-sm text-blue-600">{selectedOrder.adminNotes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-semibold mb-3">Resolution Actions</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleResolve(selectedOrder.id, 'COMPLETE')}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Complete Order
                    </button>
                    <button
                      onClick={() => handleResolve(selectedOrder.id, 'RETURN')}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Return & Cancel
                    </button>
                    <button
                      onClick={() => handleResolve(selectedOrder.id, 'PENALIZE')}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Penalize Both
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

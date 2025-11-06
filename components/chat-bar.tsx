'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, MessageCircle, Send } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useChat } from '@/lib/contexts/chat-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useOrder } from '@/lib/contexts/order-context';
import React from 'react';
import { cn, getDisplayName } from '@/lib/utils';
import { Package, CheckCircle, Upload, AlertCircle } from 'lucide-react';

export function ChatBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { chats, closeChat, sendMessage, getChat, loadHistory } = useChat();
  const { getOrderByChat, updateOrderStatus, addProofImage, orders, getOrdersForUser, refreshOrders } = useOrder();
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>({});
  const messageEndRefs = useRef<Record<string, HTMLDivElement>>({});
  const prevChatsLength = useRef(0);

  // Auto-expand newly created chats and load history
  useEffect(() => {
    if (chats.length > prevChatsLength.current) {
      // A new chat was added
      const newChat = chats[chats.length - 1];
      if (newChat) {
        setExpandedChat(newChat.id);
        const other = newChat.participants.find(id => id !== user?.id);
        if (other) {
          // Load history for the newly opened chat
          loadHistory(other);
        }
      }
    }
    prevChatsLength.current = chats.length;
  }, [chats]);

  // When expanding a chat manually, ensure history is loaded if empty
  // Also refresh orders to ensure latest data is available
  useEffect(() => {
    if (!expandedChat || !user) return;
    const chat = chats.find(c => c.id === expandedChat);
    if (!chat) return;
    
    // Refresh orders when chat is expanded to ensure latest data
    refreshOrders();
    
    if ((chat.messages?.length || 0) === 0) {
      const other = chat.participants.find(id => id !== user.id);
      if (other) loadHistory(other);
    }
  }, [expandedChat, chats, user, refreshOrders, loadHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!user || chats.length === 0) return;
    
    Object.keys(messageEndRefs.current).forEach(chatId => {
      const ref = messageEndRefs.current[chatId];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [chats, user]);

  const handleSendMessage = (chatId: string, otherUserId: string) => {
    const message = messageInputs[chatId] || '';
    if (message.trim()) {
      sendMessage(otherUserId, message);
      setMessageInputs(prev => ({ ...prev, [chatId]: '' }));
    }
  };

  const [userCache, setUserCache] = useState<Record<string, { id: string; username: string; avatar: string; merchantName?: string | null }>>({});

  useEffect(() => {
    // Preload other users for open chats
    const load = async () => {
      if (!user || chats.length === 0) return;
      const otherIds = chats
        .map(c => c.participants.find(id => id !== user.id))
        .filter((v): v is string => !!v)
        .filter(id => !userCache[id]);
      await Promise.all(otherIds.map(async (id) => {
        try {
          const res = await fetch(`/api/users/by-id/${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUserCache(prev => ({ ...prev, [id]: { id: data.user.id, username: data.user.username, avatar: data.user.avatar, merchantName: data.user.merchantName } }));
            }
          }
        } catch {}
      }));
    };
    load();
  }, [chats, user]);

  // Auto-transition RESERVED orders to AWAITING_SELLER_CONFIRM when seller opens chat
  // Also refresh orders when chat is expanded to ensure latest data is loaded
  useEffect(() => {
    if (!user || !expandedChat) return;
    
    const chat = chats.find(c => c.id === expandedChat);
    if (!chat) return;
    
    const otherUserId = chat.participants.find(id => id !== user.id);
    if (!otherUserId) return;
    
    // Force a re-check of orders by accessing the orders array
    // Orders are loaded from API via polling
    const order = getOrderByChat(otherUserId, user.id);
    
    if (order && order.status === 'RESERVED' && order.sellerId === user.id) {
      // Auto-transition to AWAITING_SELLER_CONFIRM when seller first views the chat
      // Use a small delay to avoid race conditions
      const timer = setTimeout(async () => {
        try {
          await updateOrderStatus(order.id, 'AWAITING_SELLER_CONFIRM');
        } catch (error) {
          console.error('Failed to update order status:', error);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [expandedChat, user, chats, orders, getOrderByChat, updateOrderStatus]);

  // Early return after all hooks
  // Hide chat bar on inbox page
  if (pathname === '/inbox') return null;
  if (!user || chats.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-end gap-2 p-4 max-w-full overflow-x-auto">
      {chats.map((chat) => {
        const otherUserId = chat.participants.find(id => id !== user.id);
        if (!otherUserId) return null;

        const otherUser = userCache[otherUserId];
        if (!otherUser) return null;

        const isExpanded = expandedChat === chat.id;
        const messages = chat.messages || [];
        const inputValue = messageInputs[chat.id] || '';

        return (
          <div
            key={chat.id}
            className={cn(
              "bg-card border border-border rounded-t-xl shadow-2xl flex flex-col",
              "transition-all duration-300 flex-shrink-0",
              isExpanded ? "w-80 h-96 max-h-[80vh]" : "w-64 h-12"
            )}
          >
            {/* Chat Header */}
            <div
              className={cn(
                "flex items-center justify-between p-3 cursor-pointer",
                "hover:bg-accent transition-colors rounded-t-xl"
              )}
              onClick={async () => {
                const next = isExpanded ? null : chat.id;
                setExpandedChat(next);
                if (!isExpanded) {
                  const other = otherUserId;
                  if (messages.length === 0) {
                    await loadHistory(other);
                  }
                }
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                  <Image
                    src={otherUser.avatar}
                    alt={otherUser.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {isExpanded && (
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{getDisplayName(otherUser)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage || 'New chat'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedChat(isExpanded ? null : chat.id);
                  }}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeChat(otherUserId);
                  }}
                  className="p-1 hover:bg-destructive/20 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {isExpanded && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    // Deduplicate messages by ID and sort by timestamp
                    (() => {
                      const seen = new Set<string>();
                      const uniqueMessages = messages
                        .filter(msg => {
                          if (seen.has(msg.id)) {
                            return false;
                          }
                          seen.add(msg.id);
                          return true;
                        })
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                      return uniqueMessages.map((message) => {
                      const isOwnMessage = message.senderId === user.id;
                      const messageUser = message.senderId === user.id ? userCache[user.id] || { avatar: '', username: '' } : userCache[message.senderId];

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            isOwnMessage ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isOwnMessage && (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                              <Image
                                src={messageUser?.avatar || ''}
                                alt={messageUser?.username || ''}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border border-border"
                            )}
                          >
                            <p>{message.message}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    });
                    })()
                  )}
                  <div ref={(el) => {
                    if (el) messageEndRefs.current[chat.id] = el;
                  }} />
                </div>

                {/* Order Action Buttons */}
                {(() => {
                  if (!user) return null;
                  
                  // Get order for this chat - try both directions
                  const order = getOrderByChat(otherUserId, user.id);
                  
                  if (!order) {
                    // Debug: log when no order is found (uncomment for debugging)
                    // console.log('No order found for chat:', { 
                    //   otherUserId, 
                    //   currentUserId: user.id,
                    //   allOrders: getOrdersForUser(user.id),
                    //   allOrdersInContext: orders.length
                    // });
                    return null;
                  }

                  const isSeller = order.sellerId === user.id;
                  const isBuyer = order.buyerId === user.id;
                  
                  // Debug: log when order is found (uncomment for debugging)
                  // console.log('Order found for chat:', { 
                  //   orderId: order.id,
                  //   status: order.status,
                  //   sellerId: order.sellerId,
                  //   buyerId: order.buyerId,
                  //   currentUserId: user.id,
                  //   isSeller,
                  //   isBuyer
                  // });
                  
                  // Ensure we have a valid order and user is involved
                  if (!isSeller && !isBuyer) {
                    console.warn('Order found but user is not seller or buyer:', { order, userId: user.id });
                    return null;
                  }

                  // Show different buttons based on order status and user role
                  // Handle RESERVED status (should auto-transition to AWAITING_SELLER_CONFIRM when seller views)
                  if (order.status === 'RESERVED') {
                    if (isSeller) {
                      return (
                        <div className="p-3 border-t border-border bg-muted/30 space-y-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">
                              Order Reserved - Mark as Sent
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await updateOrderStatus(order.id, 'AWAITING_BUYER_CONFIRM');
                              } catch (error) {
                                console.error('Failed to update order:', error);
                                alert('Failed to update order. Please try again.');
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Mark as Sent
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 border-t border-border bg-muted/30">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">
                              Order Reserved - Waiting for seller to mark as sent...
                            </span>
                          </div>
                        </div>
                      );
                    }
                  }

                  if (order.status === 'AWAITING_SELLER_CONFIRM') {
                    if (isSeller) {
                      return (
                        <div className="p-3 border-t border-border bg-muted/30 space-y-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">
                              Mark as Sent
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await updateOrderStatus(order.id, 'AWAITING_BUYER_CONFIRM');
                              } catch (error) {
                                console.error('Failed to update order:', error);
                                alert('Failed to update order. Please try again.');
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Mark as Sent
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 border-t border-border bg-muted/30">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">
                              Waiting for seller to mark as sent...
                            </span>
                          </div>
                        </div>
                      );
                    }
                  }

                  if (order.status === 'AWAITING_BUYER_CONFIRM') {
                    if (isBuyer) {
                      return (
                        <div className="p-3 border-t border-border bg-muted/30 space-y-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              Confirm Received
                            </span>
                          </div>
                          {order.proofImages.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Proof images:</p>
                              <div className="flex flex-wrap gap-2">
                                {order.proofImages.map((proof, idx) => (
                                  <div key={idx} className="text-xs p-2 rounded bg-background border border-border">
                                    {proof.length > 50 ? `${proof.substring(0, 50)}...` : proof}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await updateOrderStatus(order.id, 'COMPLETED');
                              } catch (error) {
                                console.error('Failed to update order:', error);
                                alert('Failed to update order. Please try again.');
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirm Received
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 border-t border-border bg-muted/30">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              Waiting for buyer to confirm receipt...
                            </span>
                          </div>
                        </div>
                      );
                    }
                  }

                  if (order.status === 'DISPUTE') {
                    return (
                      <div className="p-3 border-t border-border bg-muted/30">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/20 border border-red-500/50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">
                            Order in Dispute - Admin review pending
                          </span>
                          {order.disputeReason && (
                            <p className="text-xs text-red-600 mt-1">{order.disputeReason}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (order.status === 'COMPLETED') {
                    return (
                      <div className="p-3 border-t border-border bg-muted/30">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">
                            Order Completed
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (order.status === 'CANCELLED') {
                    return (
                      <div className="p-3 border-t border-border bg-muted/30">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-500/20 border border-gray-500/50">
                          <AlertCircle className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-700">
                            Order Cancelled
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Message Input */}
                <div className="p-3 border-t border-border bg-background">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) =>
                        setMessageInputs(prev => ({ ...prev, [chat.id]: e.target.value }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage(chat.id, otherUserId);
                        }
                      }}
                      placeholder="Type a message..."
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg border border-border bg-background",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                        "text-sm"
                      )}
                    />
                    <button
                      onClick={() => handleSendMessage(chat.id, otherUserId)}
                      disabled={!inputValue.trim()}
                      className={cn(
                        "p-2 rounded-lg bg-primary text-primary-foreground",
                        "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors"
                      )}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}


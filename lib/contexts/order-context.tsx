'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Order, OrderStatus, User } from '../types';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  createOrder: (listingId: string, itemId: string, sellerId: string, buyerId: string, price: number) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, data?: { proofImages?: string[]; disputeReason?: string }) => Promise<void>;
  getOrderByChat: (userId1: string, userId2: string) => Order | undefined;
  getOrdersForUser: (userId: string) => Order[];
  getOrdersForListing: (listingId: string) => Order[];
  addProofImage: (orderId: string, imageUrl: string) => Promise<void>;
  updateReputation: (userId: string, change: number) => void;
  refreshOrders: () => Promise<void>; // Reload orders from API
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const EXPIRY_HOURS = 72;
const REMINDER_INTERVAL_HOURS = 24; // Send reminder every 24 hours

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load orders from API on mount
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        console.error('Failed to load orders:', res.statusText);
        setOrders([]);
      }
    } catch (e) {
      console.error('Failed to load orders from API', e);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Poll for order updates every 5 seconds (for real-time updates)
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadOrders();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [loadOrders]);

  const createOrder = useCallback(async (listingId: string, itemId: string, sellerId: string, buyerId: string, price: number): Promise<Order> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId, itemId, sellerId, buyerId, price }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to create order' }));
        throw new Error(error.error || 'Failed to create order');
      }

      const data = await res.json();
      const newOrder = data.order;

      // Update local state
      setOrders(prev => [...prev, newOrder]);

      console.log('Order created:', newOrder);
      return newOrder;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }, []);

  const updateReputation = useCallback((userId: string, change: number) => {
    // Update reputation in localStorage (since we're using React state only)
    try {
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        const users: User[] = JSON.parse(savedUsers);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          users[userIndex].reputation = (users[userIndex].reputation || 100) + change;
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
    } catch (e) {
      console.error('Failed to update reputation', e);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, data?: { proofImages?: string[]; disputeReason?: string }) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, ...data }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update order' }));
        throw new Error(error.error || 'Failed to update order');
      }

      const response = await res.json();
      const updatedOrder = response.order;

      // Update local state
      setOrders(prev => prev.map(order => order.id === orderId ? updatedOrder : order));

      // Update reputation on completion or cancellation
      if (status === 'COMPLETED') {
        // Both parties get +5 reputation
        setTimeout(() => {
          updateReputation(updatedOrder.sellerId, 5);
          updateReputation(updatedOrder.buyerId, 5);
        }, 0);
      } else if (status === 'CANCELLED') {
        // Both parties get -2 reputation
        setTimeout(() => {
          updateReputation(updatedOrder.sellerId, -2);
          updateReputation(updatedOrder.buyerId, -2);
        }, 0);
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }, [updateReputation]);

  // Auto-expire orders and send reminders
  // Note: This should ideally be handled server-side, but we check client-side as well
  useEffect(() => {
    const checkExpiry = async () => {
      const now = new Date();
      
      // Check each order for expiry
      for (const order of orders) {
        // Check if order should expire
        if (order.expiresAt && new Date(order.expiresAt) < now) {
          if (order.status === 'RESERVED' || order.status === 'AWAITING_SELLER_CONFIRM' || order.status === 'AWAITING_BUYER_CONFIRM') {
            // Auto-escalate to DISPUTE if expired - update via API
            if (order.status !== 'DISPUTE') {
              try {
                await updateOrderStatus(order.id, 'DISPUTE', {
                  disputeReason: order.disputeReason || 'Order expired after 72 hours',
                });
              } catch (error) {
                console.error('Failed to update expired order:', error);
              }
            }
          }
        }
      }
    };

    // Run check immediately, then set up interval
    const intervalId = setInterval(() => {
      checkExpiry();
    }, 60000); // Check every minute
    
    // Initial check after a short delay to ensure orders are loaded
    const initialTimeout = setTimeout(() => {
      checkExpiry();
    }, 2000);
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(initialTimeout);
    };
  }, [orders, updateOrderStatus]); // Depend on orders and updateOrderStatus

  const addProofImage = useCallback(async (orderId: string, imageUrl: string) => {
    try {
      // Find the order first
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update order with new proof image
      const updatedProofImages = [...order.proofImages, imageUrl];
      await updateOrderStatus(orderId, order.status, { proofImages: updatedProofImages });
    } catch (error) {
      console.error('Failed to add proof image:', error);
      throw error;
    }
  }, [orders, updateOrderStatus]);

  const getOrderByChat = useCallback((userId1: string, userId2: string): Order | undefined => {
    return orders.find(order => 
      (order.sellerId === userId1 && order.buyerId === userId2) ||
      (order.sellerId === userId2 && order.buyerId === userId1)
    );
  }, [orders]);

  const getOrdersForUser = useCallback((userId: string): Order[] => {
    return orders.filter(order => order.sellerId === userId || order.buyerId === userId);
  }, [orders]);

  const getOrdersForListing = useCallback((listingId: string): Order[] => {
    return orders.filter(order => order.listingId === listingId);
  }, [orders]);

  const refreshOrders = useCallback(async () => {
    // Reload orders from API to ensure latest data
    await loadOrders();
  }, [loadOrders]);

  return (
    <OrderContext.Provider value={{
      orders,
      isLoading,
      createOrder,
      updateOrderStatus,
      getOrderByChat,
      getOrdersForUser,
      getOrdersForListing,
      addProofImage,
      updateReputation,
      refreshOrders,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}

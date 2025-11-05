'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TradePost, Item, User } from '../types';

interface DataContextType {
  items: Item[];
  users: User[];
  tradePosts: TradePost[];
  addTradePost: (post: Omit<TradePost, 'id' | 'createdAt'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tradePosts, setTradePosts] = useState<TradePost[]>([]);

  // Load items from API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await fetch('/api/items');
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (e) {
        console.error('Failed to load items:', e);
      }
    };
    loadItems();
  }, []);

  // Load trade posts from API
  useEffect(() => {
    const loadTradePosts = async () => {
      try {
        const res = await fetch('/api/trade-posts');
        if (res.ok) {
          const data = await res.json();
          setTradePosts(data.posts || []);
        }
      } catch (e) {
        console.error('Failed to load trade posts:', e);
      }
    };
    loadTradePosts();
  }, []);

  const addTradePost = async (post: Omit<TradePost, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/trade-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(post),
      });
      if (res.ok) {
        const data = await res.json();
        setTradePosts(prev => [...prev, data.post]);
      }
    } catch (e) {
      console.error('Failed to add trade post:', e);
    }
  };

  return (
    <DataContext.Provider value={{ items, users, tradePosts, addTradePost }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}


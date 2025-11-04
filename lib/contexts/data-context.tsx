'use client';

import React, { createContext, useContext, useState } from 'react';
import { TradePost, Item, User, mockItems, mockUsers, mockTradePosts } from '../mock-data';

interface DataContextType {
  items: Item[];
  users: User[];
  tradePosts: TradePost[];
  addTradePost: (post: Omit<TradePost, 'id' | 'createdAt'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [items] = useState<Item[]>(mockItems);
  const [users] = useState<User[]>(mockUsers);
  const [tradePosts, setTradePosts] = useState<TradePost[]>(mockTradePosts);

  const addTradePost = (post: Omit<TradePost, 'id' | 'createdAt'>) => {
    const newPost: TradePost = {
      ...post,
      id: String(tradePosts.length + 1),
      createdAt: new Date().toISOString(),
    };
    setTradePosts(prev => [...prev, newPost]);
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


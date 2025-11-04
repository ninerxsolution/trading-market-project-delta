'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Chat, ChatMessage, User } from '../mock-data';
import { useAuth } from './auth-context';

interface ChatContextType {
  chats: Chat[];
  openChat: (userId: string) => void;
  closeChat: (userId: string) => void;
  sendMessage: (userId: string, message: string) => void;
  getChat: (userId: string) => Chat | undefined;
  isChatOpen: (userId: string) => boolean;
  loadHistory: (userId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  // Subscribe to realtime events (SSE)
  React.useEffect(() => {
    if (!user) return;
    const es = new EventSource('/api/inbox/stream');
    es.addEventListener('message', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        if (data?.type === 'message' && data.message) {
          const m = data.message as { senderId: string; receiverId: string; message: string; timestamp: string; id: string };
          const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
          setChats(prev => {
            const idx = prev.findIndex(c => c.participants.includes(user.id) && c.participants.includes(otherId));
            const newMsg: ChatMessage = { id: String(m.id), senderId: m.senderId, receiverId: m.receiverId, message: m.message, timestamp: new Date(m.timestamp).toISOString() };
            if (idx >= 0) {
              const arr = [...prev];
              const c = arr[idx];
              c.messages = [...c.messages, newMsg];
              c.lastMessage = newMsg.message;
              c.lastMessageTime = newMsg.timestamp;
              return arr;
            }
            const newChat: Chat = {
              id: `${user.id}-${otherId}`,
              participants: [user.id, otherId].sort() as [string, string],
              messages: [newMsg],
              lastMessage: newMsg.message,
              lastMessageTime: newMsg.timestamp,
            };
            return [...prev, newChat];
          });
        }
      } catch {}
    });
    return () => { es.close(); };
  }, [user]);

  const openChat = useCallback((userId: string) => {
    if (!user || user.id === userId) return;

    setChats(prev => {
      const existingChat = prev.find(
        chat => chat.participants.includes(user.id) && chat.participants.includes(userId)
      );

      if (existingChat) {
        return prev;
      }

      const newChat: Chat = {
        id: `${user.id}-${userId}`,
        participants: [user.id, userId].sort() as [string, string],
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
      };

      return [...prev, newChat];
    });

    // Load history from server
    (async () => {
      try {
        const res = await fetch(`/api/inbox/${userId}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const serverMessages: ChatMessage[] = (data.messages || []).map((m: any) => ({
          id: String(m.id),
          senderId: m.senderId,
          receiverId: m.receiverId,
          message: m.message,
          timestamp: new Date(m.timestamp).toISOString(),
        }));
        setChats(prev => {
          return prev.map(chat => {
            const otherUserId = chat.participants.find(id => id !== (user?.id || ''));
            if (otherUserId !== userId) return chat;
            if (serverMessages.length === 0) return chat;
            const last = serverMessages[serverMessages.length - 1];
            return {
              ...chat,
              messages: serverMessages,
              lastMessage: last.message,
              lastMessageTime: last.timestamp,
            };
          });
        });
      } catch {}
    })();
  }, [user]);

  const closeChat = useCallback((userId: string) => {
    if (!user) return;

    setChats(prev => {
      return prev.filter(chat => {
        const otherUserId = chat.participants.find(id => id !== user.id);
        return otherUserId !== userId;
      });
    });
  }, [user]);

  const sendMessage = useCallback(async (userId: string, message: string) => {
    if (!user || !message.trim()) return;

    // Persist to DB
    try {
      await fetch('/api/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toUserId: userId, message: message.trim() }),
      });
    } catch {}

    // Update local state
    setChats(prev => {
      return prev.map(chat => {
        const otherUserId = chat.participants.find(id => id !== user.id);
        if (otherUserId !== userId) return chat;

        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          receiverId: userId,
          message: message.trim(),
          timestamp: new Date().toISOString(),
        };

        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: newMessage.message,
          lastMessageTime: newMessage.timestamp,
        };
      });
    });
  }, [user]);

  const getChat = useCallback((userId: string): Chat | undefined => {
    if (!user) return undefined;

    return chats.find(
      chat => chat.participants.includes(user.id) && chat.participants.includes(userId)
    );
  }, [chats, user]);

  const isChatOpen = useCallback((userId: string): boolean => {
    return getChat(userId) !== undefined;
  }, [getChat]);

  const loadHistory = useCallback(async (otherUserId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/inbox/${otherUserId}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const serverMessages: ChatMessage[] = (data.messages || []).map((m: any) => ({
        id: String(m.id),
        senderId: m.senderId,
        receiverId: m.receiverId,
        message: m.message,
        timestamp: new Date(m.timestamp).toISOString(),
      }));
      setChats(prev => prev.map(c => {
        const other = c.participants.find(id => id !== user.id);
        if (other !== otherUserId) return c;
        if (serverMessages.length === 0) return c;
        const last = serverMessages[serverMessages.length - 1];
        return { ...c, messages: serverMessages, lastMessage: last.message, lastMessageTime: last.timestamp };
      }));
    } catch {}
  }, [user]);

  return (
    <ChatContext.Provider value={{ chats, openChat, closeChat, sendMessage, getChat, isChatOpen, loadHistory }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}


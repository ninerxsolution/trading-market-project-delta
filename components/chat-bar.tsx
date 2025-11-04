'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, MessageCircle, Send } from 'lucide-react';
import Image from 'next/image';
import { useChat } from '@/lib/contexts/chat-context';
import { useAuth } from '@/lib/contexts/auth-context';
import React from 'react';
import { cn } from '@/lib/utils';

export function ChatBar() {
  const { user } = useAuth();
  const { chats, closeChat, sendMessage, getChat, loadHistory } = useChat();
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
  useEffect(() => {
    if (!expandedChat || !user) return;
    const chat = chats.find(c => c.id === expandedChat);
    if (!chat) return;
    if ((chat.messages?.length || 0) === 0) {
      const other = chat.participants.find(id => id !== user.id);
      if (other) loadHistory(other);
    }
  }, [expandedChat, chats, user]);

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

  const [userCache, setUserCache] = useState<Record<string, { id: string; username: string; avatar: string }>>({});

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
              setUserCache(prev => ({ ...prev, [id]: { id: data.user.id, username: data.user.username, avatar: data.user.avatar } }));
            }
          }
        } catch {}
      }));
    };
    load();
  }, [chats, user]);

  // Early return after all hooks
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
                    <p className="font-semibold text-sm truncate">{otherUser.username}</p>
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
                    messages.map((message) => {
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
                    })
                  )}
                  <div ref={(el) => {
                    if (el) messageEndRefs.current[chat.id] = el;
                  }} />
                </div>

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


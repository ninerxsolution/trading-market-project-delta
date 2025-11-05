// Type definitions for the trading marketplace
// These types are used across the application

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  joinDate: string;
  bio: string;
  tradePosts?: string[];
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  reputation?: number;
}

export interface Item {
  id: string;
  name: string;
  image: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  averagePrice: number;
  avgSellerPrice?: number;
  npcBuyPrice?: number | null;
  npcSellPrice?: number | null;
  availability?: 'BUYABLE' | 'TRADE_ONLY' | 'NOT_AVAILABLE';
  sellers?: string[];
}

export interface TradePost {
  id: string;
  userId: string;
  itemHave: string;
  itemWant: string;
  description: string;
  image?: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  participants: [string, string];
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageTime: string;
}

export type OrderStatus = 
  | 'RESERVED'
  | 'AWAITING_SELLER_CONFIRM'
  | 'AWAITING_BUYER_CONFIRM'
  | 'COMPLETED'
  | 'DISPUTE'
  | 'CANCELLED';

export interface Order {
  id: string;
  listingId: string;
  itemId: string;
  sellerId: string;
  buyerId: string;
  price: number;
  status: OrderStatus;
  proofImages: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  lastReminderAt?: string;
  disputeReason?: string;
  adminNotes?: string;
}


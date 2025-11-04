// Mock data for the Roblox trading marketplace

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  joinDate: string;
  bio: string;
  tradePosts: string[]; // Array of trade post IDs
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface Item {
  id: string;
  name: string;
  image: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  averagePrice: number;
  sellers: string[]; // Array of user IDs selling this item
}

export interface TradePost {
  id: string;
  userId: string;
  itemHave: string; // Item ID
  itemWant: string; // Item ID
  description: string;
  image?: string;
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
  participants: [string, string]; // Two user IDs
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageTime: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'BuilderMax',
    email: 'buildermax@roblox.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BuilderMax',
    joinDate: '2023-01-15',
    bio: 'Professional builder and trader. Always looking for rare items!',
    tradePosts: ['1', '2'],
  },
  {
    id: '2',
    username: 'NoobMaster99',
    email: 'noobmaster@roblox.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NoobMaster99',
    joinDate: '2024-03-20',
    bio: 'New to trading but eager to learn!',
    tradePosts: ['3'],
  },
  {
    id: '3',
    username: 'PixelCrafter',
    email: 'pixelcrafter@roblox.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelCrafter',
    joinDate: '2022-11-10',
    bio: 'Crafting pixel-perfect items since day one.',
    tradePosts: ['4'],
  },
  {
    id: '4',
    username: 'AgentFox',
    email: 'agentfox@roblox.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AgentFox',
    joinDate: '2023-06-05',
    bio: 'Stealthy trader with the best deals!',
    tradePosts: ['5'],
  },
];

// Mock Items
export const mockItems: Item[] = [
  {
    id: '1',
    name: 'Iron Scrap',
    image: 'https://via.placeholder.com/200x200/4A5568/FFFFFF?text=Iron+Scrap',
    description: 'A common material used in crafting basic items. Essential for beginners.',
    rarity: 'Common',
    averagePrice: 50,
    sellers: ['2', '4'],
  },
  {
    id: '2',
    name: 'Battery Pack',
    image: 'https://via.placeholder.com/200x200/3182CE/FFFFFF?text=Battery+Pack',
    description: 'Rechargeable energy source for electronic devices. Very useful!',
    rarity: 'Uncommon',
    averagePrice: 150,
    sellers: ['1', '3'],
  },
  {
    id: '3',
    name: 'Plasma Core',
    image: 'https://via.placeholder.com/200x200/7C3AED/FFFFFF?text=Plasma+Core',
    description: 'A powerful energy core that glows with intense plasma. Rare find!',
    rarity: 'Rare',
    averagePrice: 500,
    sellers: ['1', '2'],
  },
  {
    id: '4',
    name: 'Carbon Fiber Plate',
    image: 'https://via.placeholder.com/200x200/059669/FFFFFF?text=Carbon+Fiber',
    description: 'Ultra-lightweight and strong material. Perfect for advanced crafting.',
    rarity: 'Epic',
    averagePrice: 1200,
    sellers: ['3'],
  },
  {
    id: '5',
    name: 'Nano Chip',
    image: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=Nano+Chip',
    description: 'The most advanced microchip ever created. Extremely rare and valuable!',
    rarity: 'Legendary',
    averagePrice: 3500,
    sellers: ['4'],
  },
  {
    id: '6',
    name: 'Crystal Shard',
    image: 'https://via.placeholder.com/200x200/EC4899/FFFFFF?text=Crystal+Shard',
    description: 'A beautiful shard that sparkles in the light. Uncommon but pretty!',
    rarity: 'Uncommon',
    averagePrice: 180,
    sellers: ['1', '2', '3'],
  },
  {
    id: '7',
    name: 'Quantum Core',
    image: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Quantum+Core',
    description: 'Advanced technology that defies physics. Epic rarity!',
    rarity: 'Epic',
    averagePrice: 1500,
    sellers: ['2', '4'],
  },
  {
    id: '8',
    name: 'Steel Ingot',
    image: 'https://via.placeholder.com/200x200/6B7280/FFFFFF?text=Steel+Ingot',
    description: 'Refined steel ready for crafting. Common material.',
    rarity: 'Common',
    averagePrice: 75,
    sellers: ['1', '3', '4'],
  },
];

// Mock Trade Posts
export const mockTradePosts: TradePost[] = [
  {
    id: '1',
    userId: '1',
    itemHave: '2',
    itemWant: '3',
    description: 'Looking to trade my Battery Pack for a Plasma Core. Hit me up!',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    userId: '1',
    itemHave: '6',
    itemWant: '4',
    description: 'Trading Crystal Shard for Carbon Fiber Plate. Fair trade!',
    createdAt: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    userId: '2',
    itemHave: '1',
    itemWant: '2',
    description: 'New trader here! Want to trade Iron Scrap for Battery Pack.',
    createdAt: '2024-01-16T09:15:00Z',
  },
  {
    id: '4',
    userId: '3',
    itemHave: '4',
    itemWant: '5',
    description: 'Carbon Fiber Plate for Nano Chip. Serious offers only.',
    createdAt: '2024-01-13T16:45:00Z',
  },
  {
    id: '5',
    userId: '4',
    itemHave: '5',
    itemWant: '7',
    description: 'Nano Chip available! Looking for Quantum Core or best offer.',
    createdAt: '2024-01-17T11:00:00Z',
  },
];

// Helper functions
export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return mockUsers.find(user => user.username === username);
}

export function getItemById(id: string): Item | undefined {
  return mockItems.find(item => item.id === id);
}

export function getTradePostsByUserId(userId: string): TradePost[] {
  return mockTradePosts.filter(post => post.userId === userId);
}

export function getTradePostsByItemId(itemId: string): TradePost[] {
  return mockTradePosts.filter(post => post.itemHave === itemId || post.itemWant === itemId);
}

export function getSellersForItem(itemId: string): User[] {
  const item = getItemById(itemId);
  if (!item) return [];
  return item.sellers.map(sellerId => getUserById(sellerId)!).filter(Boolean);
}


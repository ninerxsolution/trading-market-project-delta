'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ItemCard } from '@/components/item-card';
import { ItemDetailModal } from '@/components/item-detail-modal';
import { cn, getDisplayName } from '@/lib/utils';

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/items');
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {}
    };
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item: any) =>
      (item.name || '').toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {user ? `Welcome, ${getDisplayName(user)}!` : 'Welcome to Roblox Trade Marketplace'}
        </h1>
        <p className="text-muted-foreground">
          Browse and trade your favorite Roblox items
        </p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search items by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all"
          )}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No items found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredItems.map((item: any) => (
            <ItemCard
              key={item.id}
              item={{
                id: item.id,
                name: item.name,
                image: item.image,
                description: item.description,
                rarity: item.rarity,
                averagePrice: item.avgSellerPrice ?? item.averagePrice,
              }}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}

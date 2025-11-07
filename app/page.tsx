'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ItemCard } from '@/components/item-card';
import { ItemDetailModal } from '@/components/item-detail-modal';
import { cn, getDisplayName } from '@/lib/utils';

type ItemType = 'WEAPON' | 'MEDICINE' | 'ATTACHMENT' | 'OTHER' | null;

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType>(null);
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
    let filtered = items;

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter((item: any) => item.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) =>
        (item.name || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, searchQuery, selectedType]);

  const itemTypes: { value: ItemType; label: string }[] = [
    { value: 'WEAPON', label: 'Weapon' },
    { value: 'MEDICINE', label: 'Medicine' },
    { value: 'ATTACHMENT', label: 'Attachment' },
    { value: 'OTHER', label: 'Other' },
  ];

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

      <div className="mb-8 space-y-4">
        <div className="relative">
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
          <button
            onClick={() => setSelectedType(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "border-2",
              selectedType === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:border-primary/50"
            )}
          >
            All
          </button>
          {itemTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                "border-2",
                selectedType === type.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              )}
            >
              {type.label}
            </button>
          ))}
          {selectedType && (
            <button
              onClick={() => setSelectedType(null)}
              className="ml-auto px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear filter
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {searchQuery || selectedType
              ? `No items found${searchQuery ? ` matching "${searchQuery}"` : ''}${selectedType ? ` with type "${itemTypes.find(t => t.value === selectedType)?.label}"` : ''}`
              : 'No items available'}
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

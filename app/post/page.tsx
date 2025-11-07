'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ItemType = 'WEAPON' | 'MEDICINE' | 'ATTACHMENT' | 'OTHER' | null;

export default function PostTradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; name: string; rarity: string; type: string; image: string }[]>([]);
  const [itemQuery, setItemQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType>(null);
  const [itemId, setItemId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [description, setDescription] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await fetch('/api/items');
        if (res.ok) {
          const data = await res.json();
          setItems(
            (data.items || []).map((it: { id: string; name: string; rarity: string; type?: string; image: string }) => ({ id: it.id, name: it.name, rarity: it.rarity, type: it.type || 'OTHER', image: it.image }))
          );
        }
      } catch {}
    };
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter((it) => it.type === selectedType);
    }

    // Filter by search query
    if (itemQuery.trim()) {
      const q = itemQuery.trim().toLowerCase();
      filtered = filtered.filter((it) => it.name.toLowerCase().includes(q));
    }

    return filtered;
  }, [items, itemQuery, selectedType]);

  const itemTypes: { value: ItemType; label: string }[] = [
    { value: 'WEAPON', label: 'Weapon' },
    { value: 'MEDICINE', label: 'Medicine' },
    { value: 'ATTACHMENT', label: 'Attachment' },
    { value: 'OTHER', label: 'Other' },
  ];

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemId || !price || Number(price) <= 0 || !stock || Number(stock) < 1) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    // Build tags array (only Modified tag for WEAPON type)
    const tags: string[] = [];
    const selectedItem = items.find(it => it.id === itemId);
    if (selectedItem?.type === 'WEAPON' && isModified) {
      tags.push('Modified');
    }

    try {
      const res = await fetch('/api/sale-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          itemId, 
          price: Number(price), 
          description: description.trim() || '', 
          stock: Number(stock),
          tags 
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to post trade');
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      alert('Trade posted successfully!');
      router.push('/');
    } catch {
      setIsSubmitting(false);
      alert('Failed to post trade');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Post an Item for Sale</h1>
        <p className="text-muted-foreground">Choose an item and set your price</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Item *</label>
          <input
            type="text"
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
            placeholder="Search items..."
            className={cn(
              "w-full px-4 py-2 mb-3 rounded-lg border border-border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            )}
          />
          
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
            <button
              type="button"
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
                type="button"
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
                type="button"
                onClick={() => setSelectedType(null)}
                className="ml-auto px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-72 overflow-y-auto border border-border rounded-xl p-3 bg-muted/20">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {itemQuery || selectedType
                  ? `No items found${itemQuery ? ` matching "${itemQuery}"` : ''}${selectedType ? ` with type "${itemTypes.find(t => t.value === selectedType)?.label}"` : ''}`
                  : 'No items available'}
              </div>
            ) : (
              filteredItems.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  onClick={() => {
                    setItemId(it.id);
                    // Reset modified tag when changing item (if new item is not WEAPON)
                    if (it.type !== 'WEAPON') {
                      setIsModified(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border transition-colors text-left",
                    itemId === it.id ? "border-primary bg-primary/10" : "border-border hover:bg-background"
                  )}
                >
                  <div className="relative w-12 min-w-12 h-12 min-h-12 rounded bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image} alt={it.name} className="object-cover w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.rarity}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          {itemId && (() => {
            const selectedItem = items.find(i => i.id === itemId);
            if (!selectedItem) return null;
            return (
              <div className="mt-4 p-4 border border-border rounded-xl bg-muted/30">
                <p className="text-sm font-semibold mb-3 text-muted-foreground">Selected Item Preview</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.name} 
                      className="object-cover w-full h-full" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1">{selectedItem.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                        {selectedItem.rarity}
                      </span>
                      <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                        {selectedItem.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {itemId && items.find(i => i.id === itemId)?.type === 'WEAPON' && (
          <div>
            <label className="block text-sm font-semibold mb-2">Tags</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModified(!isModified)}
                className={cn(
                  "px-4 py-2 rounded-lg border transition-colors",
                  isModified 
                    ? "bg-primary text-white border-primary" 
                    : "bg-background border-border hover:bg-muted"
                )}
              >
                Modified
              </button>
              {isModified && (
                <span className="text-sm text-muted-foreground">This weapon is modified</span>
              )}
            </div>
          </div>
        )}


        <div>
          <label htmlFor="price" className="block text-sm font-semibold mb-2">
            Price *
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all"
            )}
            required
            min={1}
          />
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-semibold mb-2">
            Stock *
          </label>
          <input
            type="number"
            id="stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all"
            )}
            required
            min={1}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe your trade offer..."
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all resize-none"
            )}
          />
        </div>

        {/* Image is taken from the Item defined by Super Admin */}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full px-6 py-3 rounded-xl font-semibold text-white",
            "bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all"
          )}
        >
          {isSubmitting ? 'Posting...' : 'Post Trade'}
        </button>
      </form>
    </div>
  );
}


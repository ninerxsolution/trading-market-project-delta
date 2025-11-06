'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PostTradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; name: string; rarity: string; image: string }[]>([]);
  const [itemQuery, setItemQuery] = useState('');
  const [itemId, setItemId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [description, setDescription] = useState('');
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
            (data.items || []).map((it: any) => ({ id: it.id, name: it.name, rarity: it.rarity, image: it.image }))
          );
        }
      } catch {}
    };
    loadItems();
  }, []);

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemId || !price || Number(price) <= 0 || !description.trim() || !stock || Number(stock) < 1) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sale-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId, price: Number(price), description, stock: Number(stock) }),
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
    } catch (e) {
      setIsSubmitting(false);
      alert('Failed to post trade');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto border border-border rounded-xl p-3 bg-muted/20">
            {items
              .filter(it => {
                const q = itemQuery.trim().toLowerCase();
                if (!q) return true;
                return it.name.toLowerCase().includes(q);
              })
              .map((it) => (
                <button
                  type="button"
                  key={it.id}
                  onClick={() => setItemId(it.id)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border transition-colors text-left",
                    itemId === it.id ? "border-primary bg-primary/10" : "border-border hover:bg-background"
                  )}
                >
                  <div className="relative w-12 h-12 rounded bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image} alt={it.name} className="object-cover w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.rarity}</p>
                  </div>
                </button>
              ))}
          </div>
          {itemId && (
            <p className="mt-2 text-xs text-muted-foreground">Selected: {items.find(i=>i.id===itemId)?.name}</p>
          )}
        </div>

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
            Description *
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
            required
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


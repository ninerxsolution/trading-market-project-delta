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
  const [items, setItems] = useState<{ id: string; name: string; rarity: string }[]>([]);
  const [itemId, setItemId] = useState('');
  const [price, setPrice] = useState('');
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
            (data.items || []).map((it: any) => ({ id: it.id, name: it.name, rarity: it.rarity }))
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
    
    if (!itemId || !price || Number(price) <= 0 || !description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sale-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId, price: Number(price), description }),
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
          <label htmlFor="itemId" className="block text-sm font-semibold mb-2">
            Item *
          </label>
          <select
            id="itemId"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all"
            )}
            required
          >
            <option value="">Select an item...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.rarity})
              </option>
            ))}
          </select>
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


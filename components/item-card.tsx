'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type BasicItem = {
  id: string;
  name: string;
  image: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | string;
  averagePrice?: number;
  sellersCount?: number;
};

interface ItemCardProps {
  item: BasicItem;
  onClick: () => void;
}

const rarityColors = {
  Common: 'bg-gray-500',
  Uncommon: 'bg-blue-500',
  Rare: 'bg-purple-500',
  Epic: 'bg-pink-500',
  Legendary: 'bg-yellow-500',
};

export function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card border-2 border-border flex flex-col justify-start",
        "hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105",
        "cursor-pointer text-left"
      )}
    >
      <div className="relative min-h-54 min-w-54 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-contain object-center w-full h-full"
          unoptimized
        />
        <div className={cn(
          "absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold text-white",
          rarityColors[item.rarity]
        )}>
          {item.rarity}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          {typeof item.averagePrice === 'number' ? (
            <span className="text-lg font-bold text-primary">
              {item.averagePrice.toLocaleString()} R$
            </span>
          ) : <span />}
          {typeof item.sellersCount === 'number' ? (
            <span className="text-xs text-muted-foreground">
              {item.sellersCount} {item.sellersCount === 1 ? 'seller' : 'sellers'}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}


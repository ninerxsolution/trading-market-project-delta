'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Minus, Package } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Listing = {
	id: string;
	price: number;
	description: string;
	image: string;
	createdAt: string;
	stock?: number;
	status?: string;
	item: {
		id: string;
		name: string;
		image: string;
		rarity: string;
	};
};

interface EditListingModalProps {
	listing: Listing | null;
	onClose: () => void;
	onSave: (listingId: string, updates: { price?: number; stock?: number }) => Promise<void>;
}

export function EditListingModal({ listing, onClose, onSave }: EditListingModalProps) {
	const [price, setPrice] = useState<string>('');
	const [stock, setStock] = useState<string>('');
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (listing) {
			setPrice(String(listing.price));
			setStock(String(listing.stock ?? 0));
			setError(null);
		}
	}, [listing]);

	if (!listing) return null;

	const handleSaveStock = async () => {
		if (isSaving) return;
		const newStock = Number(stock);
		if (!Number.isFinite(newStock) || newStock < 0) {
			setError('Please enter a valid stock amount (0 or greater)');
			return;
		}
		setIsSaving(true);
		setError(null);
		try {
			await onSave(listing.id, { stock: Math.floor(newStock) });
		} catch (err) {
			setError('Failed to update stock. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleQuickStockChange = (delta: number) => {
		const currentStock = Number(stock) || 0;
		const newStock = Math.max(0, currentStock + delta);
		setStock(String(newStock));
		setError(null);
	};

	const handleSavePrice = async () => {
		if (isSaving) return;
		const newPrice = Number(price);
		if (!Number.isFinite(newPrice) || newPrice <= 0) {
			setError('Please enter a valid price greater than 0');
			return;
		}
		setIsSaving(true);
		setError(null);
		try {
			await onSave(listing.id, { price: Math.floor(newPrice) });
		} catch (err) {
			setError('Failed to update price. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="relative w-full max-w-md mx-4 bg-card rounded-2xl border border-border shadow-2xl">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
				>
					<X className="h-5 w-5" />
				</button>

				<div className="p-6">
					<h2 className="text-2xl font-bold mb-4">Edit Listing</h2>

					{/* Item Info */}
					<div className="flex gap-4 mb-6 p-4 rounded-xl bg-muted">
						<div className="relative w-20 h-20 rounded overflow-hidden bg-background flex-shrink-0">
							<Image
								src={listing.image}
								alt={listing.item.name}
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold truncate">{listing.item.name}</p>
							<p className="text-xs text-muted-foreground truncate mb-2">{listing.description}</p>
							<p className="text-sm font-bold">Current: {listing.price.toLocaleString()} R$</p>
							{typeof listing.stock === 'number' && (
								<p className="text-xs text-muted-foreground">Stock: {listing.stock}</p>
							)}
						</div>
					</div>

					{error && (
						<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
							{error}
						</div>
					)}

					{/* Price Section */}
					<div className="mb-6">
						<label className="block text-sm font-semibold mb-2">Price (R$)</label>
						<div className="flex gap-2">
							<div className="relative flex-1">
								<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<input
									type="number"
									value={price}
									onChange={(e) => setPrice(e.target.value)}
									placeholder="Enter new price"
									min="1"
									step="1"
									className={cn(
										"w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background",
										"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
										"transition-all"
									)}
								/>
							</div>
							<button
								onClick={handleSavePrice}
								disabled={isSaving || !price || Number(price) === listing.price}
								className={cn(
									"px-6 py-3 rounded-lg font-semibold",
									"bg-primary text-primary-foreground hover:bg-primary/90",
									"disabled:opacity-50 disabled:cursor-not-allowed",
									"transition-colors"
								)}
							>
								Save Price
							</button>
						</div>
					</div>

					{/* Stock Section */}
					<div className="mb-6">
						<label className="block text-sm font-semibold mb-2">Stock</label>
						<div className="flex gap-2 mb-3">
							<div className="relative flex-1">
								<Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<input
									type="number"
									value={stock}
									onChange={(e) => setStock(e.target.value)}
									placeholder="Enter stock amount"
									min="0"
									step="1"
									className={cn(
										"w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background",
										"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
										"transition-all"
									)}
								/>
							</div>
							<button
								onClick={handleSaveStock}
								disabled={isSaving || stock === String(listing.stock ?? 0) || !stock}
								className={cn(
									"px-6 py-3 rounded-lg font-semibold",
									"bg-secondary text-secondary-foreground hover:bg-secondary/80",
									"disabled:opacity-50 disabled:cursor-not-allowed",
									"transition-colors"
								)}
							>
								Save
							</button>
						</div>
						
						{/* Quick Adjust Buttons */}
						<div className="flex gap-2">
							<button
								onClick={() => handleQuickStockChange(-1)}
								disabled={isSaving || (Number(stock) || 0) <= 0}
								className={cn(
									"flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold",
									"bg-muted hover:bg-muted/80",
									"disabled:opacity-50 disabled:cursor-not-allowed",
									"transition-colors"
								)}
							>
								<Minus className="h-4 w-4" />
								-1
							</button>
							<button
								onClick={() => handleQuickStockChange(1)}
								disabled={isSaving}
								className={cn(
									"flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold",
									"bg-muted hover:bg-muted/80",
									"disabled:opacity-50 disabled:cursor-not-allowed",
									"transition-colors"
								)}
							>
								<Plus className="h-4 w-4" />
								+1
							</button>
						</div>
						{typeof listing.stock === 'number' && (
							<p className="text-xs text-muted-foreground mt-2 text-center">
								Current stock: {listing.stock}
							</p>
						)}
					</div>

					{/* Close Button */}
					<button
						onClick={onClose}
						className={cn(
							"w-full px-4 py-3 rounded-lg font-semibold",
							"bg-muted hover:bg-muted/80",
							"transition-colors"
						)}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}


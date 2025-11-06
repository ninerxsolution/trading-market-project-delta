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
	tags?: string[];
	item: {
		id: string;
		name: string;
		image: string;
		rarity: string;
		type?: string;
	};
};

interface EditListingModalProps {
	listing: Listing | null;
	onClose: () => void;
	onSave: (listingId: string, updates: { price?: number; stock?: number; description?: string; tags?: string[] }) => Promise<void>;
}

export function EditListingModal({ listing, onClose, onSave }: EditListingModalProps) {
	const [price, setPrice] = useState<string>('');
	const [stock, setStock] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [isModified, setIsModified] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (listing) {
			setPrice(String(listing.price));
			setStock(String(listing.stock ?? 0));
			setDescription(listing.description || '');
			setIsModified(listing.tags?.includes('Modified') || false);
			setError(null);
		}
	}, [listing]);

	if (!listing) return null;

	const handleQuickStockChange = (delta: number) => {
		const currentStock = Number(stock) || 0;
		const newStock = Math.max(0, currentStock + delta);
		setStock(String(newStock));
		setError(null);
	};

	// Check if any field has changed
	const hasChanges = () => {
		const newPrice = Number(price);
		const newStock = Number(stock);
		const newDescription = description.trim();
		const currentDescription = listing.description || '';
		
		// Check price change
		if (Number.isFinite(newPrice) && newPrice !== listing.price) {
			return true;
		}
		
		// Check stock change
		if (Number.isFinite(newStock) && newStock !== (listing.stock ?? 0)) {
			return true;
		}
		
		// Check description change
		if (newDescription !== currentDescription) {
			return true;
		}
		
		// Check tags change (only for WEAPON)
		if (listing.item.type === 'WEAPON') {
			const currentHasModified = listing.tags?.includes('Modified') || false;
			if (isModified !== currentHasModified) {
				return true;
			}
		}
		
		return false;
	};

	const handleSaveAll = async () => {
		if (isSaving || !hasChanges()) return;
		
		const newPrice = Number(price);
		const newStock = Number(stock);
		
		// Validate price
		if (Number.isFinite(newPrice) && newPrice !== listing.price) {
			if (newPrice <= 0) {
				setError('Please enter a valid price greater than 0');
				return;
			}
		}
		
		// Validate stock
		if (Number.isFinite(newStock) && newStock !== (listing.stock ?? 0)) {
			if (newStock < 0) {
				setError('Please enter a valid stock amount (0 or greater)');
				return;
			}
		}
		
		setIsSaving(true);
		setError(null);
		
		try {
			const updates: { price?: number; stock?: number; description?: string; tags?: string[] } = {};
			
			// Add price if changed
			if (Number.isFinite(newPrice) && newPrice !== listing.price) {
				updates.price = Math.floor(newPrice);
			}
			
			// Add stock if changed
			if (Number.isFinite(newStock) && newStock !== (listing.stock ?? 0)) {
				updates.stock = Math.floor(newStock);
			}
			
			// Add description if changed
			const newDescription = description.trim();
			const currentDescription = listing.description || '';
			if (newDescription !== currentDescription) {
				updates.description = newDescription;
			}
			
			// Add tags if changed (only for WEAPON)
			if (listing.item.type === 'WEAPON') {
				const currentHasModified = listing.tags?.includes('Modified') || false;
				if (isModified !== currentHasModified) {
					const tags: string[] = [];
					if (isModified) {
						tags.push('Modified');
					}
					updates.tags = tags;
				}
			}
			
			await onSave(listing.id, updates);
		} catch (err) {
			setError('Failed to save changes. Please try again.');
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
						<div className="relative">
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
					</div>

					{/* Description Section */}
					<div className="mb-6">
						<label className="block text-sm font-semibold mb-2">Description</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Enter description..."
							className={cn(
								"w-full px-4 py-3 rounded-lg border border-border bg-background",
								"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
								"transition-all resize-none"
							)}
						/>
						{listing.item.type === 'WEAPON' && (
							<div className="mt-3">
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
					</div>

					{/* Stock Section */}
					<div className="mb-6">
						<label className="block text-sm font-semibold mb-2">Stock</label>
						<div className="relative mb-3">
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
						
						{/* Quick Adjust Buttons */}
						<div className="flex gap-2">
							<button
								type="button"
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
								type="button"
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
					</div>

					{/* Save Button */}
					<button
						onClick={handleSaveAll}
						disabled={isSaving || !hasChanges()}
						className={cn(
							"w-full px-4 py-3 rounded-lg font-semibold mb-3",
							"bg-primary text-primary-foreground hover:bg-primary/90",
							"disabled:opacity-50 disabled:cursor-not-allowed",
							"transition-colors"
						)}
					>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</button>

					{/* Close Button */}
					<button
						type="button"
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


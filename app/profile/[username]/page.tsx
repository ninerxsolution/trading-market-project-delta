'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, Calendar, Package, DollarSign, Edit, ArrowLeft, Settings, AlertTriangle } from 'lucide-react';
import { useData } from '@/lib/contexts/data-context';
import { useChat } from '@/lib/contexts/chat-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { User, TradePost, Item } from '@/lib/types';
import { cn, getDisplayName } from '@/lib/utils';
import Link from 'next/link';
import { EditListingModal } from '@/components/edit-listing-modal';
import { ReportUserModal } from '@/components/report-user-modal';

export default function ProfilePage() {
	const params = useParams();
	const username = params.username as string;
	const { openChat } = useChat();
	const { user: currentUser } = useAuth();
	const [profileUser, setProfileUser] = useState<User | null>(null);
	const [userTradePosts, setUserTradePosts] = useState<TradePost[]>([]);
	const [loading, setLoading] = useState(true);
	const [sales, setSales] = useState<{ listings: Array<{ id: string; price: number; description: string; image: string; createdAt: string; stock?: number; status?: string; tags?: string[]; item: { id: string; name: string; image: string; rarity: string; type?: string } }>; summary: { count: number; total: number } } | null>(null);
	const [editingListing, setEditingListing] = useState<{ id: string; price: number; description: string; image: string; createdAt: string; stock?: number; status?: string; tags?: string[]; item: { id: string; name: string; image: string; rarity: string; type?: string } } | null>(null);
	const [showReportModal, setShowReportModal] = useState(false);

	useEffect(() => {
		let isCancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				// Try DB first
				const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
				if (res.ok) {
					const data = await res.json();
					if (!isCancelled && data.user) {
						setProfileUser(data.user);
						setUserTradePosts([]);
						try {
							const sres = await fetch(`/api/users/${encodeURIComponent(username)}/listings`);
							if (sres.ok) {
								const sdata = await sres.json();
								setSales(sdata);
							}
						} catch {}
						setLoading(false);
						return;
					}
				}
			} catch {}

			// If DB fetch failed, user not found
			if (!isCancelled) {
				setProfileUser(null);
				setUserTradePosts([]);
				setLoading(false);
			}
		};
		load();
		return () => { isCancelled = true; };
	}, [username]);

	// Load sales/listings when profileUser known
	useEffect(() => {
		const loadSales = async () => {
			if (!profileUser) return;
			try {
				const sres = await fetch(`/api/users/${encodeURIComponent(profileUser.username)}/listings`);
				if (sres.ok) {
					const sdata = await sres.json();
					setSales(sdata);
				} else {
					setSales({ listings: [], summary: { count: 0, total: 0 } });
				}
			} catch {
				setSales({ listings: [], summary: { count: 0, total: 0 } });
			}
		};
		loadSales();
	}, [profileUser]);

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center py-12">
					<p className="text-xl text-muted-foreground">Loading...</p>
				</div>
		</div>
		);
	}

	if (!profileUser) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center py-12">
					<p className="text-xl text-muted-foreground">User not found</p>
					<Link href="/" className="text-primary hover:underline mt-4 inline-block">
						Go back home
					</Link>
				</div>
			</div>
		);
	}

	const handleMessage = () => {
		if (currentUser && currentUser.id !== profileUser.id) {
			openChat(profileUser.id);
			setTimeout(() => {
				window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
			}, 200);
		}
	};

	const handleSaveListing = async (listingId: string, updates: { price?: number; stock?: number; description?: string; tags?: string[] }) => {
		try {
			const res = await fetch(`/api/sale-listings/${encodeURIComponent(listingId)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(updates),
			});
			if (res.ok) {
				const data = await res.json();
				setSales(prev => prev ? {
					...prev,
					listings: prev.listings.map(x => x.id === listingId ? {
						...x,
						stock: data.listing.stock ?? x.stock,
						status: data.listing.status ?? x.status,
						price: data.listing.price ?? x.price,
						description: data.listing.description ?? x.description,
						tags: data.listing.tags ?? x.tags
					} : x)
				} : prev);
				// Update editingListing state if it's the same listing
				if (editingListing && editingListing.id === listingId) {
					setEditingListing({
						...editingListing,
						price: data.listing.price ?? editingListing.price,
						stock: data.listing.stock ?? editingListing.stock,
						status: data.listing.status ?? editingListing.status,
						description: data.listing.description ?? editingListing.description,
						tags: data.listing.tags ?? editingListing.tags
					});
				}
			} else {
				throw new Error('Failed to update listing');
			}
		} catch (err) {
			throw err;
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<Link
				href="/"
				className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Home
			</Link>

			<div className="bg-card rounded-2xl border border-border p-6 mb-6">
				<div className="flex flex-col md:flex-row gap-6">
					<div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary/20 shrink-0">
						<Image
							src={profileUser.avatar}
							alt={profileUser.username}
							fill
							className="object-cover"
							unoptimized
						/>
					</div>

					<div className="flex-1">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
							<div>
								<h1 className="text-3xl font-bold mb-2">{getDisplayName(profileUser)}</h1>
								<div className="flex items-center gap-4 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										<span>Joined {new Date(profileUser.joinDate).toLocaleDateString()}</span>
									</div>
									<div className="flex items-center gap-2">
										<Package className="h-4 w-4" />
										<span>{userTradePosts.length} active trades</span>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{currentUser && currentUser.id === profileUser.id && (
									<Link
										href={`/profile/${encodeURIComponent(username)}/settings`}
										className={cn(
											"flex items-center gap-2 px-6 py-3 rounded-xl font-semibold",
											"bg-secondary text-secondary-foreground hover:bg-secondary/80",
											"transition-colors"
										)}
									>
										<Settings className="h-5 w-5" />
										Settings
									</Link>
								)}
								{currentUser && currentUser.id !== profileUser.id && (
									<>
										<button
											onClick={handleMessage}
											className={cn(
												"flex items-center gap-2 px-6 py-3 rounded-xl font-semibold",
												"bg-primary text-primary-foreground hover:bg-primary/90",
												"transition-colors"
											)}
										>
											<MessageCircle className="h-5 w-5" />
											Message
										</button>
										<button
											onClick={() => setShowReportModal(true)}
											className={cn(
												"flex items-center gap-2 px-6 py-3 rounded-xl font-semibold",
												"bg-destructive text-destructive-foreground hover:bg-destructive/90",
												"transition-colors"
											)}
										>
											<AlertTriangle className="h-5 w-5" />
											รายงาน
										</button>
									</>
								)}
							</div>
						</div>

						<p className="text-muted-foreground">{profileUser.bio}</p>
					</div>
				</div>
			</div>

		{/* Sales summary & listings */}
		<div className="mt-8">
			<h2 className="text-2xl font-bold mb-4">Sales Overview</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
					<DollarSign className="h-5 w-5" />
					<div>
						<p className="text-sm text-muted-foreground">Total Listings</p>
						<p className="text-xl font-bold">{sales?.summary?.count ?? 0}</p>
					</div>
				</div>
				<div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
					<DollarSign className="h-5 w-5" />
					<div>
						<p className="text-sm text-muted-foreground">Total Value</p>
						<p className="text-xl font-bold">{(sales?.summary?.total ?? 0).toLocaleString()} R$</p>
					</div>
				</div>
			</div>

			<h3 className="text-xl font-semibold mb-3">Items for Sale</h3>
			{!sales || sales.listings.length === 0 ? (
				<div className="text-center py-8 bg-card rounded-xl border border-border text-muted-foreground">No items listed</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{sales.listings.map((l) => (
						<div key={l.id} className="bg-card rounded-xl border border-border p-4 flex gap-3">
							<div className="relative w-20 h-20 rounded overflow-hidden bg-muted shrink-0">
								<Image src={l.image} alt={l.item.name} fill className="object-cover" unoptimized />
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-semibold truncate">{l.item.name}</p>
								<p className="text-xs text-muted-foreground mb-1 line-clamp-2">
									{l.description && l.description.trim() ? l.description : 'No description'}
								</p>
								{l.tags && l.tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mb-1">
										{l.tags.map((tag, idx) => (
											<span
												key={idx}
												className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
											>
												{tag}
											</span>
										))}
									</div>
								)}
								<p className="text-sm font-bold">{l.price.toLocaleString()} R$</p>
								{typeof l.stock === 'number' && (
									<p className="text-xs text-muted-foreground">Stock: {l.stock}</p>
								)}
								<p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</p>
							</div>
							{currentUser && profileUser && currentUser.id === profileUser.id && l.id && !String(l.id).startsWith('price-') && (
								<button
									onClick={() => setEditingListing(l)}
									className={cn(
										"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold",
										"bg-primary text-primary-foreground hover:bg-primary/90",
										"transition-colors"
									)}
								>
									<Edit className="h-4 w-4" />
									Edit
								</button>
							)}
						</div>
					))}
				</div>
			)}
		</div>

			<EditListingModal
				listing={editingListing}
				onClose={() => setEditingListing(null)}
				onSave={handleSaveListing}
			/>

			{showReportModal && profileUser && (
				<ReportUserModal
					reportedUserId={profileUser.id}
					reportedUsername={getDisplayName(profileUser)}
					onClose={() => setShowReportModal(false)}
				/>
			)}
		</div>
	);
}


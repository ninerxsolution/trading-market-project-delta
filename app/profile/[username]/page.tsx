'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, Calendar, Package, DollarSign } from 'lucide-react';
import { useData } from '@/lib/contexts/data-context';
import { useChat } from '@/lib/contexts/chat-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { User, TradePost, Item } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
	const params = useParams();
	const username = params.username as string;
	const { tradePosts } = useData();
	const { openChat } = useChat();
	const { user: currentUser } = useAuth();
	const [profileUser, setProfileUser] = useState<User | null>(null);
	const [userTradePosts, setUserTradePosts] = useState<TradePost[]>([]);
	const [loading, setLoading] = useState(true);
	const [sales, setSales] = useState<{ listings: Array<{ id: string; price: number; description: string; image: string; createdAt: string; item: { id: string; name: string; image: string; rarity: string } }>; summary: { count: number; total: number } } | null>(null);

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
					<div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
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
								<h1 className="text-3xl font-bold mb-2">{profileUser.username}</h1>
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

							{currentUser && currentUser.id !== profileUser.id && (
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
							)}
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
							<div className="relative w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
								<Image src={l.image} alt={l.item.name} fill className="object-cover" unoptimized />
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-semibold truncate">{l.item.name}</p>
								<p className="text-xs text-muted-foreground truncate mb-1">{l.description}</p>
								<p className="text-sm font-bold">{l.price.toLocaleString()} R$</p>
								<p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</p>
							</div>
						</div>
					))}
				</div>
			)}
		</div>

			<div>
				<h2 className="text-2xl font-bold mb-4">Active Trade Posts</h2>
				{userTradePosts.length === 0 ? (
					<div className="text-center py-12 bg-card rounded-2xl border border-border">
						<p className="text-muted-foreground">No active trade posts</p>
					</div>
				) : (
					<div className="space-y-4">
						{userTradePosts.map((post) => {
							// Items are referenced by ID, we'll need to fetch them or use item names from post
							return (
								<div
									key={post.id}
									className="bg-card rounded-xl border border-border p-6 hover:border-primary transition-colors"
								>
									<div className="flex flex-col md:flex-row gap-4">
										{post.image && (
											<div className="relative w-full md:w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
												<Image
													src={post.image}
													alt="Trade post"
													fill
													className="object-cover"
													unoptimized
												/>
											</div>
										)}
										
										<div className="flex-1">
											<div className="flex flex-col md:flex-row gap-4 mb-3">
												<div className="flex-1">
													<p className="text-sm text-muted-foreground mb-1">Trading</p>
													<p className="font-semibold">{post.itemHave}</p>
												</div>
												<div className="text-2xl text-muted-foreground">→</div>
												<div className="flex-1">
													<p className="text-sm text-muted-foreground mb-1">For</p>
													<p className="font-semibold">{post.itemWant}</p>
												</div>
											</div>
											
											<p className="text-muted-foreground mb-3">{post.description}</p>
											
											<p className="text-xs text-muted-foreground">
												Posted {new Date(post.createdAt).toLocaleDateString()}
											</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}


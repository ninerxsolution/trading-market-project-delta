'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, Calendar, Package } from 'lucide-react';
import { useData } from '@/lib/contexts/data-context';
import { useChat } from '@/lib/contexts/chat-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserByUsername, getTradePostsByUserId, getItemById } from '@/lib/mock-data';
import { User, TradePost, Item } from '@/lib/mock-data';
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
						setLoading(false);
						return;
					}
				}
			} catch {}

			// Fallback to mock
			const user = getUserByUsername(username);
			if (!isCancelled) {
				setProfileUser(user || null);
				if (user) {
					const posts = getTradePostsByUserId(user.id);
					setUserTradePosts(posts);
				}
				setLoading(false);
			}
		};
		load();
		return () => { isCancelled = true; };
	}, [username]);

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

			<div>
				<h2 className="text-2xl font-bold mb-4">Active Trade Posts</h2>
				{userTradePosts.length === 0 ? (
					<div className="text-center py-12 bg-card rounded-2xl border border-border">
						<p className="text-muted-foreground">No active trade posts</p>
					</div>
				) : (
					<div className="space-y-4">
						{userTradePosts.map((post) => {
							const itemHave = getItemById(post.itemHave);
							const itemWant = getItemById(post.itemWant);
							
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
													<p className="font-semibold">{itemHave?.name || 'Unknown Item'}</p>
												</div>
												<div className="text-2xl text-muted-foreground">→</div>
												<div className="flex-1">
													<p className="text-sm text-muted-foreground mb-1">For</p>
													<p className="font-semibold">{itemWant?.name || 'Unknown Item'}</p>
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


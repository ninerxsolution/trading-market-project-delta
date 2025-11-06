'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, getDisplayName } from '@/lib/utils';
import { useOrder } from '@/lib/contexts/order-context';
import { Package, CheckCircle, Upload, AlertCircle } from 'lucide-react';

type Conversation = {
	otherUser: { id: string; username: string; avatar: string; merchantName?: string | null };
	lastMessage: string;
	lastMessageTime: string;
};

export default function InboxPage() {
    const { getOrderByChat, updateOrderStatus } = useOrder();
	const [loading, setLoading] = useState(true);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [active, setActive] = useState<string | null>(null);
	const [messages, setMessages] = useState<Array<{ id: string; senderId: string; receiverId: string; message: string; timestamp: string }>>([]);
	const [input, setInput] = useState('');
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const load = async () => {
			try {
				// load session for current user id
				const s = await fetch('/api/auth/session', { credentials: 'include' });
				if (s.ok) {
					const sd = await s.json();
					if (sd?.user?.id) setCurrentUserId(sd.user.id);
				}
				const res = await fetch('/api/inbox', { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setConversations(data.conversations || []);
				}
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	useEffect(() => {
		const loadThread = async () => {
			if (!active) return;
			const res = await fetch(`/api/inbox/${active}`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setMessages(data.messages || []);
			}
		};
		loadThread();
	}, [active]);

	// Scroll to bottom when messages change or when active conversation changes
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, active]);

	useEffect(() => {
		const es = new EventSource('/api/inbox/stream');
		es.addEventListener('message', async (ev) => {
			try {
				const data = JSON.parse((ev as MessageEvent).data);
				if (data?.type === 'message') {
					// If the message involves current active user or current user, refresh thread
					const m = data.message as { senderId: string; receiverId: string };
					if (active && currentUserId && 
						((m.senderId === active || m.receiverId === active) || 
						 (m.senderId === currentUserId || m.receiverId === currentUserId))) {
						const res = await fetch(`/api/inbox/${active}`, { credentials: 'include' });
						if (res.ok) {
							const d = await res.json();
							setMessages(d.messages || []);
						}
					}
				}
			} catch {}
		});
		return () => { es.close(); };
	}, [active, currentUserId]);

	const activeUser = useMemo(() => conversations.find(c => c.otherUser.id === active)?.otherUser, [conversations, active]);

	const send = async () => {
		if (!active || !input.trim()) return;
		const content = input.trim();
		setInput('');
		await fetch('/api/inbox/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ toUserId: active, message: content }) });
		// refresh thread
		const res = await fetch(`/api/inbox/${active}`, { credentials: 'include' });
		if (res.ok) {
			const data = await res.json();
			setMessages(data.messages || []);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">Inbox</h1>
				<Link className="text-primary underline" href="/">Home</Link>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="md:col-span-1 rounded-xl border border-border">
					<div className="p-3 border-b border-border font-semibold">Conversations</div>
					<div className="max-h-[70vh] overflow-y-auto">
						{loading ? (
							<p className="p-3 text-muted-foreground">Loading...</p>
						) : conversations.length === 0 ? (
							<p className="p-3 text-muted-foreground">No conversations</p>
						) : (
							conversations.map(c => (
								<button key={c.otherUser.id} onClick={() => setActive(c.otherUser.id)} className={cn('w-full p-3 flex items-center gap-3 border-b border-border text-left hover:bg-muted/50', active === c.otherUser.id && 'bg-muted/50')}>
									<div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/20">
										<Image src={c.otherUser.avatar} alt={c.otherUser.username} fill className="object-cover" unoptimized />
									</div>
									<div className="min-w-0 flex-1">
										<p className="font-semibold truncate">{getDisplayName(c.otherUser)}</p>
										<p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
									</div>
								</button>
							))
						)}
					</div>
				</div>
				<div className="md:col-span-2 rounded-xl border border-border flex flex-col max-h-[70vh]">
					<div className="p-3 border-b border-border flex items-center gap-2 flex-shrink-0">
						{activeUser ? (
							<>
								<div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/20">
									<Image src={activeUser.avatar} alt={activeUser.username} fill className="object-cover" unoptimized />
								</div>
								<p className="font-semibold">{getDisplayName(activeUser)}</p>
							</>
						) : (
							<p className="text-muted-foreground">Select a conversation</p>
						)}
					</div>
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
						{active ? (
							messages.length === 0 ? (
								<p className="text-sm text-muted-foreground">No messages</p>
							) : (
								messages.map(m => {
									const isOwn = currentUserId && m.senderId === currentUserId;
									return (
										<div key={m.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
											<div className={cn('max-w-[70%] rounded-lg px-3 py-2 text-sm', isOwn ? 'bg-primary text-primary-foreground' : 'bg-background border border-border')}>
												{m.message}
												<p className={cn('text-[10px] mt-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
											</div>
										</div>
									);
								})
							)
						) : null}
						<div ref={messagesEndRef} />
					</div>
                    {/* Order Action Buttons (mirror ChatBar) */}
                    {(() => {
                        if (!active || !currentUserId) return null;
                        const order = getOrderByChat(active, currentUserId);
                        if (!order) return null;
                        
                        const isSeller = order.sellerId === currentUserId;
                        const isBuyer = order.buyerId === currentUserId;
                        
                        if (!isSeller && !isBuyer) return null;
                        
                        // Handle RESERVED status
                        if (order.status === 'RESERVED') {
                            if (isSeller) {
                                return (
                                    <div className="p-3 border-t border-border bg-muted/30 space-y-2 flex-shrink-0">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-700">
                                                Order Reserved - Mark as Sent
                                            </span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateOrderStatus(order.id, 'AWAITING_BUYER_CONFIRM');
                                                } catch (error) {
                                                    console.error('Failed to update order:', error);
                                                    alert('Failed to update order. Please try again.');
                                                }
                                            }}
                                            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Mark as Sent
                                        </button>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="p-3 border-t border-border bg-muted/30 flex-shrink-0">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-700">
                                                Order Reserved - Waiting for seller to mark as sent...
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        }
                        
                        // Handle AWAITING_SELLER_CONFIRM status
                        if (order.status === 'AWAITING_SELLER_CONFIRM') {
                            if (isSeller) {
                                return (
                                    <div className="p-3 border-t border-border bg-muted/30 space-y-2 flex-shrink-0">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-700">
                                                Mark as Sent
                                            </span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateOrderStatus(order.id, 'AWAITING_BUYER_CONFIRM');
                                                } catch (error) {
                                                    console.error('Failed to update order:', error);
                                                    alert('Failed to update order. Please try again.');
                                                }
                                            }}
                                            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Mark as Sent
                                        </button>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="p-3 border-t border-border bg-muted/30 flex-shrink-0">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-700">
                                                Waiting for seller to mark as sent...
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        }
                        
                        // Handle AWAITING_BUYER_CONFIRM status
                        if (order.status === 'AWAITING_BUYER_CONFIRM') {
                            if (isBuyer) {
                                return (
                                    <div className="p-3 border-t border-border bg-muted/30 space-y-2 flex-shrink-0">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
                                            <Package className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-semibold text-green-700">
                                                Confirm Received
                                            </span>
                                        </div>
                                        {order.proofImages.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Proof images:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.proofImages.map((proof, idx) => (
                                                        <div key={idx} className="text-xs p-2 rounded bg-background border border-border">
                                                            {proof.length > 50 ? `${proof.substring(0, 50)}...` : proof}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateOrderStatus(order.id, 'COMPLETED');
                                                } catch (error) {
                                                    console.error('Failed to update order:', error);
                                                    alert('Failed to update order. Please try again.');
                                                }
                                            }}
                                            className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Confirm Received
                                        </button>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="p-3 border-t border-border bg-muted/30 flex-shrink-0">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
                                            <Package className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-semibold text-green-700">
                                                Waiting for buyer to confirm receipt...
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        }
                        
                        // Handle DISPUTE status
                        if (order.status === 'DISPUTE') {
                            return (
                                <div className="p-3 border-t border-border bg-muted/30 flex-shrink-0">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/20 border border-red-500/50">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-sm font-semibold text-red-700">
                                            Order in Dispute - Admin review pending
                                        </span>
                                    </div>
                                    {order.disputeReason && (
                                        <p className="text-xs text-red-600 mt-1">{order.disputeReason}</p>
                                    )}
                                </div>
                            );
                        }
                        
                        // Handle COMPLETED status
                        if (order.status === 'COMPLETED') {
                            return (
                                <div className="p-3 border-t border-border bg-muted/30 flex-shrink-0">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-green-700">
                                            Order Completed
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        
                        // Handle CANCELLED status
                        if (order.status === 'CANCELLED') {
                            return (
                                <div className="p-3 border-t border-border bg-muted/30 flex-shrink-0">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-500/20 border border-gray-500/50">
                                        <AlertCircle className="h-4 w-4 text-gray-600" />
                                        <span className="text-sm font-semibold text-gray-700">
                                            Order Cancelled
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        
                        return null;
                    })()}
					<div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
						<input 
							className="flex-1 border border-border rounded px-2 py-2 text-sm" 
							value={input} 
							onChange={e=>setInput(e.target.value)} 
							onKeyPress={(e) => {
								if (e.key === 'Enter' && active && input.trim()) {
									send();
								}
							}}
							placeholder="Type a message..." 
						/>
						<button className="bg-primary text-white rounded px-3" onClick={send} disabled={!active || !input.trim()}>Send</button>
					</div>
				</div>
			</div>
		</div>
	);
}



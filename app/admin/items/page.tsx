'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ItemRow = {
	id: string;
	name: string;
	image: string;
	description: string;
	rarity: string;
	averagePrice: number;
	avgSellerPrice: number | null;
	npcBuyPrice: number | null;
	npcSellPrice: number | null;
	availability: 'BUYABLE' | 'TRADE_ONLY' | 'NOT_AVAILABLE';
};

export default function AdminItemsPage() {
	const [loading, setLoading] = useState(true);
	const [forbidden, setForbidden] = useState(false);
	const [items, setItems] = useState<ItemRow[]>([]);
	const [newItem, setNewItem] = useState({ name: '', rarity: 'Common', availability: 'NOT_AVAILABLE', npcBuyPrice: '', npcSellPrice: '', image: '', description: '' });
	const [imageFile, setImageFile] = useState<File | null>(null);

	useEffect(() => {
		const init = async () => {
			// auth
			const s = await fetch('/api/auth/session', { credentials: 'include' });
			const sd = await s.json();
			if (!sd?.user || sd.user.role !== 'SUPER_ADMIN') {
				setForbidden(true);
				setLoading(false);
				return;
			}
			// data
			const res = await fetch('/api/items');
			const data = await res.json();
			setItems(data.items || []);
			setLoading(false);
		};
		init();
	}, []);

	if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
	if (forbidden)
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<p className="text-xl text-red-500">403 — Admins only</p>
				<Link className="text-primary underline" href="/">Go home</Link>
			</div>
		);

	const reload = async () => {
		const res = await fetch('/api/items');
		const data = await res.json();
		setItems(data.items || []);
	};

	const createItem = async (e: React.FormEvent) => {
		e.preventDefault();

		let uploadedUrl: string | undefined = undefined;
		if (imageFile) {
			const fd = new FormData();
			fd.append('file', imageFile);
			const upRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
			if (upRes.ok) {
				const up = await upRes.json();
				uploadedUrl = up.url;
			}
		}

		const payload: any = {
			name: newItem.name,
			rarity: newItem.rarity,
			availability: newItem.availability,
			image: uploadedUrl || newItem.image || undefined,
			description: newItem.description || undefined,
			npcBuyPrice: newItem.npcBuyPrice === '' ? undefined : Number(newItem.npcBuyPrice),
			npcSellPrice: newItem.npcSellPrice === '' ? undefined : Number(newItem.npcSellPrice),
		};
		const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		if (!res.ok) { alert('Create failed'); return; }
		setNewItem({ name: '', rarity: 'Common', availability: 'NOT_AVAILABLE', npcBuyPrice: '', npcSellPrice: '', image: '', description: '' });
		setImageFile(null);
		reload();
	};

	const saveNpc = async (id: string, npcBuyPrice: number | null, npcSellPrice: number | null, availability: ItemRow['availability']) => {
		const res = await fetch(`/api/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ npcBuyPrice, npcSellPrice, availability }) });
		if (!res.ok) { alert('Save failed'); return; }
		reload();
	};

	const changeImage = async (id: string, file: File | null) => {
		if (!file) return;
		const fd = new FormData();
		fd.append('file', file);
		const up = await fetch('/api/upload/image', { method: 'POST', body: fd });
		if (!up.ok) { alert('Upload failed'); return; }
		const { url } = await up.json();
		const res = await fetch(`/api/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: url }) });
		if (!res.ok) { alert('Update image failed'); return; }
		reload();
	};

	const removeItem = async (id: string) => {
		if (!confirm('Delete this item?')) return;
		const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
		if (!res.ok) { alert('Delete failed'); return; }
		reload();
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">Items</h1>
				<Link href="/admin" className="text-sm text-primary underline">Back to Admin</Link>
			</div>

			<form onSubmit={createItem} className="mb-6 grid gap-3 grid-cols-1 md:grid-cols-7 items-end">
				<div>
					<label className="text-xs">Name</label>
					<input className="w-full border border-border rounded px-2 py-1" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} required />
				</div>
				<div>
					<label className="text-xs">Rarity</label>
					<select className="w-full border border-border rounded px-2 py-1" value={newItem.rarity} onChange={e=>setNewItem({...newItem, rarity: e.target.value})}>
						<option>Common</option>
						<option>Uncommon</option>
						<option>Rare</option>
						<option>Epic</option>
						<option>Legendary</option>
					</select>
				</div>
				<div>
					<label className="text-xs">Availability</label>
					<select className="w-full border border-border rounded px-2 py-1" value={newItem.availability} onChange={e=>setNewItem({...newItem, availability: e.target.value as any})}>
						<option value="NOT_AVAILABLE">NOT_AVAILABLE</option>
						<option value="BUYABLE">BUYABLE</option>
						<option value="TRADE_ONLY">TRADE_ONLY</option>
					</select>
				</div>
				<div>
					<label className="text-xs">Image</label>
					<input type="file" accept="image/*" className="w-full border border-border rounded px-2 py-1" onChange={e=>setImageFile(e.currentTarget.files?.[0] ?? null)} />
				</div>
				<div>
					<label className="text-xs">NPC Buy</label>
					<input type="number" className="w-full border border-border rounded px-2 py-1" value={newItem.npcBuyPrice} onChange={e=>setNewItem({...newItem, npcBuyPrice: e.target.value})} />
				</div>
				<div>
					<label className="text-xs">NPC Sell</label>
					<input type="number" className="w-full border border-border rounded px-2 py-1" value={newItem.npcSellPrice} onChange={e=>setNewItem({...newItem, npcSellPrice: e.target.value})} />
				</div>
				<div>
					<button className="bg-primary text-white px-3 py-2 rounded">Add</button>
				</div>
			</form>
			<div className="rounded-2xl border border-border overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							<th className="text-left p-3">Name</th>
							<th className="text-left p-3">Image</th>
							<th className="text-left p-3">Rarity</th>
							<th className="text-left p-3">Avg (field)</th>
							<th className="text-left p-3">Avg (sellers)</th>
							<th className="text-left p-3">NPC Buy</th>
							<th className="text-left p-3">NPC Sell</th>
							<th className="text-left p-3">Availability</th>
						</tr>
					</thead>
					<tbody>
						{items.map((it) => (
							<tr key={it.id} className="border-t border-border hover:bg-muted/30">
								<td className="p-3">
									<div className="font-semibold">{it.name}</div>
									<div className="text-muted-foreground line-clamp-1 max-w-[420px]">{it.description}</div>
								</td>
								<td className="p-3">
									<div className="flex items-center gap-2">
										<input type="file" accept="image/*" onChange={(e)=>changeImage(it.id, e.currentTarget.files?.[0] ?? null)} />
									</div>
								</td>
								<td className="p-3">{it.rarity}</td>
								<td className="p-3">{it.averagePrice}</td>
								<td className="p-3">{it.avgSellerPrice ?? '-'}</td>
								<td className="p-3">
									<input type="number" className="w-24 border border-border rounded px-2 py-1" defaultValue={it.npcBuyPrice ?? ''} onBlur={(e)=>saveNpc(it.id, e.currentTarget.value === ''? null : Number(e.currentTarget.value), it.npcSellPrice ?? null, it.availability)} />
								</td>
								<td className="p-3">
									<input type="number" className="w-24 border border-border rounded px-2 py-1" defaultValue={it.npcSellPrice ?? ''} onBlur={(e)=>saveNpc(it.id, it.npcBuyPrice ?? null, e.currentTarget.value === ''? null : Number(e.currentTarget.value), it.availability)} />
								</td>
								<td className="p-3">
									<select className="border border-border rounded px-2 py-1" defaultValue={it.availability} onChange={(e)=>saveNpc(it.id, it.npcBuyPrice ?? null, it.npcSellPrice ?? null, e.currentTarget.value as any)}>
										<option value="NOT_AVAILABLE">NOT_AVAILABLE</option>
										<option value="BUYABLE">BUYABLE</option>
										<option value="TRADE_ONLY">TRADE_ONLY</option>
									</select>
								</td>
								<td className="p-3 text-right">
									<button className="text-red-500" onClick={()=>removeItem(it.id)}>Delete</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}



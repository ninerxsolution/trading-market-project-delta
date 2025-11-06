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
	const [isCreating, setIsCreating] = useState(false);
	const [createName, setCreateName] = useState('');
	const [createDescription, setCreateDescription] = useState('');
	const [createRarity, setCreateRarity] = useState('Common');
	const [createAvailability, setCreateAvailability] = useState<'BUYABLE' | 'TRADE_ONLY' | 'NOT_AVAILABLE'>('NOT_AVAILABLE');
	const [createNpcBuyPrice, setCreateNpcBuyPrice] = useState('');
	const [createNpcSellPrice, setCreateNpcSellPrice] = useState('');
	const [createImageMode, setCreateImageMode] = useState<'url' | 'upload'>('url');
	const [createImageUrl, setCreateImageUrl] = useState('');
	const [createImageFile, setCreateImageFile] = useState<File | null>(null);
	const [editingImageItemId, setEditingImageItemId] = useState<string | null>(null);
	const [modalImageMode, setModalImageMode] = useState<'url' | 'upload'>('upload');
	const [modalImageUrl, setModalImageUrl] = useState('');
	const [modalImageFile, setModalImageFile] = useState<File | null>(null);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editRarity, setEditRarity] = useState('Common');
	const [editAvailability, setEditAvailability] = useState<'BUYABLE' | 'TRADE_ONLY' | 'NOT_AVAILABLE'>('NOT_AVAILABLE');
	const [editNpcBuyPrice, setEditNpcBuyPrice] = useState('');
	const [editNpcSellPrice, setEditNpcSellPrice] = useState('');
	const [editImageMode, setEditImageMode] = useState<'url' | 'upload'>('url');
	const [editImageUrl, setEditImageUrl] = useState('');
	const [editImageFile, setEditImageFile] = useState<File | null>(null);

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

	const openCreateModal = () => {
		setIsCreating(true);
		setCreateName('');
		setCreateDescription('');
		setCreateRarity('Common');
		setCreateAvailability('NOT_AVAILABLE');
		setCreateNpcBuyPrice('');
		setCreateNpcSellPrice('');
		setCreateImageUrl('');
		setCreateImageMode('url');
		setCreateImageFile(null);
	};

	const closeCreateModal = () => {
		setIsCreating(false);
		setCreateName('');
		setCreateDescription('');
		setCreateRarity('Common');
		setCreateAvailability('NOT_AVAILABLE');
		setCreateNpcBuyPrice('');
		setCreateNpcSellPrice('');
		setCreateImageUrl('');
		setCreateImageMode('url');
		setCreateImageFile(null);
	};

	const createItem = async () => {
		if (!createName.trim()) { alert('Name cannot be empty'); return; }

		let imageUrl: string | undefined = undefined;
		if (createImageMode === 'upload' && createImageFile) {
			const fd = new FormData();
			fd.append('file', createImageFile);
			const upRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
			if (!upRes.ok) { alert('Upload failed'); return; }
			const up = await upRes.json();
			imageUrl = up.url;
		} else if (createImageMode === 'url' && createImageUrl.trim()) {
			imageUrl = createImageUrl.trim();
		}

		const payload: any = {
			name: createName.trim(),
			description: createDescription.trim() || null,
			rarity: createRarity,
			availability: createAvailability,
			npcBuyPrice: createNpcBuyPrice === '' ? undefined : Number(createNpcBuyPrice),
			npcSellPrice: createNpcSellPrice === '' ? undefined : Number(createNpcSellPrice),
		};
		if (imageUrl !== undefined) {
			payload.image = imageUrl;
		}

		const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		if (!res.ok) { alert('Create failed'); return; }
		
		closeCreateModal();
		reload();
	};

	const openEditModal = (item: ItemRow) => {
		setEditingItemId(item.id);
		setEditName(item.name);
		setEditDescription(item.description || '');
		setEditRarity(item.rarity);
		setEditAvailability(item.availability);
		setEditNpcBuyPrice(item.npcBuyPrice?.toString() || '');
		setEditNpcSellPrice(item.npcSellPrice?.toString() || '');
		setEditImageUrl(item.image);
		setEditImageMode('url');
		setEditImageFile(null);
	};

	const closeEditModal = () => {
		setEditingItemId(null);
		setEditName('');
		setEditDescription('');
		setEditRarity('Common');
		setEditAvailability('NOT_AVAILABLE');
		setEditNpcBuyPrice('');
		setEditNpcSellPrice('');
		setEditImageUrl('');
		setEditImageMode('url');
		setEditImageFile(null);
	};

	const saveItemDetails = async () => {
		if (!editingItemId) return;
		if (!editName.trim()) { alert('Name cannot be empty'); return; }

		let imageUrl: string | undefined = undefined;
		if (editImageMode === 'upload' && editImageFile) {
			const fd = new FormData();
			fd.append('file', editImageFile);
			const upRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
			if (!upRes.ok) { alert('Upload failed'); return; }
			const up = await upRes.json();
			imageUrl = up.url;
		} else if (editImageMode === 'url' && editImageUrl.trim()) {
			imageUrl = editImageUrl.trim();
		}

		const payload: any = {
			name: editName.trim(),
			description: editDescription.trim() || null,
			rarity: editRarity,
			availability: editAvailability,
			npcBuyPrice: editNpcBuyPrice === '' ? null : Number(editNpcBuyPrice),
			npcSellPrice: editNpcSellPrice === '' ? null : Number(editNpcSellPrice),
		};
		if (imageUrl !== undefined) {
			payload.image = imageUrl;
		}

		const res = await fetch(`/api/items/${editingItemId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!res.ok) { alert('Save failed'); return; }
		
		closeEditModal();
		reload();
	};

	const openImageModal = (item: ItemRow) => {
		setEditingImageItemId(item.id);
		setModalImageUrl(item.image);
		setModalImageFile(null);
		setModalImageMode('upload');
	};

	const closeImageModal = () => {
		setEditingImageItemId(null);
		setModalImageUrl('');
		setModalImageFile(null);
		setModalImageMode('upload');
	};

	const saveImageFromModal = async () => {
		if (!editingImageItemId) return;

		let imageUrl: string | undefined = undefined;

		if (modalImageMode === 'upload' && modalImageFile) {
			const fd = new FormData();
			fd.append('file', modalImageFile);
			const upRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
			if (!upRes.ok) { alert('Upload failed'); return; }
			const up = await upRes.json();
			imageUrl = up.url;
		} else if (modalImageMode === 'url' && modalImageUrl.trim()) {
			imageUrl = modalImageUrl.trim();
		}

		if (!imageUrl) { alert('Please provide an image URL or upload a file'); return; }

		const res = await fetch(`/api/items/${editingImageItemId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ image: imageUrl })
		});
		if (!res.ok) { alert('Update image failed'); return; }
		
		// Optimistic preview
		setItems(prev => prev.map(it => it.id === editingImageItemId ? { ...it, image: imageUrl! } : it));
		closeImageModal();
		reload();
	};

	const removeItem = async (id: string) => {
		if (!confirm('Delete this item?')) return;
		const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
		if (!res.ok) { alert('Delete failed'); return; }
		reload();
	};

	return (
		<>
			{isCreating && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4" onClick={closeCreateModal}>
					<div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full my-auto" onClick={(e) => e.stopPropagation()}>
						<h2 className="text-xl font-bold mb-4">Create New Item</h2>
						<div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
							<div>
								<label className="text-sm mb-2 block">Name *</label>
								<input
									type="text"
									value={createName}
									onChange={(e) => setCreateName(e.target.value)}
									className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="Item name"
									autoFocus
								/>
							</div>
							<div>
								<label className="text-sm mb-2 block">Description</label>
								<textarea
									value={createDescription}
									onChange={(e) => setCreateDescription(e.target.value)}
									rows={3}
									className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
									placeholder="Item description..."
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm mb-2 block">Rarity</label>
									<select
										value={createRarity}
										onChange={(e) => setCreateRarity(e.target.value)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
									>
										<option>Common</option>
										<option>Uncommon</option>
										<option>Rare</option>
										<option>Epic</option>
										<option>Legendary</option>
									</select>
								</div>
								<div>
									<label className="text-sm mb-2 block">Availability</label>
									<select
										value={createAvailability}
										onChange={(e) => setCreateAvailability(e.target.value as any)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
									>
										<option value="NOT_AVAILABLE">NOT_AVAILABLE</option>
										<option value="BUYABLE">BUYABLE</option>
										<option value="TRADE_ONLY">TRADE_ONLY</option>
									</select>
								</div>
							</div>
							<div>
								<label className="text-sm mb-2 block">Image</label>
								<div className="flex gap-2 mb-2">
									<button
										type="button"
										onClick={() => setCreateImageMode('url')}
										className={`px-3 py-1 text-sm rounded ${createImageMode === 'url' ? 'bg-primary text-white' : 'bg-muted'}`}
									>
										URL
									</button>
									<button
										type="button"
										onClick={() => setCreateImageMode('upload')}
										className={`px-3 py-1 text-sm rounded ${createImageMode === 'upload' ? 'bg-primary text-white' : 'bg-muted'}`}
									>
										Upload
									</button>
								</div>
								{createImageMode === 'url' ? (
									<input
										type="url"
										placeholder="https://..."
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										value={createImageUrl}
										onChange={(e) => setCreateImageUrl(e.target.value)}
									/>
								) : (
									<input
										type="file"
										accept="image/*"
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										onChange={e=>setCreateImageFile(e.currentTarget.files?.[0] ?? null)}
										key={createImageFile ? 'has-file' : 'no-file'}
									/>
								)}
								{(createImageFile || (createImageMode === 'url' && createImageUrl)) && (
									<div className="mt-2">
										<img
											src={createImageFile ? URL.createObjectURL(createImageFile) : createImageUrl}
											alt="preview"
											className="w-full max-h-48 object-contain rounded border"
											onError={(e) => {
												(e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23ccc" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="%23999">Invalid Image</text></svg>';
											}}
										/>
									</div>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm mb-2 block">NPC Buy Price</label>
									<input
										type="number"
										value={createNpcBuyPrice}
										onChange={(e) => setCreateNpcBuyPrice(e.target.value)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="0"
									/>
								</div>
								<div>
									<label className="text-sm mb-2 block">NPC Sell Price</label>
									<input
										type="number"
										value={createNpcSellPrice}
										onChange={(e) => setCreateNpcSellPrice(e.target.value)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="0"
									/>
								</div>
							</div>
							<div className="flex gap-2 justify-end pt-4 border-t border-border">
								<button
									type="button"
									onClick={closeCreateModal}
									className="px-4 py-2 border border-border rounded hover:bg-muted"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={createItem}
									className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
								>
									Create
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			{editingItemId && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4" onClick={closeEditModal}>
					<div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full my-auto" onClick={(e) => e.stopPropagation()}>
						<h2 className="text-xl font-bold mb-4">Edit Item</h2>
						<div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
							<div>
								<label className="text-sm mb-2 block">Name *</label>
								<input
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="Item name"
									autoFocus
								/>
							</div>
							<div>
								<label className="text-sm mb-2 block">Description</label>
								<textarea
									value={editDescription}
									onChange={(e) => setEditDescription(e.target.value)}
									rows={3}
									className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
									placeholder="Item description..."
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm mb-2 block">Rarity</label>
									<select
										value={editRarity}
										onChange={(e) => setEditRarity(e.target.value)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
									>
										<option>Common</option>
										<option>Uncommon</option>
										<option>Rare</option>
										<option>Epic</option>
										<option>Legendary</option>
									</select>
								</div>
								<div>
									<label className="text-sm mb-2 block">Availability</label>
									<select
										value={editAvailability}
										onChange={(e) => setEditAvailability(e.target.value as any)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
									>
										<option value="NOT_AVAILABLE">NOT_AVAILABLE</option>
										<option value="BUYABLE">BUYABLE</option>
										<option value="TRADE_ONLY">TRADE_ONLY</option>
									</select>
								</div>
							</div>
							<div>
								<label className="text-sm mb-2 block">Image</label>
								<div className="flex gap-2 mb-2">
									<button
										type="button"
										onClick={() => setEditImageMode('url')}
										className={`px-3 py-1 text-sm rounded ${editImageMode === 'url' ? 'bg-primary text-white' : 'bg-muted'}`}
									>
										URL
									</button>
									<button
										type="button"
										onClick={() => setEditImageMode('upload')}
										className={`px-3 py-1 text-sm rounded ${editImageMode === 'upload' ? 'bg-primary text-white' : 'bg-muted'}`}
									>
										Upload
									</button>
								</div>
								{editImageMode === 'url' ? (
									<input
										type="url"
										placeholder="https://..."
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										value={editImageUrl}
										onChange={(e) => setEditImageUrl(e.target.value)}
									/>
								) : (
									<input
										type="file"
										accept="image/*"
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										onChange={e=>setEditImageFile(e.currentTarget.files?.[0] ?? null)}
										key={editImageFile ? 'has-file' : 'no-file'}
									/>
								)}
								{(editImageFile || (editImageMode === 'url' && editImageUrl)) && (
									<div className="mt-2">
										<img
											src={editImageFile ? URL.createObjectURL(editImageFile) : editImageUrl}
											alt="preview"
											className="w-full max-h-48 object-contain rounded border"
											onError={(e) => {
												(e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23ccc" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="%23999">Invalid Image</text></svg>';
											}}
										/>
									</div>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm mb-2 block">NPC Buy Price</label>
									<input
										type="number"
										value={editNpcBuyPrice}
										onChange={(e) => setEditNpcBuyPrice(e.target.value)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="0"
									/>
								</div>
								<div>
									<label className="text-sm mb-2 block">NPC Sell Price</label>
									<input
										type="number"
										value={editNpcSellPrice}
										onChange={(e) => setEditNpcSellPrice(e.target.value)}
										className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="0"
									/>
								</div>
							</div>
							<div className="flex gap-2 justify-end pt-4 border-t border-border">
								<button
									type="button"
									onClick={closeEditModal}
									className="px-4 py-2 border border-border rounded hover:bg-muted"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={saveItemDetails}
									className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
								>
									Save
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			{editingImageItemId && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeImageModal}>
					<div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
						<h2 className="text-xl font-bold mb-4">Edit Image</h2>
						<div className="space-y-4">
							<div>
								<label className="text-sm mb-2 block">Method</label>
								<div className="flex gap-2 mb-2">
									<button
										type="button"
										onClick={() => setModalImageMode('upload')}
										className={`px-3 py-1 text-sm rounded ${modalImageMode === 'upload' ? 'bg-primary text-white' : 'bg-muted'}`}
									>
										Upload
									</button>
									<button
										type="button"
										onClick={() => setModalImageMode('url')}
										className={`px-3 py-1 text-sm rounded ${modalImageMode === 'url' ? 'bg-primary text-white' : 'bg-muted'}`}
									>
										URL
									</button>
								</div>
								{modalImageMode === 'upload' ? (
									<input
										type="file"
										accept="image/*"
										className="w-full border border-border rounded px-2 py-1"
										onChange={e=>setModalImageFile(e.currentTarget.files?.[0] ?? null)}
										key={modalImageFile ? 'has-file' : 'no-file'}
									/>
								) : (
									<input
										type="url"
										placeholder="https://..."
										className="w-full border border-border rounded px-2 py-1"
										value={modalImageUrl}
										onChange={e=>setModalImageUrl(e.target.value)}
									/>
								)}
							</div>
							{(modalImageFile || (modalImageMode === 'url' && modalImageUrl)) && (
								<div>
									<label className="text-sm mb-2 block">Preview</label>
									<img
										src={modalImageFile ? URL.createObjectURL(modalImageFile) : modalImageUrl}
										alt="preview"
										className="w-full max-h-64 object-contain rounded border"
										onError={(e) => {
											(e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23ccc" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="%23999">Invalid Image</text></svg>';
										}}
									/>
								</div>
							)}
							<div className="flex gap-2 justify-end">
								<button
									type="button"
									onClick={closeImageModal}
									className="px-4 py-2 border border-border rounded hover:bg-muted"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={saveImageFromModal}
									className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
								>
									Save
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-3xl font-bold">Items</h1>
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={openCreateModal}
							className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
						>
							Add Item
						</button>
						<Link href="/admin" className="text-sm text-primary underline">Back to Admin</Link>
					</div>
				</div>
			<div className="rounded-2xl border border-border overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							<th className="text-left p-3">Image</th>
							<th className="text-left p-3">Name</th>
							<th className="text-left p-3">Rarity</th>
							<th className="text-left p-3">Avg (field)</th>
							<th className="text-left p-3">Avg (sellers)</th>
							<th className="text-left p-3">NPC Buy</th>
							<th className="text-left p-3">NPC Sell</th>
							<th className="text-left p-3">Availability</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{items.map((it) => (
							<tr key={it.id} className="border-t border-border hover:bg-muted/30">
								<td className="p-3">
									<img src={it.image} alt="thumb" className="w-12 h-12 object-cover rounded border" />
								</td>
								<td className="p-3">
									<div className="font-semibold">{it.name}</div>
									<div className="text-muted-foreground line-clamp-1 max-w-[420px]">{it.description || <span className="text-muted-foreground/50 italic">No description</span>}</div>
								</td>
								<td className="p-3">{it.rarity}</td>
								<td className="p-3">{it.averagePrice}</td>
								<td className="p-3">{it.avgSellerPrice ?? '-'}</td>
								<td className="p-3">{it.npcBuyPrice ?? '-'}</td>
								<td className="p-3">{it.npcSellPrice ?? '-'}</td>
								<td className="p-3">{it.availability}</td>
								<td className="p-3">
									<div className="flex gap-2 justify-end">
										<button
											type="button"
											onClick={() => openEditModal(it)}
											className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
										>
											Edit
										</button>
										<button
											type="button"
											onClick={()=>removeItem(it.id)}
											className="px-3 py-1 text-sm text-red-500 hover:bg-red-500/10 rounded"
										>
											Delete
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
		</>
	);
}



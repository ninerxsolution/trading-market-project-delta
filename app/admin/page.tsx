'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
	const [loading, setLoading] = useState(true);
	const [forbidden, setForbidden] = useState(false);
	const [user, setUser] = useState<any>(null);

	useEffect(() => {
		const run = async () => {
			try {
				const res = await fetch('/api/auth/session', { credentials: 'include' });
				const data = await res.json();
				if (!res.ok || !data.user) {
					setForbidden(true);
					setLoading(false);
					return;
				}
				setUser(data.user);
				if (data.user.role !== 'SUPER_ADMIN') {
					setForbidden(true);
				} else {
					setForbidden(false);
				}
			} finally {
				setLoading(false);
			}
		};
		run();
	}, []);

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p>Loading...</p>
			</div>
		);
	}

	if (forbidden) {
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<p className="text-xl text-red-500">403 — Admins only</p>
				<Link className="text-primary underline" href="/">Go home</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-4">Admin Management</h1>
			<p className="text-muted-foreground mb-6">Signed in as {user?.username} ({user?.role})</p>
			<div className="grid gap-4">
				<div className="rounded-xl border border-border p-6">
					<h2 className="font-semibold mb-2">Users</h2>
					<p className="text-sm text-muted-foreground">Manage users (placeholder)</p>
				</div>
			</div>
		</div>
	);
}



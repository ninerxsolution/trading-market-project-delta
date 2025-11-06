'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Bug, CheckCircle, XCircle, Clock, Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReportType = 'USER_REPORT' | 'SYSTEM_REPORT';
type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

interface Report {
	id: string;
	type: ReportType;
	title: string;
	description: string;
	status: ReportStatus;
	adminNotes: string | null;
	createdAt: string;
	updatedAt: string;
	reporter: {
		id: string;
		username: string;
		avatar: string;
	};
	reportedUser: {
		id: string;
		username: string;
		avatar: string;
	} | null;
}

export default function AdminReportsPage() {
	const [loading, setLoading] = useState(true);
	const [forbidden, setForbidden] = useState(false);
	const [reports, setReports] = useState<Report[]>([]);
	const [filteredReports, setFilteredReports] = useState<Report[]>([]);
	const [selectedReport, setSelectedReport] = useState<Report | null>(null);
	const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
	const [typeFilter, setTypeFilter] = useState<ReportType | 'ALL'>('ALL');
	const [searchQuery, setSearchQuery] = useState('');
	const [adminNotes, setAdminNotes] = useState('');
	const [updatingStatus, setUpdatingStatus] = useState(false);

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
				if (data.user.role !== 'SUPER_ADMIN') {
					setForbidden(true);
					setLoading(false);
					return;
				}
				loadReports();
			} catch {
				setForbidden(true);
				setLoading(false);
			}
		};
		run();
	}, []);

	const loadReports = async () => {
		try {
			const res = await fetch('/api/reports', { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setReports(data.reports || []);
				setFilteredReports(data.reports || []);
			}
		} catch (error) {
			console.error('Failed to load reports:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let filtered = reports;

		// Filter by status
		if (statusFilter !== 'ALL') {
			filtered = filtered.filter(r => r.status === statusFilter);
		}

		// Filter by type
		if (typeFilter !== 'ALL') {
			filtered = filtered.filter(r => r.type === typeFilter);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(r =>
				r.title.toLowerCase().includes(query) ||
				r.description.toLowerCase().includes(query) ||
				r.reporter.username.toLowerCase().includes(query) ||
				(r.reportedUser && r.reportedUser.username.toLowerCase().includes(query))
			);
		}

		setFilteredReports(filtered);
	}, [reports, statusFilter, typeFilter, searchQuery]);

	const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
		setUpdatingStatus(true);
		try {
			const res = await fetch(`/api/reports/${reportId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					status: newStatus,
					adminNotes: adminNotes.trim() || undefined,
				}),
			});

			if (res.ok) {
				await loadReports();
				setSelectedReport(null);
				setAdminNotes('');
			} else {
				alert('Failed to update report status');
			}
		} catch (error) {
			console.error('Failed to update report:', error);
			alert('Failed to update report status');
		} finally {
			setUpdatingStatus(false);
		}
	};

	const getStatusIcon = (status: ReportStatus) => {
		switch (status) {
			case 'PENDING':
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case 'REVIEWED':
				return <CheckCircle className="h-4 w-4 text-blue-500" />;
			case 'RESOLVED':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'DISMISSED':
				return <XCircle className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = (status: ReportStatus) => {
		switch (status) {
			case 'PENDING':
				return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
			case 'REVIEWED':
				return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
			case 'RESOLVED':
				return 'bg-green-500/20 text-green-500 border-green-500/30';
			case 'DISMISSED':
				return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
		}
	};

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
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold mb-2">Reports Management</h1>
					<p className="text-muted-foreground">View and manage user reports and system feedback</p>
				</div>
				<Link href="/admin" className="text-primary underline">Back to Admin</Link>
			</div>

			{/* Filters */}
			<div className="bg-card rounded-xl border border-border p-4 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-semibold mb-2">Search</label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search reports..."
								className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-semibold mb-2">Status</label>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'ALL')}
							className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="ALL">All Status</option>
							<option value="PENDING">Pending</option>
							<option value="REVIEWED">Reviewed</option>
							<option value="RESOLVED">Resolved</option>
							<option value="DISMISSED">Dismissed</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-semibold mb-2">Type</label>
						<select
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value as ReportType | 'ALL')}
							className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="ALL">All Types</option>
							<option value="USER_REPORT">User Report</option>
							<option value="SYSTEM_REPORT">System Report</option>
						</select>
					</div>
				</div>
			</div>

			{/* Reports List */}
			{filteredReports.length === 0 ? (
				<div className="rounded-xl border border-border p-8 text-center">
					<p className="text-muted-foreground">No reports found</p>
				</div>
			) : (
				<div className="grid gap-4">
					{filteredReports.map((report) => (
						<div
							key={report.id}
							className="bg-card rounded-xl border border-border p-6 hover:bg-muted/50 transition-colors cursor-pointer"
							onClick={() => setSelectedReport(report)}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										{report.type === 'USER_REPORT' ? (
											<AlertTriangle className="h-5 w-5 text-destructive" />
										) : (
											<Bug className="h-5 w-5 text-primary" />
										)}
										<h3 className="text-lg font-semibold">{report.title}</h3>
										<span className={cn(
											"px-2 py-1 rounded text-xs font-medium border",
											getStatusColor(report.status)
										)}>
											{report.status}
										</span>
									</div>
									<p className="text-sm text-muted-foreground mb-3 line-clamp-2">
										{report.description}
									</p>
									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										<span>Reported by: {report.reporter.username}</span>
										{report.reportedUser && (
											<span>Reported user: {report.reportedUser.username}</span>
										)}
										<span>{new Date(report.createdAt).toLocaleString()}</span>
									</div>
								</div>
								{getStatusIcon(report.status)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Report Detail Modal */}
			{selectedReport && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
					<div className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
						<button
							onClick={() => {
								setSelectedReport(null);
								setAdminNotes('');
							}}
							className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
						>
							<X className="h-5 w-5" />
						</button>

						<div className="p-6">
							<div className="flex items-center gap-3 mb-4">
								{selectedReport.type === 'USER_REPORT' ? (
									<AlertTriangle className="h-6 w-6 text-destructive" />
								) : (
									<Bug className="h-6 w-6 text-primary" />
								)}
								<div className="flex-1">
									<h2 className="text-2xl font-bold">{selectedReport.title}</h2>
									<div className="flex items-center gap-2 mt-1">
										<span className={cn(
											"px-2 py-1 rounded text-xs font-medium border",
											getStatusColor(selectedReport.status)
										)}>
											{selectedReport.status}
										</span>
										<span className="text-xs text-muted-foreground">
											{selectedReport.type === 'USER_REPORT' ? 'User Report' : 'System Report'}
										</span>
									</div>
								</div>
							</div>

							<div className="space-y-4 mb-6">
								<div>
									<label className="block text-sm font-semibold mb-1">Description</label>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{selectedReport.description}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-semibold mb-1">Reported by</label>
										<p className="text-sm text-muted-foreground">{selectedReport.reporter.username}</p>
									</div>
									{selectedReport.reportedUser && (
										<div>
											<label className="block text-sm font-semibold mb-1">Reported user</label>
											<p className="text-sm text-muted-foreground">{selectedReport.reportedUser.username}</p>
										</div>
									)}
									<div>
										<label className="block text-sm font-semibold mb-1">Created at</label>
										<p className="text-sm text-muted-foreground">
											{new Date(selectedReport.createdAt).toLocaleString()}
										</p>
									</div>
									<div>
										<label className="block text-sm font-semibold mb-1">Updated at</label>
										<p className="text-sm text-muted-foreground">
											{new Date(selectedReport.updatedAt).toLocaleString()}
										</p>
									</div>
								</div>

								{selectedReport.adminNotes && (
									<div>
										<label className="block text-sm font-semibold mb-1">Admin Notes</label>
										<p className="text-sm text-muted-foreground whitespace-pre-wrap">
											{selectedReport.adminNotes}
										</p>
									</div>
								)}
							</div>

							<div className="border-t border-border pt-4">
								<label className="block text-sm font-semibold mb-2">Admin Notes</label>
								<textarea
									value={adminNotes}
									onChange={(e) => setAdminNotes(e.target.value)}
									placeholder="Add admin notes..."
									rows={3}
									className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
								/>

								<div className="flex gap-3">
									{selectedReport.status !== 'PENDING' && (
										<button
											onClick={() => handleUpdateStatus(selectedReport.id, 'PENDING')}
											disabled={updatingStatus}
											className="flex-1 px-4 py-2 rounded-xl font-semibold bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
										>
											Set Pending
										</button>
									)}
									{selectedReport.status !== 'REVIEWED' && (
										<button
											onClick={() => handleUpdateStatus(selectedReport.id, 'REVIEWED')}
											disabled={updatingStatus}
											className="flex-1 px-4 py-2 rounded-xl font-semibold bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
										>
											Set Reviewed
										</button>
									)}
									{selectedReport.status !== 'RESOLVED' && (
										<button
											onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
											disabled={updatingStatus}
											className="flex-1 px-4 py-2 rounded-xl font-semibold bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors disabled:opacity-50"
										>
											Set Resolved
										</button>
									)}
									{selectedReport.status !== 'DISMISSED' && (
										<button
											onClick={() => handleUpdateStatus(selectedReport.id, 'DISMISSED')}
											disabled={updatingStatus}
											className="flex-1 px-4 py-2 rounded-xl font-semibold bg-gray-500/20 text-gray-500 hover:bg-gray-500/30 transition-colors disabled:opacity-50"
										>
											Set Dismissed
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}


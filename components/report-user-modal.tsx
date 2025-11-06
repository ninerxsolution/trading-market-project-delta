'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportUserModalProps {
	reportedUserId: string;
	reportedUsername: string;
	onClose: () => void;
	onSuccess?: () => void;
}

export function ReportUserModal({ reportedUserId, reportedUsername, onClose, onSuccess }: ReportUserModalProps) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!title.trim() || !description.trim()) {
			setError('กรุณากรอกหัวข้อและรายละเอียด');
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					type: 'USER_REPORT',
					reportedUserId,
					title: title.trim(),
					description: description.trim(),
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to submit report');
			}

			setSuccess(true);
			setTimeout(() => {
				onSuccess?.();
				onClose();
			}, 1500);
		} catch (err: any) {
			setError(err.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (success) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
				<div className="relative w-full max-w-md mx-4 bg-card rounded-2xl border border-border shadow-2xl p-6">
					<div className="text-center">
						<div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
							<AlertTriangle className="h-8 w-8 text-green-500" />
						</div>
						<h2 className="text-2xl font-bold mb-2">ส่งรายงานสำเร็จ</h2>
						<p className="text-muted-foreground">ขอบคุณสำหรับการรายงาน เราจะตรวจสอบและดำเนินการต่อไป</p>
					</div>
				</div>
			</div>
		);
	}

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
					<div className="flex items-center gap-3 mb-6">
						<div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
							<AlertTriangle className="h-6 w-6 text-destructive" />
						</div>
						<div>
							<h2 className="text-2xl font-bold">รายงานผู้ใช้</h2>
							<p className="text-sm text-muted-foreground">รายงาน: {reportedUsername}</p>
						</div>
					</div>

					{error && (
						<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-semibold mb-2">
								หัวข้อรายงาน <span className="text-destructive">*</span>
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="เช่น: หลอกลวง, พฤติกรรมไม่เหมาะสม, ฯลฯ"
								className={cn(
									"w-full px-4 py-3 rounded-xl border border-border",
									"bg-background focus:outline-none focus:ring-2 focus:ring-primary",
									"transition-colors"
								)}
								required
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold mb-2">
								รายละเอียด <span className="text-destructive">*</span>
							</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="อธิบายรายละเอียดเหตุการณ์ที่เกิดขึ้น..."
								rows={6}
								className={cn(
									"w-full px-4 py-3 rounded-xl border border-border",
									"bg-background focus:outline-none focus:ring-2 focus:ring-primary",
									"resize-none transition-colors"
								)}
								required
								disabled={isSubmitting}
							/>
						</div>

						<div className="flex gap-3 pt-4">
							<button
								type="button"
								onClick={onClose}
								disabled={isSubmitting}
								className={cn(
									"flex-1 px-4 py-3 rounded-xl font-semibold",
									"bg-secondary text-secondary-foreground hover:bg-secondary/80",
									"transition-colors disabled:opacity-50"
								)}
							>
								ยกเลิก
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className={cn(
									"flex-1 px-4 py-3 rounded-xl font-semibold",
									"bg-destructive text-destructive-foreground hover:bg-destructive/90",
									"transition-colors disabled:opacity-50"
								)}
							>
								{isSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}


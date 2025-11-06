'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, Save, User, Mail, ImageIcon, FileText, Store, Gamepad2, Upload, X, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { User as UserType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProfileSettingsPage() {
	const params = useParams();
	const router = useRouter();
	const username = params.username as string;
	const { user: currentUser, checkSession } = useAuth();
	const [profileUser, setProfileUser] = useState<UserType | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Form fields
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		avatar: '',
		bio: '',
		merchantName: '',
		gameName: '',
	});

	// Avatar upload
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url');

	useEffect(() => {
		const loadProfile = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
				if (res.ok) {
					const data = await res.json();
					if (data.user) {
						setProfileUser(data.user);
						setFormData({
							username: data.user.username || '',
							email: data.user.email || '',
							avatar: data.user.avatar || '',
							bio: data.user.bio || '',
							merchantName: data.user.merchantName || '',
							gameName: data.user.gameName || '',
						});
						setAvatarPreview(data.user.avatar || null);
						// Determine mode based on avatar URL
						if (data.user.avatar) {
							const isUrl = data.user.avatar.startsWith('http://') || data.user.avatar.startsWith('https://') || data.user.avatar.startsWith('/');
							setAvatarMode(isUrl ? 'url' : 'upload');
						}
					}
				}
			} catch (err) {
				console.error('Failed to load profile:', err);
			} finally {
				setLoading(false);
			}
		};
		loadProfile();
	}, [username]);

	// Check if user is authorized
	useEffect(() => {
		if (!loading && currentUser && profileUser) {
			if (currentUser.id !== profileUser.id) {
				router.push(`/profile/${username}`);
			}
		}
	}, [loading, currentUser, profileUser, username, router]);

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			setError('Please select an image file');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setError('Image size must be less than 5MB');
			return;
		}

		setUploadingAvatar(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/upload/image', {
				method: 'POST',
				body: formData,
				credentials: 'include',
			});

			if (res.ok) {
				const data = await res.json();
				setFormData(prev => ({ ...prev, avatar: data.url }));
				setAvatarPreview(data.url);
			} else {
				setError('Failed to upload image');
			}
		} catch (err) {
			console.error('Upload error:', err);
			setError('Failed to upload image');
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleAvatarUrlChange = (url: string) => {
		setFormData(prev => ({ ...prev, avatar: url }));
		setAvatarPreview(url);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(null);

		try {
			const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(formData),
			});

			if (res.ok) {
				const data = await res.json();
				setProfileUser(data.user);
				setSuccess('Profile updated successfully!');
				
				// Refresh auth context
				if (checkSession) {
					await checkSession();
				}

				// If username changed, redirect to new username
				if (data.user.username !== username) {
					setTimeout(() => {
						router.push(`/profile/${encodeURIComponent(data.user.username)}/settings`);
					}, 1000);
				}
			} else {
				const errorData = await res.json();
				setError(errorData.error || 'Failed to update profile');
			}
		} catch (err) {
			console.error('Update error:', err);
			setError('Failed to update profile. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center py-12">
					<p className="text-xl text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (!profileUser || !currentUser || currentUser.id !== profileUser.id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center py-12">
					<p className="text-xl text-muted-foreground">Unauthorized</p>
					<Link href={`/profile/${username}`} className="text-primary hover:underline mt-4 inline-block">
						Go back to profile
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-3xl">
			<Link
				href={`/profile/${username}`}
				className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Profile
			</Link>

			<div className="bg-card rounded-2xl border border-border p-6 md:p-8">
				<h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
				<p className="text-muted-foreground mb-8">Manage your profile information</p>

				{error && (
					<div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
						{error}
					</div>
				)}

				{success && (
					<div className="mb-6 p-4 rounded-lg bg-green-500/10 text-green-500 text-sm border border-green-500/20">
						{success}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Avatar Section */}
					<div>
						<label className="block text-sm font-semibold mb-3">รูปโปรไฟล์ (Profile Picture)</label>
						<div className="flex items-center gap-6 mb-4">
							<div className="relative w-24 h-24 rounded-full overflow-hidden bg-primary/20 shrink-0 border-2 border-border">
								{avatarPreview ? (
									<Image
										src={avatarPreview}
										alt="Avatar preview"
										fill
										className="object-cover"
										unoptimized
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<ImageIcon className="h-8 w-8 text-muted-foreground" />
									</div>
								)}
							</div>
						</div>

						{/* Mode Selection */}
						<div className="flex gap-2 mb-4">
							<button
								type="button"
								onClick={() => setAvatarMode('url')}
								className={cn(
									"flex-1 px-4 py-2 rounded-lg font-semibold transition-colors",
									"flex items-center justify-center gap-2",
									avatarMode === 'url'
										? "bg-primary text-primary-foreground"
										: "bg-muted hover:bg-muted/80"
								)}
							>
								<LinkIcon className="h-4 w-4" />
								URL
							</button>
							<button
								type="button"
								onClick={() => setAvatarMode('upload')}
								className={cn(
									"flex-1 px-4 py-2 rounded-lg font-semibold transition-colors",
									"flex items-center justify-center gap-2",
									avatarMode === 'upload'
										? "bg-primary text-primary-foreground"
										: "bg-muted hover:bg-muted/80"
								)}
							>
								<Upload className="h-4 w-4" />
								Upload
							</button>
						</div>

						{/* URL Input */}
						{avatarMode === 'url' && (
							<div>
								<label htmlFor="avatar-url" className="block text-sm font-medium mb-2">
									Image URL
								</label>
								<div className="relative">
									<LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
									<input
										type="url"
										id="avatar-url"
										value={formData.avatar}
										onChange={(e) => handleAvatarUrlChange(e.target.value)}
										placeholder="https://example.com/image.jpg"
										className={cn(
											"w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
											"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
											"transition-all"
										)}
									/>
								</div>
								<p className="text-xs text-muted-foreground mt-2">
									Enter a URL to an image (http://, https://, or /uploads/...)
								</p>
							</div>
						)}

						{/* Upload Input */}
						{avatarMode === 'upload' && (
							<div>
								<label
									htmlFor="avatar-upload"
									className={cn(
										"inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold cursor-pointer",
										"bg-primary text-primary-foreground hover:bg-primary/90",
										"disabled:opacity-50 disabled:cursor-not-allowed",
										"transition-colors"
									)}
								>
									{uploadingAvatar ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Upload className="h-4 w-4" />
											Choose File
										</>
									)}
								</label>
								<input
									id="avatar-upload"
									type="file"
									accept="image/*"
									onChange={handleAvatarUpload}
									className="hidden"
									disabled={uploadingAvatar}
								/>
								<p className="text-xs text-muted-foreground mt-2">
									JPG, PNG or GIF. Max size: 5MB
								</p>
							</div>
						)}
					</div>

					{/* Username */}
					<div>
						<label htmlFor="username" className="block text-sm font-semibold mb-2">
							Username
						</label>
						<div className="relative">
							<User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
							<input
								type="text"
								id="username"
								value={formData.username}
								onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
								className={cn(
									"w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
									"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
									"transition-all"
								)}
								required
							/>
						</div>
					</div>

					{/* Email */}
					<div>
						<label htmlFor="email" className="block text-sm font-semibold mb-2">
							Email
						</label>
						<div className="relative">
							<Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
							<input
								type="email"
								id="email"
								value={formData.email}
								onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
								className={cn(
									"w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
									"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
									"transition-all"
								)}
								required
							/>
						</div>
					</div>

					{/* Merchant Name */}
					<div>
						<label htmlFor="merchantName" className="block text-sm font-semibold mb-2">
							ชื่อพ่อค้า (Merchant Name)
						</label>
						<div className="relative">
							<Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
							<input
								type="text"
								id="merchantName"
								value={formData.merchantName}
								onChange={(e) => setFormData(prev => ({ ...prev, merchantName: e.target.value }))}
								placeholder="Enter your merchant name"
								className={cn(
									"w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
									"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
									"transition-all"
								)}
							/>
						</div>
					</div>

					{/* Game Name */}
					<div>
						<label htmlFor="gameName" className="block text-sm font-semibold mb-2">
							ชื่อในเกม (In-Game Name)
						</label>
						<div className="relative">
							<Gamepad2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
							<input
								type="text"
								id="gameName"
								value={formData.gameName}
								onChange={(e) => setFormData(prev => ({ ...prev, gameName: e.target.value }))}
								placeholder="Enter your in-game name"
								className={cn(
									"w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
									"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
									"transition-all"
								)}
							/>
						</div>
					</div>

					{/* Bio */}
					<div>
						<label htmlFor="bio" className="block text-sm font-semibold mb-2">
							Bio
						</label>
						<div className="relative">
							<FileText className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
							<textarea
								id="bio"
								value={formData.bio}
								onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
								placeholder="Tell us about yourself..."
								rows={4}
								className={cn(
									"w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
									"focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
									"transition-all resize-none"
								)}
							/>
						</div>
					</div>

					{/* Submit Button */}
					<div className="flex gap-4 pt-4">
						<button
							type="submit"
							disabled={saving}
							className={cn(
								"flex-1 px-6 py-3 rounded-xl font-semibold",
								"bg-primary text-primary-foreground hover:bg-primary/90",
								"disabled:opacity-50 disabled:cursor-not-allowed",
								"transition-colors flex items-center justify-center gap-2"
							)}
						>
							{saving ? (
								<>
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="h-5 w-5" />
									Save Changes
								</>
							)}
						</button>
						<Link
							href={`/profile/${username}`}
							className={cn(
								"px-6 py-3 rounded-xl font-semibold",
								"bg-muted hover:bg-muted/80",
								"transition-colors flex items-center justify-center"
							)}
						>
							Cancel
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}


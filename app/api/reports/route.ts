import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_token';

async function getCurrentUser() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
		if (!sessionToken) return null;

		const session = await prisma.session.findUnique({
			where: { sessionToken },
			include: { user: true },
		});

		if (!session || session.expiresAt < new Date()) {
			return null;
		}

		return session.user;
	} catch {
		return null;
	}
}

// POST - Create a report
export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { type, reportedUserId, title, description } = body;

		if (!type || !title || !description) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (type === 'USER_REPORT' && !reportedUserId) {
			return NextResponse.json({ error: 'reportedUserId is required for USER_REPORT' }, { status: 400 });
		}

		if (type === 'SYSTEM_REPORT' && reportedUserId) {
			return NextResponse.json({ error: 'reportedUserId should not be provided for SYSTEM_REPORT' }, { status: 400 });
		}

		// Validate reported user exists if provided
		if (reportedUserId) {
			const reportedUser = await prisma.user.findUnique({
				where: { id: reportedUserId },
			});
			if (!reportedUser) {
				return NextResponse.json({ error: 'Reported user not found' }, { status: 404 });
			}
		}

		const report = await prisma.report.create({
			data: {
				type,
				reporterId: user.id,
				reportedUserId: type === 'USER_REPORT' ? reportedUserId : null,
				title: title.trim(),
				description: description.trim(),
			},
			include: {
				reporter: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
				reportedUser: reportedUserId ? {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				} : undefined,
			},
		});

		return NextResponse.json({ report }, { status: 201 });
	} catch (error) {
		console.error('POST /api/reports error:', error);
		return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
	}
}

// GET - Get all reports (admin only)
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only SUPER_ADMIN can view reports
		if (user.role !== 'SUPER_ADMIN') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status');
		const type = searchParams.get('type');

		const where: any = {};
		if (status) {
			where.status = status;
		}
		if (type) {
			where.type = type;
		}

		const reports = await prisma.report.findMany({
			where,
			include: {
				reporter: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
				reportedUser: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json({ reports });
	} catch (error) {
		console.error('GET /api/reports error:', error);
		return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
	}
}


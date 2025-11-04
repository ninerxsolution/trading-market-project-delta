import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fsp } from 'fs';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
	try {
		const { filename } = await context.params;
		const ROOT = process.cwd();
		const abs = path.join(ROOT, 'storage', 'uploads', 'images', filename);
		const data = await fsp.readFile(abs);
		const ext = path.extname(filename).toLowerCase();
		const type = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
		return new NextResponse(data, { status: 200, headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } });
	} catch (e) {
		return new NextResponse('Not found', { status: 404 });
	}
}



import { NextRequest, NextResponse } from 'next/server';
import { promises as fsp } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

const ROOT = process.cwd();
const STORAGE_DIR = path.join(ROOT, 'storage', 'uploads', 'images');

function getExt(filename: string) {
	const idx = filename.lastIndexOf('.');
	return idx >= 0 ? filename.slice(idx) : '';
}

export async function POST(request: NextRequest) {
	try {
		const form = await request.formData();
		const file = form.get('file');
		if (!file || !(file as any).arrayBuffer) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}
		const blob = file as File;
		const buf = Buffer.from(await blob.arrayBuffer());
		await fsp.mkdir(STORAGE_DIR, { recursive: true });
		const safeName = crypto.randomBytes(16).toString('hex') + getExt(blob.name).toLowerCase();
		const abs = path.join(STORAGE_DIR, safeName);
		await fsp.writeFile(abs, buf);

		const url = `/uploads/images/${safeName}`;
		return NextResponse.json({ success: true, url, filename: safeName });
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}



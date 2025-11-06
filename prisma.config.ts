import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { defineConfig, env } from "prisma/config";

// Load .env.local first, then .env (match prisma/seed.ts behavior)
const projectRoot = path.resolve(__dirname);
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

// Resolve DATABASE_URL to absolute path (same logic as lib/db.ts and prisma/seed.ts)
function resolveDatabaseUrl() {
	let dbUrl = process.env.DATABASE_URL;
	
	if (!dbUrl) {
		// Default to dev.db if not set
		dbUrl = 'file:./prisma/dev.db';
	}

	// Force relative dev.db to live under ./prisma/dev.db (avoid root ./dev.db)
	if (dbUrl === 'file:./dev.db') {
		dbUrl = 'file:./prisma/dev.db';
	}

	if (dbUrl && dbUrl.startsWith('file:./')) {
		// Resolve relative to project root
		const relativePath = dbUrl.replace('file:', '');
		const dbPath = path.resolve(projectRoot, relativePath);
		
		// Normalize path separators for Windows
		const normalizedPath = dbPath.replace(/\\/g, '/');
		
		if (!fs.existsSync(dbPath)) {
			// Create directory if it doesn't exist
			const dbDir = path.dirname(dbPath);
			if (!fs.existsSync(dbDir)) {
				fs.mkdirSync(dbDir, { recursive: true });
			}
		}
		
		// Use absolute path with forward slashes for SQLite
		dbUrl = `file:${normalizedPath}`;
		process.env.DATABASE_URL = dbUrl;
	}
	
	return dbUrl;
}

// Resolve database URL before creating config
const resolvedDbUrl = resolveDatabaseUrl();

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	engine: "classic",
	datasource: {
		url: resolvedDbUrl,
	},
});

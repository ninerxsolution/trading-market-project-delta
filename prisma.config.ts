import dotenv from 'dotenv';
import path from 'path';
import { defineConfig, env } from "prisma/config";

// Load .env.local first, then .env (match prisma/seed.ts behavior)
const projectRoot = path.resolve(__dirname);
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	engine: "classic",
	datasource: {
		url: env("DATABASE_URL"),
	},
});

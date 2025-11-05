import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient, Role, NpcAvailability } from '@prisma/client';

// Load .env.local first, then .env
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

// Ensure DATABASE_URL uses absolute path if it's relative
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
	// Default to dev.db if not set
	dbUrl = 'file:./prisma/dev.db';
}

if (dbUrl && dbUrl.startsWith('file:./')) {
	// Resolve relative to project root (one level up from prisma directory)
	const dbPath = path.resolve(projectRoot, dbUrl.replace('file:', ''));
	if (!fs.existsSync(dbPath)) {
		// Create directory if it doesn't exist
		const dbDir = path.dirname(dbPath);
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}
	}
	dbUrl = `file:${dbPath}`;
	process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient();

async function main() {
	const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
	const email = process.env.SUPER_ADMIN_EMAIL || 'admin@local';
	const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

	await prisma.user.upsert({
		where: { username },
		update: {
			email,
			password,
			role: Role.SUPER_ADMIN,
		},
		create: {
			username,
			email,
			password,
			avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
			joinDate: new Date().toISOString().split('T')[0],
			bio: 'Super admin',
			role: Role.SUPER_ADMIN,
		},
	});

	// Demo users for listings
	const demoUsers = [
		{ username: 'demo1', email: 'demo1@local', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo1' },
		{ username: 'demo2', email: 'demo2@local', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo2' },
	];
	for (const du of demoUsers) {
		await prisma.user.upsert({
			where: { username: du.username },
			update: { email: du.email, avatar: du.avatar },
			create: {
				username: du.username,
				email: du.email,
				password: 'password',
				avatar: du.avatar,
				joinDate: new Date().toISOString().split('T')[0],
				bio: 'Demo seller',
			},
		});
	}

	// Seed some items from mock with NPC defaults if not present
	const baseItems = [
		{ name: 'Iron Scrap', rarity: 'Common', availability: 'BUYABLE' as NpcAvailability, npcBuyPrice: 40, npcSellPrice: 25 },
		{ name: 'Battery Pack', rarity: 'Uncommon', availability: 'BUYABLE' as NpcAvailability, npcBuyPrice: 140, npcSellPrice: 90 },
		{ name: 'Plasma Core', rarity: 'Rare', availability: 'TRADE_ONLY' as NpcAvailability, npcBuyPrice: null, npcSellPrice: null },
		{ name: 'Carbon Fiber Plate', rarity: 'Epic', availability: 'NOT_AVAILABLE' as NpcAvailability, npcBuyPrice: null, npcSellPrice: null },
	];

	for (const it of baseItems) {
		const item = await prisma.item.upsert({
			where: { name: it.name },
			update: {
				rarity: it.rarity,
				availability: it.availability,
				npcBuyPrice: it.npcBuyPrice,
				npcSellPrice: it.npcSellPrice,
			},
			create: {
				name: it.name,
				image: 'https://via.placeholder.com/200',
				description: `${it.name} description`,
				rarity: it.rarity,
				averagePrice: 0,
				availability: it.availability,
				npcBuyPrice: it.npcBuyPrice,
				npcSellPrice: it.npcSellPrice,
			},
		});

		// Seed some seller prices
		const u1 = await prisma.user.findUnique({ where: { username: 'demo1' } });
		const u2 = await prisma.user.findUnique({ where: { username: 'demo2' } });
		if (u1 && u2) {
			await prisma.itemPrice.create({ data: { itemId: item.id, sellerId: u1.id, price: 100 + Math.floor(Math.random() * 200) } }).catch(() => {});
			await prisma.itemPrice.create({ data: { itemId: item.id, sellerId: u2.id, price: 120 + Math.floor(Math.random() * 220) } }).catch(() => {});
		}
	}

	console.log(`Super admin ensured: ${username} (${email})`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

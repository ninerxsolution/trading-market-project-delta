import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient, Role, NpcAvailability, ItemType } from '@prisma/client';

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
		{ username: 'demo1', email: 'demo1@local', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo1', merchantName: 'Demo Merchant 1', gameName: 'Player1' },
		{ username: 'demo2', email: 'demo2@local', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo2', merchantName: 'Demo Merchant 2', gameName: 'Player2' },
	];
	for (const du of demoUsers) {
		await prisma.user.upsert({
			where: { username: du.username },
			update: { email: du.email, avatar: du.avatar, merchantName: du.merchantName, gameName: du.gameName },
			create: {
				username: du.username,
				email: du.email,
				password: 'password',
				avatar: du.avatar,
				joinDate: new Date().toISOString().split('T')[0],
				bio: 'Demo seller',
				merchantName: du.merchantName,
				gameName: du.gameName,
			},
		});
	}

	// Load items from item_list.json
	const itemListPath = path.join(projectRoot, 'storage', 'items', 'item_list.json');
	
	if (!fs.existsSync(itemListPath)) {
		console.warn(`⚠️  Item list file not found: ${itemListPath}`);
		console.warn('   Skipping item seeding. Run "npm run fetch:wiki-details" first.');
	} else {
		console.log('📖 Loading items from item_list.json...');
		const itemListContent = fs.readFileSync(itemListPath, 'utf-8');
		const itemListData = JSON.parse(itemListContent);
		const items = itemListData.itemList || [];

		console.log(`✅ Found ${items.length} items to seed\n`);

		// Helper function to map type string to ItemType enum
		function mapItemType(type: string): ItemType {
			const typeMap: Record<string, ItemType> = {
				'WEAPON': ItemType.WEAPON,
				'MEDICINE': ItemType.MEDICINE,
				'ATTACHMENT': ItemType.ATTACHMENT,
				'OTHER': ItemType.OTHER,
			};
			return typeMap[type.toUpperCase()] || ItemType.OTHER;
		}

		// Helper function to map availability string to NpcAvailability enum
		function mapAvailability(availability: string): NpcAvailability {
			const availabilityMap: Record<string, NpcAvailability> = {
				'BUYABLE': NpcAvailability.BUYABLE,
				'TRADE_ONLY': NpcAvailability.TRADE_ONLY,
				'NOT_AVAILABLE': NpcAvailability.NOT_AVAILABLE,
			};
			return availabilityMap[availability.toUpperCase()] || NpcAvailability.NOT_AVAILABLE;
		}

		let successCount = 0;
		let skipCount = 0;
		let errorCount = 0;

		for (const itemData of items) {
			try {
				// Skip items with placeholder images
				if (itemData.image && (
					itemData.image.includes('Coming_Soon.png') ||
					itemData.image.includes('data:image/gif') ||
					itemData.image === ''
				)) {
					skipCount++;
					continue;
				}

				const item = await prisma.item.upsert({
					where: { name: itemData.name },
					update: {
						image: itemData.image || 'https://via.placeholder.com/200',
						description: itemData.description || `${itemData.name} description`,
						rarity: itemData.rarity || 'Common',
						type: mapItemType(itemData.type || 'OTHER'),
						availability: mapAvailability(itemData.availability || 'NOT_AVAILABLE'),
						npcBuyPrice: itemData.npcBuyPrice ?? null,
						npcSellPrice: itemData.npcSellPrice ?? null,
						averagePrice: itemData.averagePrice || 0,
					},
					create: {
						name: itemData.name,
						image: itemData.image || 'https://via.placeholder.com/200',
						description: itemData.description || `${itemData.name} description`,
						rarity: itemData.rarity || 'Common',
						type: mapItemType(itemData.type || 'OTHER'),
						averagePrice: itemData.averagePrice || 0,
						availability: mapAvailability(itemData.availability || 'NOT_AVAILABLE'),
						npcBuyPrice: itemData.npcBuyPrice ?? null,
						npcSellPrice: itemData.npcSellPrice ?? null,
					},
				});

				successCount++;

				// Seed some seller prices for demo users (only for first few items to avoid too many)
				if (successCount <= 10) {
					const u1 = await prisma.user.findUnique({ where: { username: 'demo1' } });
					const u2 = await prisma.user.findUnique({ where: { username: 'demo2' } });
					if (u1 && u2) {
						const price1 = 100 + Math.floor(Math.random() * 200);
						const price2 = 120 + Math.floor(Math.random() * 220);

						await prisma.itemPrice.create({ data: { itemId: item.id, sellerId: u1.id, price: price1 } }).catch(() => {});
						await prisma.itemPrice.create({ data: { itemId: item.id, sellerId: u2.id, price: price2 } }).catch(() => {});

						// Calculate and update averagePrice based on all ItemPrices
						const prices = await prisma.itemPrice.findMany({
							where: { itemId: item.id }
						});

						if (prices.length > 0) {
							const avgPrice = Math.round(
								prices.reduce((sum, p) => sum + p.price, 0) / prices.length
							);

							await prisma.item.update({
								where: { id: item.id },
								data: { averagePrice: avgPrice }
							});
						}
					}
				}
			} catch (error) {
				console.error(`❌ Error seeding item "${itemData.name}":`, error);
				errorCount++;
			}
		}

		console.log(`\n📊 Item seeding summary:`);
		console.log(`   ✅ Success: ${successCount} items`);
		console.log(`   ⏭️  Skipped: ${skipCount} items (placeholder images)`);
		console.log(`   ❌ Errors: ${errorCount} items\n`);
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

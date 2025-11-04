import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	const username = process.env.SUPER_ADMIN_USERNAME || 'admin';
	const email = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
	const password = process.env.SUPER_ADMIN_PASSWORD || 'change-me-now';

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



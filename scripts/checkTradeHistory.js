const { PrismaClient } = require('@prisma/client');

async function main() {
	const prisma = new PrismaClient();
	try {
		const count = await prisma.tradeHistory.count();
		console.log('TradeHistory.count =', count);
	} catch (e) {
		console.error('Query failed:', e?.message || e);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

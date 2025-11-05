import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL uses absolute path if it's relative
// This is needed because Next.js may run from different directories
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
    // In Next.js, process.cwd() should be the project root
    const projectRoot = path.resolve(process.cwd());
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

// Resolve database URL before creating PrismaClient
resolveDatabaseUrl();

if (process.env.NODE_ENV === 'development') {
  console.log('[lib/db] DATABASE_URL resolved to:', process.env.DATABASE_URL);
}

// Create PrismaClient with proper error handling
function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    const client = new PrismaClient({
      // Silence Prisma engine error logs in the app runtime to avoid noisy console output
      log: [],
    });
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }
    
    return client;
  } catch (error) {
    console.error('Failed to create PrismaClient:', error);
    console.error('DATABASE_URL:', process.env.DATABASE_URL);
    throw error;
  }
}

const prismaInstance = createPrismaClient();

// Ensure prisma is always defined
if (!prismaInstance) {
  throw new Error('PrismaClient failed to initialize. DATABASE_URL may be missing or invalid.');
}

// Export prisma with type assertion to ensure it's always defined
export const prisma: PrismaClient = prismaInstance as PrismaClient;


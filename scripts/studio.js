require('dotenv/config');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Load .env.local first, then .env
const projectRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(projectRoot, '.env.local') });
require('dotenv').config({ path: path.join(projectRoot, '.env') });

// Resolve DATABASE_URL to absolute path
function resolveDatabaseUrl() {
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    // Default to dev.db if not set
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

// Resolve database URL
resolveDatabaseUrl();

console.log('[studio] Using DATABASE_URL:', process.env.DATABASE_URL);

// Spawn Prisma Studio
const studio = spawn('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: projectRoot,
});

studio.on('exit', (code) => {
  process.exit(code || 0);
});

studio.on('error', (error) => {
  console.error('[studio] Error:', error);
  process.exit(1);
});


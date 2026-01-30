import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use HTTP connection instead of WebSocket for better compatibility
// This is more reliable in serverless/development environments
const sql = neon(process.env.DATABASE_URL);

// Create the drizzle instance
export const db = drizzle(sql, { schema });

// Export schema for easy access
export { schema };

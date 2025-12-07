import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { logger } from '../utils/logger';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  logger.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create postgres connection
const queryClient = postgres(databaseUrl);

// Create drizzle instance
export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

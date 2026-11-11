import { neon } from '@neondatabase/serverless';
import { initializeCloud } from '../server/storage-postgres.mjs';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = neon(process.env.DATABASE_URL);
await initializeCloud((text, params) => sql.query(text, params, { fetchOptions: { signal: AbortSignal.timeout(10000) } }));
console.log('Cloud database initialized; existing data preserved');

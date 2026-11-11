import { neon } from '@neondatabase/serverless';
import { seed } from './domain.mjs';

export function createPostgresStore(query) {
  async function readRow() {
    const rows = await query('SELECT state, version::text AS version FROM razbeg_state WHERE id = 1', []);
    if (!rows[0]) throw new Error('Cloud database is not initialized');
    return rows[0];
  }
  return {
    async read() { return (await readRow()).state; },
    async mutate(change) {
      // Retry explicit write conflicts only; a network error may hide a committed write.
      for (let attempt = 0; attempt < 4; attempt++) {
        const { state, version } = await readRow();
        const result = change(state);
        const updated = await query('UPDATE razbeg_state SET state = $1::jsonb, version = version + 1 WHERE id = 1 AND version = $2::bigint RETURNING version', [JSON.stringify(state), version]);
        if (updated.length) return { result, revision: state.revision };
      }
      const error = new Error('Данные изменяются другим пользователем. Повторите действие.');
      error.statusCode = 409;
      throw error;
    },
  };
}

export function cloudStore() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  const sql = neon(process.env.DATABASE_URL);
  return createPostgresStore(async (text, params) => {
    try { return await sql.query(text, params, { fetchOptions: { signal: AbortSignal.timeout(5000) } }); }
    catch { throw new Error('Cloud database unavailable'); }
  });
}

export async function initializeCloud(query) {
  await query('CREATE TABLE IF NOT EXISTS razbeg_state (id integer PRIMARY KEY CHECK (id = 1), state jsonb NOT NULL, version bigint NOT NULL DEFAULT 1)', []);
  await query('INSERT INTO razbeg_state (id, state) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING', [JSON.stringify(seed())]);
}

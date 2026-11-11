import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { seed } from './domain.mjs';

export function createSqliteStore(filename) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL)');
  const read = () => JSON.parse(db.prepare('SELECT value FROM app_state WHERE id=1').get().value);
  const write = state => db.prepare('INSERT INTO app_state (id,value) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(JSON.stringify(state));
  if (!db.prepare('SELECT id FROM app_state WHERE id=1').get()) write(seed());
  return {
    read,
    async mutate(change) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const state = read();
        const result = change(state);
        write(state);
        db.exec('COMMIT');
        return { result, revision: state.revision };
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => db.close(),
  };
}

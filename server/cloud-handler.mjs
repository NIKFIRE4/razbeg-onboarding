import { cloudStore } from './storage-postgres.mjs';
import { createHandler } from './http-handler.mjs';

let handler;
export default async function cloudHandler(req, res) {
  if (!handler) {
    try { handler = createHandler(cloudStore(), { cloud: true, storage: 'postgres', documentMaxBytes: 3 * 1024 * 1024 }); }
    catch {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: 'Хранилище ещё не настроено. Повторите позже.' }));
      return;
    }
  }
  return handler(req, res);
}

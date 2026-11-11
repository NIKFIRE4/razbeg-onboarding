import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createSqliteStore } from './storage-sqlite.mjs';
import { createHandler } from './http-handler.mjs';

const store = createSqliteStore(fileURLToPath(new URL('../data/novichok.sqlite', import.meta.url)));
const server = http.createServer(createHandler(store));
const port = Number(process.env.API_PORT || 4310);
server.listen(port, '127.0.0.1', () => console.log(`API ready http://127.0.0.1:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => { store.close(); process.exit(0); }));

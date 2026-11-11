import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPostgresStore } from '../server/storage-postgres.mjs';
import { createSqliteStore } from '../server/storage-sqlite.mjs';
import { createHandler } from '../server/http-handler.mjs';
import { seed, applyAction } from '../server/domain.mjs';

function memoryDatabase() {
  let state = seed(), version = 1, writes = 0;
  return {
    async query(text, params) {
      if (text.startsWith('SELECT')) return [{ state: structuredClone(state), version: String(version) }];
      writes++;
      if (String(version) !== params[1]) return [];
      state = JSON.parse(params[0]);
      return [{ version: ++version }];
    },
    get state() { return state; },
    get version() { return version; },
    get writes() { return writes; },
  };
}
async function request(handler, url, method = 'GET', body) {
  let status, value;
  const req = { url, method, ...(body === undefined ? {} : { body }) };
  const res = { writeHead(code) { status = code; }, end(text) { value = JSON.parse(text); } };
  await handler(req, res);
  return { status, value };
}

test('concurrent cloud writes preserve both employees progress', async () => {
  const db = memoryDatabase(), store = createPostgresStore(db.query);
  const a = db.state.employees[0], b = db.state.employees[4], step = db.state.templates[0].steps[1];
  await Promise.all([a, b].map(e => store.mutate(s => applyAction(s, 'completeStep', { employeeId: e.id, stepId: step.id, done: true }, 'employee'))));
  assert.ok(db.state.employees.find(e => e.id === a.id).completed.includes(step.id));
  assert.ok(db.state.employees.find(e => e.id === b.id).completed.includes(step.id));
  assert.equal(db.version, 3);
  assert.equal(db.writes, 3);
});
test('conflict retry retains idempotency of the same request', async () => {
  const db = memoryDatabase(), store = createPostgresStore(db.query);
  const payload = { employeeId: db.state.employees[0].id, text: 'Нужна помощь с доступом', recipient: 'mentor', key: 'concurrent-same' };
  const [a, b] = await Promise.all([1, 2].map(() => store.mutate(s => applyAction(s, 'ask', payload, 'employee'))));
  assert.equal(a.result.id, b.result.id);
  assert.equal(db.state.requests.filter(r => r.id === a.result.id).length, 1);
});
test('database version remains monotonic through demo reset', async () => {
  const db = memoryDatabase(), store = createPostgresStore(db.query);
  await store.mutate(s => { s.revision = 40; });
  await store.mutate(s => Object.assign(s, seed()));
  assert.equal(db.state.revision, 1);
  assert.equal(db.version, 3);
});
test('network failure is not automatically retried', async () => {
  let updates = 0;
  const store = createPostgresStore(async text => {
    if (text.startsWith('SELECT')) return [{ state: seed(), version: '1' }];
    updates++;
    throw new Error('Network failure after uncertain commit');
  });
  await assert.rejects(store.mutate(s => { s.revision++; }), /Network/);
  assert.equal(updates, 1);
});
test('write contention returns a bounded conflict rather than losing data', async () => {
  let attempts = 0;
  const store = createPostgresStore(async text => text.startsWith('SELECT') ? [{ state: seed(), version: '1' }] : (attempts++, []));
  await assert.rejects(store.mutate(s => { s.revision++; }), e => e.statusCode === 409);
  assert.equal(attempts, 4);
});
test('SQLite adapter preserves existing state on restart and rolls back invalid changes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'razbeg-'));
  let store;
  try {
    store = createSqliteStore(join(dir, 'test.sqlite'));
    await store.mutate(s => { s.revision = 77; });
    await assert.rejects(store.mutate(s => { s.revision = 100; throw new Error('reject'); }));
    store.close();
    store = createSqliteStore(join(dir, 'test.sqlite'));
    assert.equal(store.read().revision, 77);
  } finally { store?.close(); await rm(dir, { recursive: true, force: true }); }
});
test('serverless preparsed body uses same action and privacy contract', async () => {
  const db = memoryDatabase(), handler = createHandler(createPostgresStore(db.query), { cloud: true, storage: 'postgres', documentMaxBytes: 3 * 1024 * 1024 });
  const health = await request(handler, '/api/health');
  assert.equal(health.value.storage, 'postgres');
  const result = await request(handler, '/api/action', 'POST', { role: 'employee', action: 'ask', payload: { employeeId: db.state.employees[0].id, text: 'PRIVATE-HR-CLOUD', recipient: 'hr', key: 'private-cloud' } });
  assert.equal(result.status, 200);
  const mentor = await request(handler, '/api/state?role=mentor');
  assert.ok(!JSON.stringify(mentor.value).includes('PRIVATE-HR-CLOUD'));
});
test('serverless PDF, DOC, DOCX routes parse actual fixtures', async () => {
  const db = memoryDatabase(), handler = createHandler(createPostgresStore(db.query), { cloud: true, documentMaxBytes: 3 * 1024 * 1024 });
  for (const ext of ['pdf', 'doc', 'docx']) {
    const buffer = await readFile(new URL(`./fixtures/sample.${ext}`, import.meta.url));
    const result = await request(handler, '/api/document', 'POST', { filename: `sample.${ext}`, base64: buffer.toString('base64') });
    assert.equal(result.status, 200);
    assert.ok(result.value.text.length > 20);
  }
});
test('cloud errors never disclose connection strings and oversized JSON is rejected', async () => {
  const handler = createHandler({ read() { throw new Error('Cloud database unavailable: postgresql://secret'); } }, { cloud: true });
  const error = await request(handler, '/api/health');
  assert.equal(error.status, 503);
  assert.ok(!JSON.stringify(error).includes('secret'));
  const large = await request(handler, '/api/action', 'POST', { role: 'hr', payload: 'x'.repeat(200001) });
  assert.equal(large.status, 400);
});

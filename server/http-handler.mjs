import { seed, applyAction, projectState, searchArticles, analyseDescription } from './domain.mjs';

const json = (res, code, value) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
};
async function body(req, limit) {
  if (req.body !== undefined) {
    const text = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(text) > limit) throw new Error('Запрос слишком большой');
    return typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(text);
  }
  const parts = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('Запрос слишком большой');
    parts.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw new Error('Не удалось прочитать JSON запроса'); }
}

export function createHandler(store, { storage = 'sqlite', cloud = false, documentMaxBytes = 8 * 1024 * 1024 } = {}) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health') {
        await store.read();
        return json(res, 200, { ok: true, storage, documentMaxBytes });
      }
      if (req.method === 'GET' && url.pathname === '/api/catalog') {
        const state = await store.read();
        return json(res, 200, { employees: state.employees.map(e => ({ id: e.id, name: e.name, role: e.role })), templates: state.templates.map(t => ({ id: t.id, name: t.name })) });
      }
      if (req.method === 'GET' && url.pathname === '/api/state') {
        const role = url.searchParams.get('role');
        if (!['hr', 'mentor', 'employee'].includes(role)) throw new Error('Выберите роль');
        return json(res, 200, projectState(await store.read(), role, url.searchParams.get('employeeId')));
      }
      if (req.method === 'GET' && url.pathname === '/api/search') {
        const state = await store.read();
        const employee = state.employees.find(e => e.id === url.searchParams.get('employeeId'));
        if (!employee) throw new Error('Сотрудник не найден');
        const template = state.templates.find(t => t.id === employee.templateId);
        return json(res, 200, searchArticles(state, (url.searchParams.get('q') || '').slice(0, 4000), template.track));
      }
      if (req.method === 'POST' && url.pathname === '/api/action') {
        const input = await body(req, 200000);
        if (!['hr', 'mentor', 'employee'].includes(input.role)) throw new Error('Выберите роль');
        return json(res, 200, await store.mutate(state => applyAction(state, input.action, input.payload, input.role)));
      }
      if (req.method === 'POST' && url.pathname === '/api/analyse') {
        const input = await body(req, 200000);
        return json(res, 200, analyseDescription(input.text));
      }
      if (req.method === 'POST' && url.pathname === '/api/document') {
        const input = await body(req, Math.ceil(documentMaxBytes * 4 / 3) + 2000);
        if (typeof input.filename !== 'string' || typeof input.base64 !== 'string') throw new Error('Выберите документ');
        const file = Buffer.from(input.base64, 'base64');
        if (file.length > documentMaxBytes) throw new Error(`До ${documentMaxBytes / 1024 / 1024} МБ на файл`);
        const { extractDocument } = await import('./documents.mjs');
        return json(res, 200, await extractDocument(file, input.filename.slice(0, 200)));
      }
      if (req.method === 'POST' && url.pathname === '/api/reset') {
        const input = await body(req, 1000);
        if (input.confirm !== 'reset-demo') throw new Error('Подтвердите сброс демо');
        await store.mutate(state => {
          for (const key of Object.keys(state)) delete state[key];
          Object.assign(state, seed());
        });
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'Маршрут не найден' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка запроса';
      const infrastructure = /DATABASE_URL|Cloud database|fetch failed|database|connection|timeout|relation .*does not exist|ECONN|ENOTFOUND|authentication|password/i.test(message) || error?.name === 'TimeoutError';
      if (cloud && infrastructure) return json(res, 503, { error: 'Хранилище временно недоступно. Повторите действие позже.' });
      return json(res, error?.statusCode || 400, { error: message.length > 300 ? 'Не удалось обработать запрос. Проверьте данные и формат документа.' : message });
    }
  };
}

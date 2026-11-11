import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed, applyAction, projectState, searchArticles, analyseDescription } from './domain.mjs';
import { extractDocument } from './documents.mjs';

const folder=resolve(dirname(fileURLToPath(import.meta.url)),'../data');mkdirSync(folder,{recursive:true});
const db=new DatabaseSync(resolve(folder,'novichok.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL)');
const read=()=>JSON.parse(db.prepare('SELECT value FROM app_state WHERE id=1').get().value);
const write=s=>db.prepare('INSERT INTO app_state (id,value) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(JSON.stringify(s));
if(!db.prepare('SELECT id FROM app_state WHERE id=1').get())write(seed());
const json=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
async function body(req,limit=12*1024*1024){const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Запрос слишком большой');parts.push(chunk);}try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw new Error('Не удалось прочитать JSON запроса');}}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true,storage:'sqlite'});
    if(req.method==='GET'&&url.pathname==='/api/catalog'){const s=read();return json(res,200,{employees:s.employees.map(e=>({id:e.id,name:e.name,role:e.role})),templates:s.templates.map(t=>({id:t.id,name:t.name}))});}
    if(req.method==='GET'&&url.pathname==='/api/state'){const role=url.searchParams.get('role');if(!['hr','mentor','employee'].includes(role))throw new Error('Выберите роль');return json(res,200,projectState(read(),role,url.searchParams.get('employeeId')));}
    if(req.method==='GET'&&url.pathname==='/api/search'){const s=read();const e=s.employees.find(e=>e.id===url.searchParams.get('employeeId'));if(!e)throw new Error('Сотрудник не найден');const t=s.templates.find(t=>t.id===e.templateId);return json(res,200,searchArticles(s,(url.searchParams.get('q')||'').slice(0,4000),t.track));}
    if(req.method==='POST'&&url.pathname==='/api/action'){const input=await body(req);if(!['hr','mentor','employee'].includes(input.role))throw new Error('Выберите роль');const s=read();const result=applyAction(s,input.action,input.payload,input.role);write(s);return json(res,200,{result,revision:s.revision});}
    if(req.method==='POST'&&url.pathname==='/api/analyse'){const input=await body(req,200000);return json(res,200,analyseDescription(input.text));}
    if(req.method==='POST'&&url.pathname==='/api/document'){const input=await body(req);if(typeof input.filename!=='string'||typeof input.base64!=='string')throw new Error('Выберите документ');const result=await extractDocument(Buffer.from(input.base64,'base64'),input.filename.slice(0,200));return json(res,200,result);}
    if(req.method==='POST'&&url.pathname==='/api/reset'){const input=await body(req,1000);if(input.confirm!=='reset-demo')throw new Error('Подтвердите сброс демо');write(seed());return json(res,200,{ok:true});}
    json(res,404,{error:'Маршрут не найден'});
  }catch(error){const message=error instanceof Error?error.message:'Ошибка запроса';json(res,400,{error:message.length>300?'Не удалось обработать документ. Проверьте формат, отсутствие пароля и целостность файла.':message});}
});
const port=Number(process.env.API_PORT||4310);server.listen(port,'127.0.0.1',()=>console.log(`API ready http://127.0.0.1:${port}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));

import { randomUUID } from 'node:crypto';

export const day = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const now = () => new Date().toISOString();
const id = () => randomUUID();
const themes = {
  warehouse: { name: 'Склад', role: 'Комплектовщик', mentor: 'Денис Левин', goal: 'Собрать учебный заказ под наблюдением наставника', task: 'Разобрать сборку первого заказа', tool: 'ТСД', question: 'Есть личный доступ к ТСД для учебного заказа?' },
  store: { name: 'Магазин', role: 'Продавец-консультант', mentor: 'Анна Белова', goal: 'Провести первую консультацию вместе с наставником', task: 'Разобрать первую консультацию', tool: 'кассе', question: 'Понятно, как получить помощь во время консультации?' },
  sales: { name: 'Продажи', role: 'Менеджер продаж', mentor: 'Сергей Волков', goal: 'Подготовить первое учебное предложение и согласовать его', task: 'Подготовить первое предложение', tool: 'CRM', question: 'Понятно, кто согласует ваше первое предложение?' },
  office: { name: 'Офис и e-commerce', role: 'Аналитик маркетплейсов', mentor: 'Анна Белова', goal: 'Разобрать первый отчёт вместе с наставником', task: 'Разобрать первый отчёт', tool: 'рабочим данным', question: 'Есть доступ к данным для первого отчёта?' },
};
export const sources = [
  { title: 'Bauer и соавторы: метаанализ адаптации', url: 'https://doi.org/10.1177/01492063241277168', detail: 'Ясность роли, освоение задач и включённость в команду. Темы наших вопросов опираются на исследование; сами вопросы не являются валидированной шкалой.' },
  { title: 'NFI: обратная связь и исправление препятствий', url: 'https://www.confirm.com/blog/nfi', detail: 'Пилот на 14 площадках помог обнаружить пропуски ориентации и проверить исправления. Кейс поставщика, без контрольного сравнения.' },
  { title: 'Microsoft Research: удалённая адаптация', url: 'https://www.microsoft.com/en-us/research/articles/advice-for-remote-onboarding-of-new-hires/', detail: 'Наставник, доступная документация и небольшая первая задача. Перенос на другие профессии требует проверки.' },
  { title: 'Goodsports: направления и вакансии', url: 'https://goodsports.by/rabota-u-nas', detail: 'Основание для выбора склада, магазина, продаж, офиса и e-commerce. Проблемы в демо вымышлены.' },
];

export function buildTemplate(track, format = 'onsite', title) {
  const t = themes[track] || themes.office;
  return { id: id(), name: title || `${t.role} · ${format === 'remote' ? 'удалённо' : format === 'hybrid' ? 'гибридно' : 'на площадке'}`, track, format, version: 1, goal: t.goal, mentor: t.mentor,
    steps: [
      { id: id(), title: format === 'remote' ? 'Познакомиться с командой онлайн' : format === 'hybrid' ? 'Согласовать знакомство с командой и первый выход' : 'Познакомиться с командой и площадкой', detail: 'Уточните, кто помогает по рабочим вопросам и как с ним связаться.', stage: 'Старт', basis: 'Microsoft Research / поддержка коллег' },
      { id: id(), title: `Проверить доступ к ${t.tool}`, detail: 'Проверьте личный доступ с наставником. Если что-то не открывается, сообщите об этом.', stage: 'Старт', basis: 'Контекст должности · предложенный шаг' },
      { id: id(), title: t.task, detail: `${t.goal}. ${track==='warehouse'?'Критерий результата и безопасный порядок работы':'Критерий результата и порядок выполнения'} уточните с наставником.`, stage: 'Первая задача', basis: 'Microsoft Research / первая практическая задача' },
    ],
    questions: [{ id: id(), text: t.question, basis: 'Освоение задач · контекст роли' }, { id: id(), text: 'Понятен результат вашей ближайшей задачи?', basis: 'Bauer и соавторы / ясность роли' }, { id: id(), text: format === 'remote' ? 'Есть контакт коллеги, которому можно задать рабочий вопрос онлайн?' : 'Знаете, к кому обратиться за помощью во время работы?', basis: 'Bauer и соавторы / поддержка коллег' }], source: '', notes: '', experience: 'Уточнить', approved: true };
}

export function seed() {
  const templates = Object.keys(themes).map(track => buildTemplate(track, track === 'office' ? 'remote' : 'onsite'));
  const names = ['Илья Орлов', 'Марина Котова', 'Олег Миронов', 'Алина Соколова', 'Павел Лисов', 'Вера Морозова', 'Никита Крылов', 'Дарья Власова'];
  const employees = names.map((name, i) => {
    const t = templates[i % 4];
    return { id: id(), name, role: themes[t.track].role, templateId: t.id, day: [7, 3, 30, 7, 1, 14, 60, 90][i], startDate: new Date(Date.parse(day()) - ([7, 3, 30, 7, 1, 14, 60, 90][i] - 1) * 86400000).toISOString().slice(0, 10), mentor: t.mentor, hr: 'Елена · HR', completed: i===3?[t.steps[0].id,t.steps[1].id]:i < 4 ? [t.steps[0].id] : [], checkins: [] };
  });
  const entries = [
    ['warehouse', 'Как получить личный доступ к ТСД?', 'Если доступа нет, сообщите наставнику Денису. Он уточнит выдачу у администратора. Не используйте учётную запись другого сотрудника.', 'тсд доступ логин учетная запись терминал пароль'],
    ['warehouse', 'Не получается собрать первый заказ', 'Попросите наставника ещё раз показать операцию и вместе пройти учебный пример. Не отмечайте самостоятельное выполнение, пока не разобрались с порядком работы.', 'заказ сборка собрать операция обучение'],
    ['store', 'К кому обратиться со сложным вопросом покупателя?', 'Пригласите наставника или старшего смены. Условия продажи и возврата уточняйте по утверждённому регламенту, не обещайте покупателю непроверенные условия.', 'покупатель возврат консультация клиент'],
    ['store', 'Неясен график ближайших смен', 'Сверьте актуальный график с руководителем магазина. Если он отличается от согласованного при найме, можно обсудить это напрямую с HR.', 'график смена смены расписание'],
    ['sales', 'Кто согласует первое предложение?', 'В учебном маршруте первое предложение разбирается с наставником Сергеем. До отправки клиенту уточните у него порядок согласования и действующие условия.', 'предложение согласовать согласование скидка клиент'],
    ['office', 'Не открывается таблица или кабинет маркетплейса', 'Проверьте, что вошли под рабочей учётной записью. Если доступа всё ещё нет, передайте наставнику название сервиса и текст ошибки. Пароль отправлять не нужно.', 'таблица остатки доступ кабинет данные отчет отчёт маркетплейс'],
    ['all', 'Как уточнить расчёт первой зарплаты или премии?', 'Точный расчёт объяснит HR или уполномоченный специалист. Сверьте его с согласованными условиями; если остаётся вопрос, передайте его напрямую HR.', 'зарплата премия оплата деньги расчет расчёт условия'],
    ['all', 'Можно ли задать вопрос без руководителя?', 'Да. При отправке выберите «Напрямую HR». Вопрос попадёт в отдельную очередь HR. В этой локальной демонстрации переключатель ролей открыт для проверки и не является настоящей авторизацией.', 'руководитель конфликт hr кадры лично отношения'],
  ];
  const articles = entries.map(([track, title, answer, keywords]) => ({ id: id(), track, title, answer, keywords, status: 'published', updatedAt: now(), helpful: 0, notHelpful: 0, source: 'Учебный пример · подтверждён в демо HR', sourceRequestId: null }));
  const request = (employee, category, text, recipient) => ({ id: id(), employeeId: employee.id, category, text, recipient, status: 'new', createdAt: now(), updatedAt: now(), action: '', owner: '', due: '', messages: [{ id: id(), author: employee.name, text, at: now() }], triedArticleIds: [], linkedArticleId: null });
  const requests = [request(employees[0], 'Доступы и инструменты', 'После показа могу собирать заказ, но личного доступа к ТСД пока нет.', 'mentor'), request(employees[2], 'Условия работы', 'Хочу уточнить, как считается премия в первый месяц.', 'hr')];
  Object.assign(requests[1],{status:'progress',action:'Сверить согласованные условия и разобрать расчёт первого месяца вместе с сотрудником',owner:'Елена · HR',due:day()});
  return { revision: 1, templates, employees, articles, requests, inquiries: [], sources };
}

export function text(value, name, limit = 4000, required = true) {
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > limit) throw new Error(`Проверьте поле «${name}» (до ${limit} символов)`);
  return value.trim();
}
const find = (items, key, label) => { const item = items.find(x => x.id === key); if (!item) throw new Error(`${label} не найден`); return item; };
const requireRole = (role, allowed) => { if (!allowed.includes(role)) throw new Error('Действие недоступно в выбранной роли'); };
const enumValue = (v, values, label) => { if (!values.includes(v)) throw new Error(`Проверьте ${label}`); return v; };
const validDate = v => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0,10) !== v) throw new Error('Проверьте дату'); return v; };
const normal = s => s.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(x => x.length > 2).map(x => x.length > 5 ? x.slice(0, -2) : x);

export function searchArticles(state, query, track) {
  const tokens = normal(query); if (!tokens.length) return [];
  return state.articles.filter(a => a.status === 'published' && (a.track === track || a.track === 'all')).map(a => {
    const words = normal(`${a.title} ${a.keywords}`);
    return { ...a, score: tokens.reduce((n, token) => n + (words.some(w => w.startsWith(token) || token.startsWith(w)) ? 1 : 0), 0) };
  }).filter(a => a.score > 0).sort((a,b) => b.score - a.score).slice(0, 3);
}

export function analyseDescription(raw) {
  const source = text(raw, 'Описание работы', 40000); const lower = source.toLowerCase();
  const track = /склад|комплектов|кладов|при[её]мк|\bwms\b|тсд/.test(lower) ? 'warehouse' : /магазин|продавец|касс/.test(lower) ? 'store' : /продаж|тендер/.test(lower) && !/аналитик/.test(lower) ? 'sales' : 'office';
  const format = /гибрид/.test(lower) ? 'hybrid' : /удал[её]н|дистанцион/.test(lower) ? 'remote' : /на площадке|на складе|работа в офисе|работа в магазине|офисный формат/.test(lower) ? 'onsite' : 'unknown';
  const t = buildTemplate(track, format); t.source = source; t.approved = false;
  t.experience = /без опыта/.test(lower) ? 'Без опыта' : /опыт\s+(?:от\s+)?[1-9]|опыт[а-я\s]{0,20}[1-9]\s*(?:лет|год)/.test(lower) ? 'Требования к опыту указаны — проверьте' : 'Уточнить';
  const sentences = source.split(/[\n.!?]+/).map(s => s.trim()).filter(Boolean);
  const quote = sentences.find(s => /таблиц|отч[её]т|данны|сборк|заказ|консульт|crm|тсд|wms|доступ/i.test(s)) || sentences[0];
  t.steps = t.steps.map((s, i) => ({ ...s, basis: i > 0 ? `Из описания: «${quote.slice(0, 240)}» · предложенный шаг, проверьте` : s.basis }));
  t.notes = [format === 'unknown' ? 'Формат работы не указан. Выберите его перед назначением.' : '', 'Уточните первую рабочую задачу, доступы и ответственного. Вакансия не заменяет внутренний регламент.'].filter(Boolean).join(' ');
  return t;
}

export function applyAction(state, action, p, role) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('Некорректные данные');
  let result = null;
  switch (action) {
    case 'createEmployee': {
      requireRole(role, ['hr']); const t = find(state.templates, p.templateId, 'Маршрут'); if (!t.approved || t.format === 'unknown') throw new Error('Сначала подтвердите маршрут и формат');
      if(p.key){text(p.key,'Ключ создания',100);const existing=state.employees.find(e=>e.creationKey===p.key);if(existing){result=existing;break;}}
      const startDate = validDate(p.startDate); const elapsed = Math.floor((Date.parse(day()) - Date.parse(startDate)) / 86400000) + 1;
      result = { id: id(), name: text(p.name, 'Имя', 100), role: text(p.job || t.name.split(' · ')[0], 'Должность', 120), templateId: t.id, startDate, day: Math.max(0, elapsed), mentor: text(p.mentor || t.mentor, 'Наставник', 100), hr: 'Елена · HR', completed: [], checkins: [] };
      if(p.key)result.creationKey=p.key;state.employees.push(result); break;
    }
    case 'saveTemplate': {
      requireRole(role, ['hr']); const track = enumValue(p.track, Object.keys(themes), 'направление'); const format = enumValue(p.format, ['onsite','remote','hybrid'], 'формат работы');
      const existing = p.id ? find(state.templates,p.id,'Маршрут') : undefined;
      const cleanItems = (items, field) => { if (!Array.isArray(items) || items.length < 1 || items.length > 12) throw new Error('Нужно от 1 до 12 шагов / вопросов'); return items.map(s => ({ id: s.id && existing?.[field].some(x => x.id === s.id && (field==='steps' ? x.title === s.title?.trim() && x.detail === (s.detail||'').trim() : x.text === s.text?.trim())) ? s.id : id(), ...(field === 'steps' ? {title: text(s.title,'Название шага',240), detail:text(s.detail || '', 'Описание', 2000, false), stage:text(s.stage || 'Первая задача','Этап',60)} : {text:text(s.text,'Вопрос',400)}), basis:text(s.basis || 'Предложено HR', 'Основание',1000) })); };
      result = { id: existing?.id || id(), name:text(p.name,'Название маршрута',160), track, format, version: (existing?.version || 0) + 1, goal:text(p.goal,'Результат',500), mentor:text(p.mentor,'Наставник',100), steps:cleanItems(p.steps,'steps'), questions:cleanItems(p.questions,'questions'), source:text(p.source || '', 'Исходное описание',40000,false), notes:text(p.notes || '', 'Примечание',2000,false), experience:text(p.experience || 'Уточнить','Опыт',150), approved:true };
      if(existing){state.templates[state.templates.indexOf(existing)]=result;for(const employee of state.employees.filter(e=>e.templateId===result.id))employee.completed=employee.completed.filter(stepId=>result.steps.some(s=>s.id===stepId));}else state.templates.push(result); break;
    }
    case 'completeStep': {
      requireRole(role, ['employee']); const e=find(state.employees,p.employeeId,'Сотрудник'); const t=find(state.templates,e.templateId,'Маршрут'); find(t.steps,p.stepId,'Шаг');
      e.completed = p.done ? [...new Set([...e.completed,p.stepId])] : e.completed.filter(x=>x!==p.stepId); result=e; break;
    }
    case 'checkin': {
      requireRole(role,['employee']); const e=find(state.employees,p.employeeId,'Сотрудник'); const t=find(state.templates,e.templateId,'Маршрут');
      if(!Array.isArray(p.answers)||p.answers.length!==t.questions.length) throw new Error('Ответьте на все вопросы');
      if(new Set(p.answers.map(a=>a.questionId)).size!==t.questions.length) throw new Error('Вопросы не должны повторяться');
      const answers=p.answers.map(a=>({questionId:find(t.questions,a.questionId,'Вопрос').id,question:find(t.questions,a.questionId,'Вопрос').text,value:enumValue(a.value,['yes','partial','no','notyet','irrelevant'],'ответ')}));
      if(e.checkins.some(c=>c.key===p.key)) { result=e.checkins.find(c=>c.key===p.key); break; }
      result={id:id(),key:text(p.key,'Ключ отправки',100),at:now(),answers,comment:text(p.comment||'','Комментарий',2000,false),stage:text(p.stage||'Текущий этап','Этап',100)};e.checkins.push(result); break;
    }
    case 'ask': {
      requireRole(role,['employee']); const e=find(state.employees,p.employeeId,'Сотрудник');
      const key=text(p.key,'Ключ отправки',100); const duplicate=state.inquiries.find(i=>i.key===key&&i.employeeId===e.id); if(duplicate){result=state.requests.find(r=>r.id===duplicate.requestId)||duplicate;break;}
      const question=text(p.text,'Вопрос',4000); const recipient=enumValue(p.recipient,['mentor','hr'],'адресата'); const category=text(p.category||'Рабочий вопрос','Тема',100);
      const template=find(state.templates,e.templateId,'Маршрут');
      const triedArticleIds=Array.isArray(p.triedArticleIds)?p.triedArticleIds.slice(0,3).map(x=>{const article=find(state.articles,x,'Ответ');if(article.status!=='published'||![template.track,'all'].includes(article.track))throw new Error('Готовый ответ изменился. Найдите актуальный ответ перед отправкой.');return article.id;}):[];
      result={id:id(),employeeId:e.id,category,text:question,recipient,status:'new',createdAt:now(),updatedAt:now(),action:'',owner:'',due:'',messages:[{id:id(),author:e.name,text:question,at:now()}],triedArticleIds,linkedArticleId:null};state.requests.unshift(result);
      state.inquiries.push({id:id(),key,employeeId:e.id,question,articleId:triedArticleIds[0]||null,outcome:'escalated',requestId:result.id,at:now()}); break;
    }
    case 'articleFeedback': {
      requireRole(role,['employee']);const e=find(state.employees,p.employeeId,'Сотрудник');const a=find(state.articles,p.articleId,'Ответ');const t=find(state.templates,e.templateId,'Маршрут');
      if(a.status!=='published'||![t.track,'all'].includes(a.track))throw new Error('Ответ недоступен'); const key=text(p.key,'Ключ отправки',100);if(state.inquiries.some(i=>i.key===key&&i.employeeId===e.id))break;
      if(typeof p.helpful!=='boolean')throw new Error('Выберите результат');a[p.helpful?'helpful':'notHelpful']++;
      result={id:id(),key,employeeId:e.id,question:text(p.question||a.title,'Вопрос',4000),articleId:a.id,outcome:p.helpful?'helped':'not_helped',at:now()};state.inquiries.push(result);break;
    }
    case 'requestMessage': {
      const r=find(state.requests,p.requestId,'Обращение');const e=find(state.employees,r.employeeId,'Сотрудник');
      if(role==='employee'&&p.employeeId!==e.id)throw new Error('Обращение другого сотрудника');if(role==='mentor'&&r.recipient==='hr')throw new Error('Вопрос адресован HR');
      if(!['employee','hr','mentor'].includes(role))throw new Error('Неверная роль');
      r.messages.push({id:id(),author:role==='employee'?e.name:role==='hr'?'Елена · HR':e.mentor,text:text(p.text,'Сообщение',4000),at:now()});r.updatedAt=now();result=r;break;
    }
    case 'updateRequest': {
      requireRole(role,['hr','mentor']); const r=find(state.requests,p.requestId,'Обращение');if(role==='mentor'&&r.recipient==='hr')throw new Error('Вопрос адресован HR');if(r.status==='resolved')throw new Error('Решение уже подтверждено');
      r.action=text(p.action,'Следующее действие',2000);r.owner=text(p.owner,'Ответственный',100);r.due=validDate(p.due);r.status=enumValue(p.status,['progress','waiting'],'статус');r.updatedAt=now();
      r.messages.push({id:id(),author:role==='hr'?'Елена · HR':r.owner,text:r.status==='waiting'?`Действие выполнено: ${r.action}. Получилось решить вопрос?`:`Договорились: ${r.action}. Ответственный: ${r.owner}. Срок: ${r.due}.`,at:now()});result=r;break;
    }
    case 'confirmRequest': {
      requireRole(role,['employee']);const r=find(state.requests,p.requestId,'Обращение');if(r.employeeId!==p.employeeId)throw new Error('Обращение другого сотрудника');if(r.status!=='waiting')throw new Error('Пока нет результата для подтверждения');if(typeof p.helpful!=='boolean')throw new Error('Выберите результат');
      r.status=p.helpful?'resolved':'progress';r.updatedAt=now();r.messages.push({id:id(),author:find(state.employees,r.employeeId,'Сотрудник').name,text:p.helpful?'Да, помогло. Вопрос решён.':'Проблема осталась. Нужна дополнительная помощь.',at:now()});result=r;break;
    }
    case 'saveArticle': {
      requireRole(role,['hr']);const existing=p.id&&state.articles.find(a=>a.id===p.id);const track=enumValue(p.track,['all',...Object.keys(themes)],'направление');const status=enumValue(p.status,['draft','published'],'статус ответа');
      if(status==='published'&&p.reviewed!==true)throw new Error('Подтвердите проверку и отсутствие личных сведений');
      const r=p.sourceRequestId?find(state.requests,p.sourceRequestId,'Обращение'):null;
      result={id:existing?.id||id(),track,title:text(p.title,'Заголовок',200),answer:text(p.answer,'Ответ',6000),keywords:text(p.keywords||'','Ключевые слова',500,false),status,helpful:existing?.helpful||0,notHelpful:existing?.notHelpful||0,updatedAt:now(),source:status==='published'?'Проверено HR в демо':'Черновик HR',sourceRequestId:r?.id||existing?.sourceRequestId||null};
      if(existing)state.articles[state.articles.indexOf(existing)]=result;else state.articles.unshift(result);if(r)r.linkedArticleId=result.id;break;
    }
    default: throw new Error('Неизвестное действие');
  }
  state.revision++;return result;
}

export function projectState(state, role, employeeId) {
  const copy=structuredClone(state);if(role==='mentor') {
    const privateIds=new Set(copy.requests.filter(r=>r.recipient==='hr').map(r=>r.id));
    copy.requests=copy.requests.filter(r=>r.recipient!=='hr');
    copy.inquiries=copy.inquiries.filter(i=>!privateIds.has(i.requestId)).map(i=>({...i,question:''}));
    copy.articles=copy.articles.filter(a=>a.status==='published');
  }
  if(role==='employee') {find(copy.employees,employeeId,'Сотрудник');copy.employees=copy.employees.filter(e=>e.id===employeeId);copy.requests=copy.requests.filter(r=>r.employeeId===employeeId);copy.inquiries=copy.inquiries.filter(i=>i.employeeId===employeeId);copy.articles=copy.articles.filter(a=>a.status==='published');}
  return copy;
}

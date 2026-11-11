import WordExtractor from 'word-extractor';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function extractDocument(buffer, filename) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > 8 * 1024 * 1024) throw new Error('Файл должен быть непустым и не больше 8 МБ');
  const ext = filename.toLowerCase().split('.').at(-1);
  let result = '';
  if (ext === 'pdf') {
    if (!buffer.subarray(0,1024).includes(Buffer.from('%PDF-'))) throw new Error('Содержимое не похоже на PDF');
    const doc = await getDocument({data:new Uint8Array(buffer),useSystemFonts:true,isEvalSupported:false}).promise;
    try {
      if (doc.numPages > 40) throw new Error('До 40 страниц на один документ');
      const pages=[];for(let n=1;n<=doc.numPages;n++){const page=await doc.getPage(n);const content=await page.getTextContent();pages.push(content.items.map(item=>'str' in item?item.str:'').join(' '));} result=pages.join('\n\n');
    } finally { await doc.destroy(); }
  } else if (ext === 'doc' || ext === 'docx') {
    const ole=buffer.subarray(0,8).toString('hex')==='d0cf11e0a1b11ae1';const zip=buffer[0]===0x50&&buffer[1]===0x4b;
    if ((ext==='doc'&&!ole)||(ext==='docx'&&!zip)) throw new Error('Формат содержимого не соответствует расширению Word');
    const doc=await new WordExtractor().extract(buffer);result=doc.getBody();
  } else if (ext==='txt') result=buffer.toString('utf8');
  else throw new Error('Поддерживаются PDF, DOC, DOCX и TXT');
  result=result.replace(/\u0000/g,'').trim();
  if(result.replace(/\s/g,'').length<10) throw new Error('Текст не найден. Возможно, это скан. OCR не включён: загрузите текстовый PDF, Word или вставьте текст.');
  if(result.length>40000) throw new Error('Слишком много текста: до 40 000 символов');
  return {text:result,filename,characters:result.length};
}

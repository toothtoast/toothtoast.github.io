import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const config = JSON.parse(await readFile(path.join(root, 'deployment.json'), 'utf8'));
const maxBytes = 5 * 1024 * 1024;

export function validateHTML(html) {
  if (Buffer.byteLength(html) > maxBytes || html.length < 10000 ||
      !/^<!doctype html>/i.test(html.trimStart()) ||
      !html.includes('id="authView"') || !html.includes('id="gameView"') ||
      !html.includes('API=' + JSON.stringify(config.backendOrigin)) ||
      html.includes('API=location.origin')) {
    throw new Error('上游网页校验失败；保留当前版本，不发布错误页面。');
  }
}

async function download(name, html = false) {
  // Cloudflare redirects /index.html to /; fetch the canonical route directly.
  const url = new URL(name === 'index.html' ? '/' : '/' + name, config.sourceOrigin);
  url.searchParams.set('pages-sync', String(Date.now()));
  const response = await fetch(url, {
    headers: { Accept: html ? 'text/html' : 'text/plain', 'Cache-Control': 'no-cache' },
    redirect: 'error', signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error('同步 ' + name + ' 失败，HTTP ' + response.status);
  if (html && !/^text\/html\b/i.test(response.headers.get('Content-Type') || '')) {
    throw new Error('上游未返回 HTML；保留当前版本。');
  }
  if (Number(response.headers.get('Content-Length')) > maxBytes) throw new Error('上游文件过大。');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > maxBytes) { await response.body.cancel().catch(() => {}); throw new Error('上游文件过大。'); }
    chunks.push(chunk);
  }
  let text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  // Do not copy Cloudflare's host-specific analytics injection into a different host.
  if (html) text = text.replace(/<script\b[^>]*\bsrc=["']https:\/\/static\.cloudflareinsights\.com\/[^"']+["'][^>]*>[\s\S]*?<\/script>\s*/gi, '').trimEnd() + '\n';
  if (html) validateHTML(text);
  else if (!text.trim() || /<!doctype|<html/i.test(text)) throw new Error('第三方声明不是有效文本。');
  return text;
}

export async function sync() {
  // Only the already-public frontend and its notices are mirrored. No source-repo token is needed.
  const names = ['index.html', 'THIRD_PARTY_NOTICES.txt'];
  const contents = await Promise.all(names.map(name => download(name, name === 'index.html')));
  let changed = false;
  for (let i = 0; i < names.length; i++) {
    const target = path.join(root, names[i]);
    const current = await readFile(target, 'utf8').catch(() => '');
    if (current !== contents[i]) { await writeFile(target, contents[i]); changed = true; }
  }
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, 'changed=' + changed + '\n');
  console.log(changed ? '已同步最新公开前端。' : '前端版本未变化，无需重新发布。');
  return changed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  sync().catch(error => { console.error(error.message); process.exitCode = 1; });
}

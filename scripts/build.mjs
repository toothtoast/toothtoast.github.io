import { readFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { root, validateHTML } from './sync.mjs';

validateHTML(await readFile(path.join(root, 'index.html'), 'utf8'));
const out = path.join(root, '_site');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'THIRD_PARTY_NOTICES.txt', '.nojekyll']) {
  await cp(path.join(root, name), path.join(out, name));
}
console.log('GitHub Pages 静态网页已构建。');

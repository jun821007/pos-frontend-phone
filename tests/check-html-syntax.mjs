import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.lastIndexOf('<script>');
const end = html.lastIndexOf('</script>');
const app = html.slice(start + '<script>'.length, end);
const out = fileURLToPath(new URL('./_syntax-tmp.js', import.meta.url));
fs.writeFileSync(out, app);
const res = spawnSync(process.execPath, ['--check', out], { encoding: 'utf8' });
fs.unlinkSync(out);
if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(res.status || 1);
}
console.log('index.html script syntax ok');

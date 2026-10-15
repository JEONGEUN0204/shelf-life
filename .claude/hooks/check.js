// Stop hook: 변경된 TS/JS 코드가 있으면 tsc + expo lint를 돌리고, 실패하면 exit 2로 멈춤을 막아 고치게 한다.
// 같은 변경 내용은 한 번 통과하면 다시 검사하지 않는다 (.last-check에 해시 저장).
const { execFileSync, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const stampFile = path.join(__dirname, '.last-check');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {}
if (input.stop_hook_active) process.exit(0);

// shell(cmd.exe)을 거치지 않도록 실행 파일을 직접 호출한다.
const status = execFileSync('git', ['status', '--porcelain', '-uall'], { cwd: root, encoding: 'utf8' });
const files = status
  .split('\n')
  .filter(Boolean)
  .map((line) => line.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''))
  .filter((f) => /\.(tsx?|jsx?)$/.test(f) && !f.startsWith('.claude/'))
  .sort();
if (files.length === 0) process.exit(0);

const hash = crypto.createHash('sha1');
for (const f of files) {
  hash.update(f);
  const abs = path.join(root, f);
  if (fs.existsSync(abs)) hash.update(fs.readFileSync(abs));
}
const digest = hash.digest('hex');
try {
  if (fs.readFileSync(stampFile, 'utf8').trim() === digest) process.exit(0);
} catch {}

const failures = [];
const checks = [
  ['npx tsc --noEmit', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['npx expo lint', ['node_modules/expo/bin/cli', 'lint']],
];
for (const [label, args] of checks) {
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) {
    const out = `${r.stdout || ''}${r.stderr || ''}${r.error ? r.error.message : ''}`.trim();
    failures.push(`$ ${label}\n${out.slice(-3000)}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`코드 검사 실패 — 고친 뒤 마무리하세요.\n\n${failures.join('\n\n')}\n`);
  process.exit(2);
}
fs.writeFileSync(stampFile, digest);

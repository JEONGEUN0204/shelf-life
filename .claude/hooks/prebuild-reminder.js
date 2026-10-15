// PostToolUse hook: app.json이나 assets/를 수정하면 prebuild가 필요하다고 알린다.
// android/가 이미 있으면 expo run:android는 config plugin을 다시 적용하지 않는다.
const fs = require('node:fs');
const path = require('node:path');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {}
const root = path.resolve(__dirname, '..', '..');
const filePath = String(input.tool_input?.file_path || '');
if (!filePath) process.exit(0);

const rel = path.relative(root, path.resolve(root, filePath)).split(path.sep).join('/');
if (rel === 'app.json' || rel.startsWith('assets/')) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `${rel}이(가) 바뀌었습니다. android/가 이미 있어서 expo run:android만으로는 반영되지 않습니다. 앱에서 확인하기 전에 \`npx expo prebuild --platform android --no-install\` 후 다시 빌드하세요.`,
      },
    }),
  );
}

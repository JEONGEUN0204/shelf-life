// PreToolUse hook: CI=1로 Metro(expo start)를 띄우는 명령을 막는다. CI 모드는 파일 감시를 꺼서 수정이 앱에 반영되지 않는다.
const fs = require('node:fs');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {}
const command = String(input.tool_input?.command || '');

const setsCi = /\bCI=(1|true)\b|\$env:CI\s*=/i.test(command);
if (setsCi && /expo\s+start/.test(command)) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'CI=1은 Metro 파일 감시를 꺼서 수정 사항이 앱에 반영되지 않습니다. CI 없이 `npx expo start --dev-client --port 8081 < /dev/null`로 실행하세요.',
      },
    }),
  );
}

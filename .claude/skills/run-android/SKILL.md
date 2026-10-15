---
name: run-android
description: shelf-life 앱을 로컬 Android 에뮬레이터에서 dev build로 띄우고 스크린샷으로 확인한다. "앱 띄워줘", "에뮬레이터로 확인", "실행해봐", 수정 사항을 실제 화면으로 보여줘야 할 때 사용.
---

# Android 에뮬레이터에서 앱 실행

이 앱은 expo-notifications 때문에 Expo Go로 실행할 수 없다. 반드시 dev build(`expo-dev-client`)를 쓴다.
`JAVA_HOME`(JDK 17), `ANDROID_HOME`, `MSYS_NO_PATHCONV=1`은 `.claude/settings.local.json`의 env로 이미 설정되어 있다.
명령은 Bash(Git Bash)로 실행한다.

```bash
ADB="$ANDROID_HOME/platform-tools/adb.exe"
EMULATOR="$ANDROID_HOME/emulator/emulator.exe"
```

## 1. 에뮬레이터

- `"$ADB" devices`에 `emulator-5554 device`가 있으면 넘어간다.
- 없으면 `"$EMULATOR" -avd Pixel_API_36 -no-snapshot-save`를 `run_in_background`로 실행하고, 부팅이 끝날 때까지 기다린다:
  `timeout 180 bash -c 'until [ "$("$0" shell getprop sys.boot_completed 2>/dev/null | tr -d "\r")" = 1 ]; do sleep 3; done' "$ADB"`

## 2. 네이티브 변경이 있으면 다시 빌드

새 네이티브 라이브러리를 추가했거나 `app.json`의 plugins, 아이콘, 스플래시, 폰트를 바꿨거나, 앱이 아직 설치되지 않았다면 다시 빌드한다.

1. `npx expo prebuild --platform android --no-install`
   - `android/`가 이미 있어서 이 단계 없이는 config plugin 변경이 반영되지 않는다.
2. `npx expo run:android --no-bundler`를 `run_in_background`로 실행하고 완료 알림을 기다린다.
   - `--port`는 붙이지 않는다. 붙이면 빌드가 조용히 실패한다.

JS나 TS만 바꿨다면 이 단계를 건너뛴다.

## 3. Metro (항상 8081)

1. 이미 떠 있는지 확인한다: `curl -s localhost:8081/status`
   - `packager-status:running`이면 그대로 쓴다.
   - 8081을 다른 프로세스가 잡고 있는데 응답이 이상하면, PowerShell `Get-NetTCPConnection -LocalPort 8081`로 PID를 찾아 확인한 뒤 종료한다. 8082에 남은 Metro도 같이 정리한다.
2. 떠 있지 않으면 `npx expo start --dev-client --port 8081 < /dev/null`을 `run_in_background`로 실행한다.
   - **`CI=1`은 절대 붙이지 않는다.** 파일 감시가 꺼져서 수정이 반영되지 않는다.
   - 실행 후 `/status`가 응답할 때까지 기다린다.

## 4. 앱 연결

```bash
"$ADB" reverse tcp:8081 tcp:8081
"$ADB" shell am start -a android.intent.action.VIEW -d "exp+shelf-life://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
```

딥링크에 `10.0.2.2`를 쓰면 막 설치한 dev client가 포트를 무시하고 흰 화면에 머문 적이 있다. 항상 `localhost:8081` + `adb reverse`를 쓴다.

## 5. 확인

1. 번들이 로드될 때까지 몇 초 기다린다.
2. 스크린샷을 찍는다:
   `"$ADB" exec-out screencap -p > "<scratchpad>/screen.png"`
3. 찍은 파일을 Read로 열어 화면을 확인하고, 사용자에게 보여준다.
   - 화면을 바꾼 작업이라면 결과를 말로 설명하지 말고 스크린샷으로 보여준다.
4. 문제가 있으면 다음을 확인한다:
   - `"$ADB" logcat -d -t 200 *:E ReactNativeJS:V`
   - Metro 출력

갓 빌드한 직후 Fabric 네이티브 크래시가 한 번 난 적이 있다. 다시 실행하면 사라지는지 먼저 확인한다.

## 정리

세션을 마칠 때 사용자가 원하면 Metro를 종료한다. TaskStop은 셸만 끝내고 node 프로세스가 남을 수 있으니, 8081 포트를 쓰는 PID를 직접 확인한다.

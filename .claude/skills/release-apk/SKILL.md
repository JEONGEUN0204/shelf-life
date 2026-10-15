---
name: release-apk
description: shelf-life 릴리스 APK를 빌드하고 카톡으로 보낼 수 있게 zip으로 묶어 바탕화면에 놓는다. "APK 만들어줘", "폰에 설치할 파일", "릴리스 빌드", "카톡으로 보낼 수 있게" 요청에 사용.
---

# 릴리스 APK 빌드 & 전달용 zip

사용자는 USB나 adb 없이 카카오톡으로 APK를 받아 폰에 설치한다. 카톡은 `.apk` 파일을 막기 때문에 zip으로 묶어서 보낸다.
`JAVA_HOME`(JDK 17)과 `ANDROID_HOME`은 `.claude/settings.local.json`의 env로 설정되어 있다.

## 1. 네이티브 프로젝트 동기화

```bash
npx expo prebuild --platform android --no-install
```

`app.json` 변경(이름, 아이콘, 스플래시, 플러그인)을 반영하기 위한 단계다. 매번 실행한다.

## 2. 빌드 (arm64 전용)

```bash
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain > "<scratchpad>/release-build.log" 2>&1
```

- `run_in_background`로 실행하고 완료 알림을 기다린다. 몇 분 걸린다.
- 로그는 scratchpad에 남긴다. 프로젝트 밖이나 프로젝트 안에 남기지 않는다.
- `-PreactNativeArchitectures=arm64-v8a`를 빼면 APK가 약 114MB가 된다. 넣으면 약 48MB다. 항상 넣는다.
- `BUILD FAILED`가 나면 로그 끝부분을 확인한다. 원인이 분명하지 않으면 그대로 한 번 다시 실행한다. 이전에 같은 코드가 재시도에서 통과한 적이 있다.

## 3. zip으로 묶어 바탕화면에 복사

산출물은 `android/app/build/outputs/apk/release/app-release.apk`에 있다.

PowerShell로 묶는다:
- 버전은 `app.json`의 `expo.version`을 읽는다.
- 파일명에 `?`를 쓸 수 없다. 앱 이름 '언제까지?'에서 `?`를 빼고 `언제까지-<version>.apk`로 쓴다.

```powershell
$version = (Get-Content app.json -Raw | ConvertFrom-Json).expo.version
$desktop = [Environment]::GetFolderPath('Desktop')
$tmp = Join-Path $env:TEMP "언제까지-$version.apk"
Copy-Item android/app/build/outputs/apk/release/app-release.apk $tmp -Force
Compress-Archive -Path $tmp -DestinationPath (Join-Path $desktop "언제까지-$version.zip") -Force
Remove-Item $tmp
```

## 4. 마무리

1. 탐색기에서 zip 파일을 선택한 상태로 연다:
   `explorer.exe /select,"<zip 경로>"`
2. 사용자에게 다음을 알린다:
   - zip 크기와 경로
   - 설치 방법: 카톡으로 보낸 뒤 폰에서 zip을 풀고 APK를 연다. 처음에는 "출처를 알 수 없는 앱 설치" 권한을 허용해야 한다.

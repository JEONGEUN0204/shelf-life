# 언제까지? (shelf-life)

식품·화장품 등의 유통기한과 개봉 후 사용기한을 기록하고, 만료 전에 알림을 보내는 Expo/React Native 앱입니다.
- 서버 없이 동작합니다. 데이터는 기기 내 SQLite(`expo-sqlite`)에 저장하고, 알림은 로컬 알림(`expo-notifications`)을 씁니다.
- UI 문구는 한국어입니다.
- 대상은 Android 기기입니다. 개발 환경은 Windows입니다. iOS는 빌드하지 않지만 iOS 쪽 코드(`Platform.OS` 분기, 알림 제한 등)를 깨뜨리지 마세요.

## Expo는 계속 바뀐다 — 학습 데이터를 믿지 말 것

이 프로젝트는 **Expo SDK 57**(React Native 0.86, React 19.2, TypeScript 6)을 씁니다. Expo, React Native, 라이브러리 API를 다루는 코드를 쓰기 전에 다음을 확인하세요.
- 버전별 문서: https://docs.expo.dev/versions/v57.0.0/
- 그 밖의 내용: https://docs.expo.dev/llms.txt (전체 색인과 LLM이 흔히 잘못 아는 내용에 대한 정정)
- 문서 링크가 404라면 `node_modules/<패키지>/build/*.d.ts`에서 실제 타입을 확인하세요.

## 명령어

패키지 매니저는 npm입니다.

```bash
npx expo install <package>   # 패키지 추가는 항상 이것으로 (npm install 금지) — SDK 호환 버전으로 설치
npx expo install --fix       # 호환되지 않는 버전 수정
npx expo-doctor              # 의존성·설정 진단
npx tsc --noEmit             # 타입 체크
npx expo lint                # 린트
npm test                     # jest (jest-expo)
```

작업을 마치기 전에 타입 체크와 린트를 통과시키세요. Stop hook이 자동으로 검사하고, 실패하면 마무리를 막습니다.

## 실행·빌드

- **Expo Go로 실행할 수 없습니다.** SDK 57의 Android Expo Go는 expo-notifications를 지원하지 않습니다. dev build(`expo-dev-client`)만 씁니다.
- 에뮬레이터에서 실행할 때는 `run-android` 스킬, 폰에 설치할 APK를 만들 때는 `release-apk` 스킬을 쓰세요.
- `android/`는 gitignore된 CNG 산출물입니다.
  - 직접 수정하지 말고, 네이티브 설정은 `app.json`과 config plugin으로 하세요.
  - `android/`가 이미 있어서 `app.json`의 plugins, 아이콘, 스플래시, 폰트를 바꾸면 `npx expo prebuild --platform android --no-install`이 필요합니다.
- Metro를 `CI=1`로 띄우지 마세요. 파일 감시가 꺼집니다.
- EAS는 현재 쓰지 않습니다. 빌드는 로컬 gradle로 합니다.
- 빌드 환경: JDK 17(`JAVA_HOME`)과 `ANDROID_HOME`이 `.claude/settings.local.json`의 env로 설정되어 있습니다. Android Studio 번들 JDK 25를 쓰면 CMake 단계에서 실패합니다.

## 구조

| 경로 | 역할 |
|---|---|
| `src/app/` | Expo Router 라우트. `(tabs)/`(목록, 설정), `item/new.tsx`, `item/[id].tsx`. 라우트가 아닌 코드는 여기에 두지 않음 |
| `src/components/` | UI 컴포넌트 |
| `src/constants/theme.ts` | 디자인 토큰(`Colors`, `Spacing`, `Radius`, `CategoryTint`) |
| `src/constants/categories.ts` | 카테고리와 보관 위치 정의 |
| `src/db/` | `schema.ts`(마이그레이션), `items.ts`, `settings.ts` |
| `src/lib/expiry.ts` | 날짜와 만료 상태 계산(순수 함수) |
| `src/lib/notifications.ts` | 알림 예약과 재예약 |
| `src/lib/haptics.ts` | 햅틱 |
| `src/hooks/` | `use-theme`, `use-color-scheme` 등 |

## 코드 규칙

- **네비게이션**: Expo Router만 씁니다. `Link`, `router`, `useLocalSearchParams`는 `expo-router`에서 import합니다. typed routes가 켜져 있습니다.
- **스타일·테마** ("따뜻한 주방" 톤)
  - 색상은 `useTheme()`(또는 `Colors`) 토큰만 쓰고, hex 값을 하드코딩하지 않습니다.
  - 간격과 모서리는 `Spacing`/`Radius` 토큰을 씁니다.
  - 라이트·다크 모드를 모두 확인합니다.
  - 텍스트는 `ThemedText`를 씁니다. 누르는 요소는 `Button` 또는 `PressableScale`을 씁니다.
  - 폰트는 GowunDodum입니다.
- **DB**
  - 스키마를 바꿀 때는 `src/db/schema.ts`의 `MIGRATIONS` 배열 **끝에 새 항목을 추가**합니다. 기존 항목은 절대 수정하지 않습니다(`PRAGMA user_version` 방식).
  - 컬럼은 snake_case, TS 타입은 camelCase입니다. 둘 사이의 변환은 `src/db/*.ts`에서 합니다.
- **날짜**
  - 날짜는 `DateString`(`YYYY-MM-DD`) 형식을 씁니다.
  - 날짜 계산(더하기, 월말 보정, D-day, 상태)은 `src/lib/expiry.ts`의 함수를 재사용하고 직접 구현하지 않습니다.
- **알림**
  - 예약 로직은 `src/lib/notifications.ts`에 모읍니다.
  - iOS는 예약 알림을 64개까지만 유지하므로 `MAX_SCHEDULED` 제한을 유지합니다.
- **Reanimated**
  - React Compiler가 켜져 있으므로 shared value는 `.value` 대신 `.get()`/`.set()`으로 다룹니다.
  - SectionList 행에 entering/exiting 애니메이션을 넣으면 깜박임이 생겼습니다. 넣지 않습니다.
- **파일과 import**: 파일명은 kebab-case로 짓습니다. import는 `@/` 별칭을 씁니다.
- **새 라이브러리**: 서드파티보다 Expo 모듈을 먼저 고려합니다. 네이티브 코드가 있는 라이브러리를 추가하면 dev build를 다시 만들어야 합니다.

## 테스트

- 테스트는 `src/lib/__tests__/`에 둡니다.
- `describe`, `it`, `expect`는 `@jest/globals`에서 import합니다. TS 6은 `@types/jest`를 자동으로 포함하지 않습니다.
- `src/lib`의 순수 로직을 바꾸면 테스트도 추가하거나 고칩니다.

## Claude 작업 메모

- 커밋은 요청할 때만 합니다. 메시지는 한국어 제목 한 줄, 빈 줄, `- ` 불릿 본문 순서로 씁니다.
- 화면을 바꾼 작업은 에뮬레이터 스크린샷으로 결과를 보여줍니다.
- README 이미지는 `docs/mockups/`에 있습니다. 원본 스크린샷은 `raw/`, 목업은 `python docs/mockups/mockup.py <스크린샷 폴더> . <출력 폴더>`로 다시 만듭니다.
- Python으로 PIL을 쓸 때 `-I` 플래그를 붙이지 않습니다. PIL이 user site-packages에 있어서 `-I`를 붙이면 찾지 못합니다. 콘솔이 cp949이므로 `PYTHONIOENCODING=utf-8`을 설정합니다.

# 유통기한 (shelf-life)

식품·화장품 등의 유통기한/개봉 후 사용기한을 기록하고, 만료 전에 알림을 받는 Expo 앱.

## 기능

- 항목 등록/수정 (카테고리, 보관 위치, 유통기한, 개봉일 + PAO 개월 수, 수량, 메모)
- 만료 임박/만료 상태별 목록
- 로컬 알림: 항목별로 만료 N일 전/당일 알림, 알림 받을 시각 설정, 알림 탭 시 해당 항목으로 이동
- 데이터는 기기 내 SQLite에 저장 (서버 없음)

## 개발

```bash
npm install
npx expo run:android          # 개발 빌드 설치 (expo-notifications 때문에 Expo Go 불가)
npx expo start --dev-client   # Metro 실행
```

검사: `npx expo lint`, `npx tsc --noEmit`, `npm test`

## 폰에 설치 (단독 실행 APK)

```bash
npx expo prebuild --platform android --no-install
cd android && ./gradlew assembleRelease
# 결과물: android/app/build/outputs/apk/release/app-release.apk
```

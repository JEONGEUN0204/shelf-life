import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * 앱에서 쓰는 햅틱 세 종류. Android는 Vibrator API 대신 권장되는 performAndroidHapticsAsync를 쓴다.
 * 햅틱 실패는 UX에 영향이 없으므로 조용히 무시한다.
 */
const ignore = () => {};

export function selection() {
  (Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
    : Haptics.selectionAsync()
  ).catch(ignore);
}

export function success() {
  (Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  ).catch(ignore);
}

export function warning() {
  (Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  ).catch(ignore);
}

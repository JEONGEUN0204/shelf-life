import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** iOS 표준 탭 바 높이(safe area 제외) */
const IOS_TAB_BAR_HEIGHT = 49;

/**
 * 탭 화면 위에 떠 있는 버튼의 bottom 값.
 * Android NativeTabs는 화면 내용을 탭 바 위로 올려주므로 여백만 두면 되고,
 * iOS는 탭 바가 내용 위에 겹치므로 탭 바 높이와 홈 인디케이터 영역을 더한다.
 */
export function useFabOffset(margin: number): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? insets.bottom + IOS_TAB_BAR_HEIGHT + margin : margin;
}

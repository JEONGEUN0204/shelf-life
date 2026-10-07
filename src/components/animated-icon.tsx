import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

/**
 * 네이티브 스플래시와 같은 배경색으로 덮고 있다가, 첫 레이아웃 후 걷어낸다.
 * 언마운트될 때 exiting 애니메이션으로 부드럽게 사라진다.
 */
export function AnimatedSplashOverlay() {
  const theme = useTheme();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(300)}
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setHidden(true));
      }}
      style={[styles.overlay, { backgroundColor: theme.background }]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
});

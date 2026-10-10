import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { AppFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** app.json의 expo-splash-screen imageWidth와 같아야 네이티브 → JS 전환이 튀지 않는다. */
const SPLASH_IMAGE_SIZE = 200;
const HOLD_MS = 900;

/**
 * 네이티브 스플래시와 똑같은 화면(배경색 + 로고 위치)으로 덮은 뒤 네이티브 스플래시를 걷어내고,
 * 앱 이름을 잠깐 보여 준 다음 페이드아웃한다.
 */
export function AnimatedSplashOverlay() {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setHidden(true), HOLD_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  if (hidden) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(300)}
      onLayout={() => {
        if (started.current) return;
        started.current = true;
        SplashScreen.hideAsync().finally(() => setRevealed(true));
      }}
      style={[styles.overlay, { backgroundColor: theme.background }]}>
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} />
      {revealed && (
        <View style={styles.caption}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.title, { color: theme.text }]}>언제까지?</Text>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(400).delay(150)}>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              유통기한, 잊지 않게 챙겨 드려요
            </Text>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SPLASH_IMAGE_SIZE,
    height: SPLASH_IMAGE_SIZE,
  },
  // 로고를 정중앙에 고정한 채(네이티브 스플래시와 같은 위치) 그 아래에 문구를 띄운다.
  caption: {
    position: 'absolute',
    top: '50%',
    marginTop: SPLASH_IMAGE_SIZE / 2 - 8,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: AppFont,
    fontSize: 28,
  },
  subtitle: {
    fontFamily: AppFont,
    fontSize: 14,
  },
});

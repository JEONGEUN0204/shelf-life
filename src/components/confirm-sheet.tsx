import { type ReactNode } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** 되돌릴 수 없는 동작은 'danger' */
  tone?: 'accent' | 'danger';
  /** 제목 위에 보여줄 요소(카테고리 아바타 등) */
  leading?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Alert.alert 대신 쓰는 하단 확인 시트. 바깥이나 뒤로가기를 누르면 취소된다. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  tone = 'accent',
  leading,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}>
      {/* Android Modal은 레이아웃 높이를 시스템 바만큼 짧게 잡아 시트가 바닥에서 뜬다. 화면 높이로 고정한다. */}
      <View style={[styles.root, { height: Dimensions.get('screen').height }]}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        />
        <Animated.View
          entering={SlideInDown.springify().damping(24).stiffness(260).reduceMotion(ReduceMotion.System)}
          style={[
            styles.sheet,
            Shadow.raised,
            { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.three },
          ]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {leading}
          <View style={styles.text}>
            <ThemedText type="title" style={styles.center}>
              {title}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              {message}
            </ThemedText>
          </View>
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              size="lg"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
            <Button label="취소" size="lg" variant="ghost" onPress={onCancel} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  text: {
    gap: Spacing.one,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
});

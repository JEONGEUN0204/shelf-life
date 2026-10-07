import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import * as haptics from '@/lib/haptics';

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
};

export function Stepper({ value, onChange, min = 1 }: StepperProps) {
  const theme = useTheme();

  const step = (delta: number) => {
    const next = Math.max(min, value + delta);
    if (next === value) return;
    haptics.selection();
    onChange(next);
  };

  const button = (delta: number, label: string, icon: 'minus' | 'plus', material: 'remove' | 'add') => (
    <PressableScale
      onPress={() => step(delta)}
      disabled={delta < 0 && value <= min}
      pressedScale={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={[styles.button, { backgroundColor: theme.surface }, delta < 0 && value <= min && styles.disabled]}>
      <Icon name={{ ios: icon, android: material, web: material }} color={theme.text} size={16} />
    </PressableScale>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceMuted }]}>
      {button(-1, '수량 줄이기', 'minus', 'remove')}
      <ThemedText type="label" style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </ThemedText>
      {button(1, '수량 늘리기', 'plus', 'add')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.one,
    borderRadius: Radius.pill,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 36,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  disabled: {
    opacity: 0.4,
  },
});

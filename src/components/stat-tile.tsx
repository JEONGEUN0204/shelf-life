import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import * as haptics from '@/lib/haptics';

type StatTileProps = {
  value: number;
  label: string;
  /** 숫자 색 / 선택 시 배경색 */
  color: string;
  softColor: string;
  selected: boolean;
  onPress: () => void;
};

export function StatTile({ value, label, color, softColor, selected, onPress }: StatTileProps) {
  const theme = useTheme();

  return (
    <PressableScale
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} ${value}개`}
      style={[
        styles.tile,
        { backgroundColor: softColor, borderColor: selected ? color : 'transparent' },
      ]}>
      <ThemedText type="number" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color: theme.text }}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: Spacing.three - Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
});

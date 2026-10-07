import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionCardProps = {
  title?: string;
  hint?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** 제목이 있는 둥근 카드. 폼과 설정 화면에서 입력을 묶는 단위. */
export function SectionCard({ title, hint, children, style }: SectionCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, Shadow.card, { backgroundColor: theme.surface }, style]}>
      {(title || hint) && (
        <View style={styles.header}>
          {title && <ThemedText type="label">{title}</ThemedText>}
          {hint && (
            <ThemedText type="caption" themeColor="textSecondary">
              {hint}
            </ThemedText>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

/** 카드 안의 "라벨 — 값/컨트롤" 한 줄 */
export function SettingRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    minHeight: 40,
  },
  rowLabel: {
    flexShrink: 1,
  },
});

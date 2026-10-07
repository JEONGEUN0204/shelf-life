import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRemaining, getStatus, type SectionKey } from '@/lib/expiry';

export function toneFor(status: SectionKey, theme: Theme) {
  switch (status) {
    case 'expired':
      return { fg: theme.danger, bg: theme.dangerSoft };
    case 'soon':
      return { fg: theme.warning, bg: theme.warningSoft };
    case 'ok':
      return { fg: theme.accent, bg: theme.accentSoft };
    case 'undated':
      return { fg: theme.textSecondary, bg: theme.surfaceMuted };
  }
}

/** 남은 기간을 상태색 pill로 보여준다. dday가 null이면 "날짜 없음". */
export function StatusPill({ dday }: { dday: number | null }) {
  const theme = useTheme();
  const tone = toneFor(dday === null ? 'undated' : getStatus(dday), theme);

  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <ThemedText type="caption" style={[styles.text, { color: tone.fg }]}>
        {dday === null ? '날짜 없음' : formatRemaining(dday)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.one,
    borderRadius: Radius.pill,
  },
  text: {
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
});

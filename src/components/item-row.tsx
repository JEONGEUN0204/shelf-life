import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CategoryAvatar } from '@/components/category-avatar';
import { PressableScale } from '@/components/pressable-scale';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { locationOf } from '@/constants/categories';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { Item } from '@/db/items';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate, getDday, getEffectiveExpiry } from '@/lib/expiry';

// 가상화 리스트에서는 셀 위치 이동이 애니메이션되지 않아, 행에 등장/퇴장 애니메이션을 걸면
// 필터 변경 시 사라지는 행과 점프하는 행이 겹쳐 깜박인다. 그래서 행은 정적으로 둔다.
export function ItemRow({ item }: { item: Item }) {
  const theme = useTheme();
  const expiry = getEffectiveExpiry(item);
  const opened = item.openedAt && item.paoMonths;
  const meta = [locationOf(item.location).label, expiry && formatShortDate(expiry), opened && '개봉함']
    .filter(Boolean)
    .join(' · ');

  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: String(item.id) } })}
      pressedScale={0.98}
      accessibilityRole="button"
      style={[styles.row, Shadow.card, { backgroundColor: theme.surface }]}>
      <CategoryAvatar category={item.category} />
      <View style={styles.body}>
        <ThemedText numberOfLines={1} style={styles.name}>
          {item.name}
          {item.quantity > 1 && (
            <ThemedText themeColor="textSecondary" style={styles.quantity}>
              {`  ×${item.quantity}`}
            </ThemedText>
          )}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {meta}
        </ThemedText>
      </View>
      <StatusPill dday={expiry ? getDday(expiry) : null} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    paddingVertical: Spacing.three - Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
    borderRadius: Radius.lg,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontWeight: 600,
  },
  quantity: {
    fontWeight: 500,
  },
});

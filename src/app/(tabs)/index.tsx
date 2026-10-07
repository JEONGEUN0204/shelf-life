import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { ItemRow } from '@/components/item-row';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES, LOCATIONS } from '@/constants/categories';
import { MaxContentWidth, Shadow, Spacing } from '@/constants/theme';
import { listActiveItems, type Item } from '@/db/items';
import { useFabOffset } from '@/hooks/use-fab-offset';
import { useTheme } from '@/hooks/use-theme';
import { getDday, getEffectiveExpiry, getStatus, groupByStatus, type SectionKey } from '@/lib/expiry';

type StatusFilter = 'expired' | 'soon' | null;

const SECTION_TITLES: Record<SectionKey, string> = {
  expired: '서둘러 주세요',
  soon: '곧 만료돼요',
  ok: '여유 있어요',
  undated: '날짜 없음',
};

function statusOf(item: Item): SectionKey {
  const expiry = getEffectiveExpiry(item);
  return expiry ? getStatus(getDday(expiry)) : 'undated';
}

function greeting(hour: number) {
  if (hour >= 5 && hour < 11) return '좋은 아침이에요';
  if (hour >= 11 && hour < 17) return '좋은 오후예요';
  if (hour >= 17 && hour < 22) return '좋은 저녁이에요';
  return '편안한 밤 보내세요';
}

export default function ListScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const fabBottom = useFabOffset(Spacing.three);
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<StatusFilter>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listActiveItems(db).then(setItems);
    }, [db]),
  );

  const counts = { expired: 0, soon: 0 };
  for (const item of items) {
    const s = statusOf(item);
    if (s === 'expired' || s === 'soon') counts[s] += 1;
  }

  const visible = items.filter(
    (item) =>
      (!status || statusOf(item) === status) &&
      (!category || item.category === category) &&
      (!location || item.location === location),
  );
  const sections = groupByStatus(visible);
  const filtered = status !== null || category !== null || location !== null;

  const resetFilters = () => {
    setStatus(null);
    setCategory(null);
    setLocation(null);
  };

  const summary =
    items.length === 0
      ? '무엇부터 채워볼까요?'
      : counts.expired > 0
        ? `정리가 필요한 항목이 ${counts.expired}개 있어요`
        : counts.soon > 0
          ? `곧 만료될 항목이 ${counts.soon}개 있어요`
          : '모두 여유 있어요';

  const header = (
    <View style={styles.header}>
      <View style={styles.greeting}>
        <ThemedText type="display">{greeting(new Date().getHours())}</ThemedText>
        <ThemedText themeColor="textSecondary">{summary}</ThemedText>
      </View>

      <View style={styles.tiles}>
        <StatTile
          value={counts.expired}
          label="만료"
          color={theme.danger}
          softColor={theme.dangerSoft}
          selected={status === 'expired'}
          onPress={() => setStatus(status === 'expired' ? null : 'expired')}
        />
        <StatTile
          value={counts.soon}
          label="임박"
          color={theme.warning}
          softColor={theme.warningSoft}
          selected={status === 'soon'}
          onPress={() => setStatus(status === 'soon' ? null : 'soon')}
        />
        <StatTile
          value={items.length}
          label="전체"
          color={theme.accent}
          softColor={theme.accentSoft}
          selected={false}
          onPress={resetFilters}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={`${c.emoji} ${c.label}`}
            selected={category === c.value}
            onPress={() => setCategory(category === c.value ? null : c.value)}
          />
        ))}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        {LOCATIONS.map((l) => (
          <Chip
            key={l.value}
            label={l.label}
            selected={location === l.value}
            onPress={() => setLocation(location === l.value ? null : l.value)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ItemRow item={item} />}
          renderSectionHeader={({ section }) => (
            <ThemedText type="label" themeColor="textSecondary" style={styles.sectionHeader}>
              {SECTION_TITLES[section.key]}
            </ThemedText>
          )}
          ItemSeparatorComponent={ItemGap}
          ListHeaderComponent={header}
          ListEmptyComponent={
            items.length === 0 ? (
              <EmptyState
                emoji="🧺"
                title="아직 비어 있어요"
                description="유통기한을 챙길 물건을 추가해 보세요."
                actionLabel="첫 항목 추가"
                onAction={() => router.push('/item/new')}
              />
            ) : (
              <EmptyState
                emoji="🔍"
                title="조건에 맞는 항목이 없어요"
                actionLabel={filtered ? '필터 초기화' : undefined}
                onAction={resetFilters}
              />
            )
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>

      <View style={[styles.fab, { bottom: fabBottom }]}>
        <Button
          label="추가"
          size="lg"
          onPress={() => router.push('/item/new')}
          icon={<Icon name={{ ios: 'plus', android: 'add', web: 'add' }} color={theme.onAccent} size={18} />}
          style={Shadow.raised}
        />
      </View>
    </ThemedView>
  );
}

function ItemGap() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  greeting: {
    gap: Spacing.half,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chipScroll: {
    // 리스트 좌우 패딩을 넘어 화면 끝까지 스크롤되게
    marginHorizontal: -Spacing.three,
  },
  chips: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: Spacing.one,
  },
  sectionHeader: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  itemGap: {
    height: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.three,
    // FAB(54) + 여백만큼 비워 마지막 카드가 가려지지 않게
    paddingBottom: 54 + Spacing.three * 2,
  },
  fab: {
    position: 'absolute',
    right: Spacing.three,
  },
});

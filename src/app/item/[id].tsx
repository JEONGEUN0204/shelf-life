import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { CategoryAvatar } from '@/components/category-avatar';
import { ItemForm } from '@/components/item-form';
import { SectionCard } from '@/components/section-card';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { categoryOf, locationOf } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { deleteItem, getItem, setItemStatus, updateItem, type Item, type ItemInput, type ItemStatus } from '@/db/items';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate, getDday, getEffectiveExpiry } from '@/lib/expiry';
import * as haptics from '@/lib/haptics';
import { cancelItemNotifications, syncItemNotifications } from '@/lib/notifications';

const FINISH_LABEL: Record<Exclude<ItemStatus, 'active'>, string> = {
  consumed: '다 썼어요',
  discarded: '버렸어요',
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const [item, setItem] = useState<Item | null | undefined>(undefined);

  useEffect(() => {
    getItem(db, Number(id)).then(setItem);
  }, [db, id]);

  if (item === undefined) {
    return (
      <ThemedView style={[styles.fill, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }
  if (item === null) {
    return (
      <ThemedView style={[styles.fill, styles.center]}>
        <ThemedText themeColor="textSecondary">항목을 찾을 수 없어요.</ThemedText>
      </ThemedView>
    );
  }

  const expiry = getEffectiveExpiry(item);

  const save = async (input: ItemInput) => {
    await updateItem(db, item.id, input);
    const updated = await getItem(db, item.id);
    if (updated) await syncItemNotifications(db, updated);
    router.back();
  };

  const confirmFinish = (status: Exclude<ItemStatus, 'active'>) =>
    Alert.alert(FINISH_LABEL[status], `"${item.name}"을(를) 목록에서 정리하고 알림을 끌게요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: FINISH_LABEL[status],
        onPress: async () => {
          await cancelItemNotifications(db, item);
          await setItemStatus(db, item.id, status);
          haptics.success();
          router.back();
        },
      },
    ]);

  const confirmDelete = () => {
    haptics.warning();
    Alert.alert('삭제할까요?', `"${item.name}" 항목이 영구 삭제됩니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await cancelItemNotifications(db, item);
          await deleteItem(db, item.id);
          router.back();
        },
      },
    ]);
  };

  const initial: ItemInput = {
    name: item.name,
    category: item.category,
    location: item.location,
    expiryDate: item.expiryDate,
    openedAt: item.openedAt,
    paoMonths: item.paoMonths,
    quantity: item.quantity,
    memo: item.memo,
    notifyOffsets: item.notifyOffsets,
  };

  return (
    <ThemedView style={styles.fill}>
      <ItemForm
        initial={initial}
        submitLabel="수정 저장"
        onSubmit={save}
        header={
          <SectionCard style={styles.summary}>
            <CategoryAvatar category={item.category} size={56} />
            <View style={styles.summaryText}>
              <ThemedText type="title" numberOfLines={2}>
                {item.name}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {categoryOf(item.category).label} · {locationOf(item.location).label}
                {expiry ? ` · ${formatShortDate(expiry)}까지` : ''}
              </ThemedText>
            </View>
            <StatusPill dday={expiry ? getDday(expiry) : null} />
          </SectionCard>
        }
        footer={
          <View style={styles.footer}>
            <SectionCard title="정리하기" hint="정리한 항목은 목록과 알림에서 빠져요.">
              <View style={styles.finishRow}>
                {(['consumed', 'discarded'] as const).map((status) => (
                  <Button
                    key={status}
                    label={FINISH_LABEL[status]}
                    variant="secondary"
                    onPress={() => confirmFinish(status)}
                    style={styles.finishButton}
                  />
                ))}
              </View>
            </SectionCard>
            <Button label="항목 삭제" variant="destructive" onPress={confirmDelete} />
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
    gap: Spacing.half,
  },
  footer: {
    gap: Spacing.two,
  },
  finishRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  finishButton: {
    flex: 1,
  },
});

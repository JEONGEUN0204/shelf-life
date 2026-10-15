import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { CategoryAvatar } from '@/components/category-avatar';
import { ConfirmSheet } from '@/components/confirm-sheet';
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

type FinishStatus = Exclude<ItemStatus, 'active'>;

const FINISH_LABEL: Record<FinishStatus, string> = {
  consumed: '다 썼어요',
  discarded: '버렸어요',
};

const FINISH_TITLE: Record<FinishStatus, string> = {
  consumed: '다 썼나요?',
  discarded: '버렸나요?',
};

type PendingAction = FinishStatus | 'delete';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const [item, setItem] = useState<Item | null | undefined>(undefined);
  // 시트가 닫히며 사라지는 동안 내용이 바뀌지 않도록 열림 여부와 동작을 따로 둔다
  const [sheetOpen, setSheetOpen] = useState(false);
  const [action, setAction] = useState<PendingAction>('consumed');

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

  const openSheet = (next: PendingAction) => {
    setAction(next);
    setSheetOpen(true);
  };

  const finish = async (status: FinishStatus) => {
    setSheetOpen(false);
    // 상태를 먼저 바꿔야 진행 중인 resync가 이 항목을 다시 예약하지 않는다
    await setItemStatus(db, item.id, status);
    await cancelItemNotifications(db, item.id);
    haptics.success();
    router.back();
  };

  const remove = async () => {
    setSheetOpen(false);
    await deleteItem(db, item.id);
    await cancelItemNotifications(db, item.id);
    router.back();
  };

  const confirmDelete = () => {
    haptics.warning();
    openSheet('delete');
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
                    onPress={() => openSheet(status)}
                    style={styles.finishButton}
                  />
                ))}
              </View>
            </SectionCard>
            <Button label="항목 삭제" variant="destructive" onPress={confirmDelete} />
          </View>
        }
      />
      <ConfirmSheet
        visible={sheetOpen}
        leading={<CategoryAvatar category={item.category} size={64} />}
        onCancel={() => setSheetOpen(false)}
        {...(action === 'delete'
          ? {
              title: '삭제할까요?',
              message: `"${item.name}" 항목이 영구 삭제돼요. 되돌릴 수 없어요.`,
              confirmLabel: '삭제',
              tone: 'danger',
              onConfirm: remove,
            }
          : {
              title: FINISH_TITLE[action],
              message: `"${item.name}"을(를) 목록에서 정리하고 알림을 끌게요.`,
              confirmLabel: FINISH_LABEL[action],
              onConfirm: () => finish(action),
            })}
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

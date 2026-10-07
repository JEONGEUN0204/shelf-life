import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { emptyItemInput, ItemForm } from '@/components/item-form';
import { ThemedView } from '@/components/themed-view';
import { getItem, insertItem, type ItemInput } from '@/db/items';
import { getSettings } from '@/db/settings';
import { useTheme } from '@/hooks/use-theme';
import { syncItemNotifications } from '@/lib/notifications';

export default function NewItemScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [initial, setInitial] = useState<ItemInput | null>(null);

  useEffect(() => {
    getSettings(db).then((s) => setInitial(emptyItemInput(s.defaultOffsets)));
  }, [db]);

  const save = async (input: ItemInput) => {
    const id = await insertItem(db, input);
    const item = await getItem(db, id);
    if (item) await syncItemNotifications(db, item);
    router.back();
  };

  return (
    <ThemedView style={[styles.fill, !initial && styles.center]}>
      {initial ? (
        <ItemForm initial={initial} submitLabel="저장" onSubmit={save} />
      ) : (
        <ActivityIndicator color={theme.accent} />
      )}
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
});

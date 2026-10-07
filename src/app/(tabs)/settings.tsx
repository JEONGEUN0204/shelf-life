import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { SectionCard, SettingRow } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NOTIFY_OFFSET_OPTIONS } from '@/constants/categories';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getSettings, saveSettings, type Settings } from '@/db/settings';
import { useTheme } from '@/hooks/use-theme';
import { formatOffset } from '@/lib/expiry';
import * as haptics from '@/lib/haptics';
import {
  getPermissionGranted,
  getScheduledCount,
  requestPermission,
  resyncAllNotifications,
  sendTestNotification,
} from '@/lib/notifications';

function formatTime(hour: number, minute: number) {
  const period = hour < 12 ? '오전' : '오후';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${h12}:${String(minute).padStart(2, '0')}`;
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [scheduled, setScheduled] = useState(0);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const refreshStatus = useCallback(async () => {
    setGranted(await getPermissionGranted());
    setScheduled(await getScheduledCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      getSettings(db).then(setSettings);
      refreshStatus();
    }, [db, refreshStatus]),
  );

  if (!settings) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  const apply = async (patch: Partial<Settings>) => {
    setSettings({ ...settings, ...patch });
    await saveSettings(db, patch);
    // 알림 시각 변경은 기존 예약 전체에 영향
    if ('notifyHour' in patch || 'notifyMinute' in patch) {
      await resyncAllNotifications(db);
      await refreshStatus();
    }
  };

  const toggleDefaultOffset = (offset: number) => {
    const current = settings.defaultOffsets;
    apply({
      defaultOffsets: current.includes(offset)
        ? current.filter((o) => o !== offset)
        : [...current, offset].sort((a, b) => b - a),
    });
  };

  const onTimeChange = (date: Date) => {
    setTimePickerOpen(false);
    apply({ notifyHour: date.getHours(), notifyMinute: date.getMinutes() });
  };

  const timeValue = new Date();
  timeValue.setHours(settings.notifyHour, settings.notifyMinute, 0, 0);

  const onPermissionPress = async () => {
    const ok = await requestPermission();
    if (!ok) Linking.openSettings();
    await refreshStatus();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="display" style={styles.title}>
            설정
          </ThemedText>

          <SectionCard title="알림">
            <SettingRow label="알림 권한">
              {granted === false ? (
                <Button label="허용하기" onPress={onPermissionPress} />
              ) : (
                <ThemedText themeColor={granted ? 'accent' : 'textSecondary'} style={styles.value}>
                  {granted === null ? '확인 중…' : '허용됨'}
                </ThemedText>
              )}
            </SettingRow>

            <View style={[styles.separator, { backgroundColor: theme.border }]} />

            <SettingRow label="알림 받을 시각">
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={timeValue}
                  mode="time"
                  display="compact"
                  locale="ko-KR"
                  accentColor={theme.accent}
                  onValueChange={(_, date) => onTimeChange(date)}
                />
              ) : (
                <Button
                  label={formatTime(settings.notifyHour, settings.notifyMinute)}
                  variant="secondary"
                  onPress={() => setTimePickerOpen(true)}
                />
              )}
            </SettingRow>
            {timePickerOpen && (
              <DateTimePicker
                value={timeValue}
                mode="time"
                accentColor={theme.accent}
                onValueChange={(_, date) => onTimeChange(date)}
                onDismiss={() => setTimePickerOpen(false)}
              />
            )}
          </SectionCard>

          <SectionCard title="기본 알림 시점" hint="새 항목을 추가할 때 기본으로 선택돼요.">
            <View style={styles.chips}>
              {NOTIFY_OFFSET_OPTIONS.map((offset) => (
                <Chip
                  key={offset}
                  label={formatOffset(offset)}
                  selected={settings.defaultOffsets.includes(offset)}
                  onPress={() => toggleDefaultOffset(offset)}
                />
              ))}
            </View>
          </SectionCard>

          <SectionCard
            title="예약 상태"
            hint="iOS 제한으로 가장 가까운 60개까지만 예약되고, 앱을 열 때마다 다시 채워져요.">
            <SettingRow label={`예약된 알림 ${scheduled}개`}>
              <Button
                label="테스트 알림"
                variant="secondary"
                onPress={async () => {
                  await sendTestNotification();
                  haptics.success();
                  await refreshStatus();
                }}
              />
            </SettingRow>
          </SectionCard>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  title: {
    marginBottom: Spacing.one,
  },
  value: {
    fontWeight: 600,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});

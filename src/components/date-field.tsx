import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatShortDate, parseDate, today, type DateString } from '@/lib/expiry';

type DateFieldProps = {
  value: DateString | null;
  onChange: (value: DateString) => void;
  placeholder?: string;
  maximumDate?: Date;
};

/** iOS는 compact 피커를 그대로 노출하고, Android는 눌렀을 때 다이얼로그를 띄운다. */
export function DateField({ value, onChange, placeholder = '날짜 선택', maximumDate }: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const date = parseDate(value ?? today());

  if (Platform.OS === 'ios' && value) {
    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="compact"
        locale="ko-KR"
        accentColor={theme.accent}
        maximumDate={maximumDate}
        onValueChange={(_, next) => onChange(formatDate(next))}
        style={styles.iosPicker}
      />
    );
  }

  return (
    <>
      <PressableScale
        // iOS에서 값이 없으면 오늘 날짜로 채워 compact 피커로 전환
        onPress={() => (Platform.OS === 'ios' ? onChange(today()) : setOpen(true))}
        accessibilityRole="button"
        style={[styles.field, { backgroundColor: theme.surfaceMuted }]}>
        <Icon
          name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
          color={value ? theme.accent : theme.textSecondary}
          size={16}
        />
        <ThemedText themeColor={value ? 'text' : 'textSecondary'}>
          {value ? formatShortDate(value) : placeholder}
        </ThemedText>
      </PressableScale>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          accentColor={theme.accent}
          maximumDate={maximumDate}
          onValueChange={(_, next) => {
            setOpen(false);
            onChange(formatDate(next));
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
});

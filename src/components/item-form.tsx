import { useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { PressableScale } from '@/components/pressable-scale';
import { SectionCard, SettingRow } from '@/components/section-card';
import { StatusPill, toneFor } from '@/components/status-pill';
import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { CATEGORIES, LOCATIONS, NOTIFY_OFFSET_OPTIONS, PAO_PRESETS } from '@/constants/categories';
import { AppFont, Radius, Spacing } from '@/constants/theme';
import type { ItemInput } from '@/db/items';
import { useTheme } from '@/hooks/use-theme';
import { formatOffset, formatShortDate, getDday, getEffectiveExpiry, getStatus, today } from '@/lib/expiry';
import * as haptics from '@/lib/haptics';

type ItemFormProps = {
  initial: ItemInput;
  submitLabel: string;
  onSubmit: (input: ItemInput) => Promise<void> | void;
  /** 폼 위에 붙는 영역 (수정 화면의 요약 카드) */
  header?: ReactNode;
  /** 폼 아래에 붙는 영역 (수정 화면의 정리하기/삭제) */
  footer?: ReactNode;
};

type Errors = { name?: string; expiry?: string };

const layout = LinearTransition.duration(200);

export function emptyItemInput(defaultOffsets: number[]): ItemInput {
  return {
    name: '',
    category: 'food',
    location: 'fridge',
    expiryDate: null,
    openedAt: null,
    paoMonths: null,
    quantity: 1,
    memo: '',
    notifyOffsets: defaultOffsets,
  };
}

export function ItemForm({ initial, submitLabel, onSubmit, header, footer }: ItemFormProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const expiryCardY = useRef(0);
  const [form, setForm] = useState<ItemInput>(initial);
  const [opened, setOpened] = useState(initial.openedAt !== null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<ItemInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // 고친 필드의 에러는 바로 지운다
    if ('name' in patch) setErrors((e) => ({ ...e, name: undefined }));
    if ('expiryDate' in patch || 'openedAt' in patch || 'paoMonths' in patch) {
      setErrors((e) => ({ ...e, expiry: undefined }));
    }
  };

  const toggleOffset = (offset: number) =>
    update({
      notifyOffsets: form.notifyOffsets.includes(offset)
        ? form.notifyOffsets.filter((o) => o !== offset)
        : [...form.notifyOffsets, offset].sort((a, b) => b - a),
    });

  const setOpenedState = (value: boolean) => {
    haptics.selection();
    setOpened(value);
    update(value ? { openedAt: form.openedAt ?? today() } : { openedAt: null, paoMonths: null });
  };

  const effectiveExpiry = getEffectiveExpiry(form);
  const effectiveDday = effectiveExpiry ? getDday(effectiveExpiry) : null;

  const submit = async () => {
    const next: Errors = {
      name: form.name.trim() ? undefined : '이름을 입력해 주세요.',
      expiry: effectiveExpiry ? undefined : '유통기한 또는 개봉 후 사용기한을 입력해 주세요.',
    };
    if (next.name || next.expiry) {
      setErrors(next);
      haptics.warning();
      scrollRef.current?.scrollTo({ y: next.name ? 0 : expiryCardY.current, animated: true });
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...form, name: form.name.trim() });
      haptics.success();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.surfaceMuted }];

  return (
    <View style={styles.fill}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets>
        {header}

        <Animated.View layout={layout}>
          <SectionCard title="기본 정보">
            <View style={styles.field}>
              <TextInput
                value={form.name}
                onChangeText={(name) => update({ name })}
                placeholder="이름 (예: 우유, 선크림)"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="done"
                accessibilityLabel="이름"
                style={[inputStyle, styles.nameInput, errors.name && { borderColor: theme.danger }]}
              />
              {errors.name && <FieldError message={errors.name} />}
            </View>

            <Field label="분류">
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.value}
                    label={`${c.emoji} ${c.label}`}
                    selected={form.category === c.value}
                    onPress={() => update({ category: c.value })}
                  />
                ))}
              </View>
            </Field>

            <Field label="보관 위치">
              <View style={styles.chips}>
                {LOCATIONS.map((l) => (
                  <Chip
                    key={l.value}
                    label={l.label}
                    selected={form.location === l.value}
                    onPress={() => update({ location: l.value })}
                  />
                ))}
              </View>
            </Field>

            <SettingRow label="수량">
              <Stepper value={form.quantity} onChange={(quantity) => update({ quantity })} />
            </SettingRow>
          </SectionCard>
        </Animated.View>

        <Animated.View layout={layout} onLayout={(e) => (expiryCardY.current = e.nativeEvent.layout.y)}>
          <SectionCard title="기한">
            <Field label="유통기한">
              <View style={styles.inlineRow}>
                <DateField value={form.expiryDate} onChange={(expiryDate) => update({ expiryDate })} />
                {form.expiryDate && (
                  <PressableScale onPress={() => update({ expiryDate: null })} hitSlop={8} accessibilityRole="button">
                    <ThemedText type="label" themeColor="textSecondary">
                      지우기
                    </ThemedText>
                  </PressableScale>
                )}
              </View>
            </Field>

            <SettingRow label="개봉했어요">
              <Switch
                value={opened}
                onValueChange={setOpenedState}
                trackColor={{ true: theme.accent, false: theme.border }}
                // Android thumb은 카드 배경과 섞이지 않도록 꺼짐 상태에서 대비색을 쓴다
                thumbColor={Platform.OS === 'android' ? (opened ? '#FFFFFF' : theme.textSecondary) : undefined}
              />
            </SettingRow>

            {opened && (
              <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.group}>
                <Field label="개봉일">
                  <DateField
                    value={form.openedAt}
                    onChange={(openedAt) => update({ openedAt })}
                    maximumDate={new Date()}
                  />
                </Field>
                <Field label="개봉 후 사용기한">
                  <View style={styles.chips}>
                    {PAO_PRESETS.map((months) => (
                      <Chip
                        key={months}
                        label={`${months}개월`}
                        selected={form.paoMonths === months}
                        onPress={() => update({ paoMonths: form.paoMonths === months ? null : months })}
                      />
                    ))}
                  </View>
                </Field>
              </Animated.View>
            )}

            {effectiveExpiry && effectiveDday !== null ? (
              <Animated.View
                entering={FadeIn.duration(180)}
                layout={layout}
                style={[styles.result, { backgroundColor: toneFor(getStatus(effectiveDday), theme).bg }]}>
                <View style={styles.resultText}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    실제 만료일
                  </ThemedText>
                  <ThemedText style={styles.resultDate}>{formatShortDate(effectiveExpiry)}</ThemedText>
                </View>
                <StatusPill dday={effectiveDday} />
              </Animated.View>
            ) : (
              errors.expiry && <FieldError message={errors.expiry} />
            )}
          </SectionCard>
        </Animated.View>

        <Animated.View layout={layout}>
          <SectionCard title="알림" hint="만료일 기준으로 언제 알려드릴까요?">
            <View style={styles.chips}>
              {NOTIFY_OFFSET_OPTIONS.map((offset) => (
                <Chip
                  key={offset}
                  label={formatOffset(offset)}
                  selected={form.notifyOffsets.includes(offset)}
                  onPress={() => toggleOffset(offset)}
                />
              ))}
            </View>
          </SectionCard>
        </Animated.View>

        <Animated.View layout={layout}>
          <SectionCard title="메모">
            <TextInput
              value={form.memo}
              onChangeText={(memo) => update({ memo })}
              placeholder="선택 사항"
              placeholderTextColor={theme.textSecondary}
              multiline
              accessibilityLabel="메모"
              style={[inputStyle, styles.memo]}
            />
          </SectionCard>
        </Animated.View>

        {footer && <Animated.View layout={layout}>{footer}</Animated.View>}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two },
        ]}>
        <Button label={submitLabel} size="lg" onPress={submit} disabled={saving} />
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function FieldError({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(150)}>
      <ThemedText type="caption" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
        {message}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  field: {
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  input: {
    fontFamily: AppFont,
    fontSize: 16,
    minHeight: 44,
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: 600,
  },
  memo: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three - Spacing.one,
    borderRadius: Radius.md,
  },
  resultText: {
    gap: Spacing.half,
  },
  resultDate: {
    fontWeight: 700,
  },
  bottomBar: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

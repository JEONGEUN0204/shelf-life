import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function colorsFor(variant: Variant, theme: Theme) {
  switch (variant) {
    case 'primary':
      return { background: theme.accent, text: theme.onAccent };
    case 'secondary':
      return { background: theme.surfaceMuted, text: theme.text };
    case 'ghost':
      return { background: 'transparent', text: theme.accent };
    case 'destructive':
      return { background: 'transparent', text: theme.danger };
    case 'danger':
      return { background: theme.danger, text: theme.onAccent };
  }
}

export function Button({ label, onPress, variant = 'primary', size = 'md', icon, disabled, style }: ButtonProps) {
  const theme = useTheme();
  const colors = colorsFor(variant, theme);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: colors.background },
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        {icon}
        <ThemedText type={size === 'lg' ? 'default' : 'label'} style={[styles.label, { color: colors.text }]}>
          {label}
        </ThemedText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  md: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  lg: {
    minHeight: 54,
    paddingHorizontal: Spacing.four,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    fontWeight: 700,
  },
  disabled: {
    opacity: 0.4,
  },
});

import { StyleSheet, Text, type TextProps } from 'react-native';

import { AppFont, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextType = 'display' | 'title' | 'default' | 'label' | 'caption' | 'number';

export type ThemedTextProps = TextProps & {
  type?: TextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[styles.base, { color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: AppFont,
  },
  display: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  number: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
});

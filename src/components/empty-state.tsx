import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type EmptyStateProps = {
  emoji: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji} accessibilityElementsHidden>
        {emoji}
      </Text>
      <View style={styles.text}>
        <ThemedText type="title" style={styles.center}>
          {title}
        </ThemedText>
        {description && (
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {description}
          </ThemedText>
        )}
      </View>
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} variant="secondary" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.six - Spacing.three,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  emoji: {
    fontSize: 56,
    lineHeight: 68,
  },
  text: {
    gap: Spacing.one,
  },
  center: {
    textAlign: 'center',
  },
});

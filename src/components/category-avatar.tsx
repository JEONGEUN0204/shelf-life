import { StyleSheet, Text, View } from 'react-native';

import { categoryOf } from '@/constants/categories';
import { useCategoryTint } from '@/hooks/use-theme';

/** 파스텔 원 안에 카테고리 이모지 */
export function CategoryAvatar({ category, size = 44 }: { category: string; size?: number }) {
  const tint = useCategoryTint(category);

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}>
      <Text style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }} accessibilityElementsHidden>
        {categoryOf(category).emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

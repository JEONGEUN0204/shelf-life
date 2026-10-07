export const CATEGORIES = [
  { value: 'food', label: '음식', emoji: '🥫' },
  { value: 'cosmetic', label: '화장품', emoji: '🧴' },
  { value: 'medicine', label: '의약품', emoji: '💊' },
  { value: 'etc', label: '기타', emoji: '📦' },
] as const;

export const LOCATIONS = [
  { value: 'fridge', label: '냉장' },
  { value: 'freezer', label: '냉동' },
  { value: 'pantry', label: '실온' },
  { value: 'bathroom', label: '욕실' },
  { value: 'etc', label: '기타' },
] as const;

export type Category = (typeof CATEGORIES)[number]['value'];
export type Location = (typeof LOCATIONS)[number]['value'];

export const NOTIFY_OFFSET_OPTIONS = [7, 3, 1, 0] as const;

/** 화장품 개봉 후 사용기한(PAO) 프리셋, 개월 단위 */
export const PAO_PRESETS = [3, 6, 12, 24] as const;

export function categoryOf(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function locationOf(value: string) {
  return LOCATIONS.find((l) => l.value === value) ?? LOCATIONS[LOCATIONS.length - 1];
}

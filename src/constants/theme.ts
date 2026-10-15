/**
 * 앱 전체 디자인 토큰. "따뜻한 주방" 톤: 크림 배경, 올리브 강조, 테라코타/머스타드 상태색.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2B2621',
    textSecondary: '#7A7065',
    background: '#FAF6EF',
    surface: '#FFFFFF',
    surfaceMuted: '#F1EBE0',
    border: '#E8E0D3',
    accent: '#5B7B4A',
    accentSoft: '#E6EEDF',
    onAccent: '#FFFFFF',
    danger: '#C8553D',
    dangerSoft: '#F7E1DA',
    warning: '#A86F0F',
    warningSoft: '#F8ECD2',
    scrim: 'rgba(43, 38, 33, 0.45)',
  },
  dark: {
    text: '#F3EEE6',
    textSecondary: '#A89F94',
    background: '#1A1815',
    surface: '#26231F',
    surfaceMuted: '#312D28',
    border: '#3A352F',
    accent: '#8DAE78',
    accentSoft: '#2E3A27',
    onAccent: '#1A1815',
    danger: '#E57A62',
    dangerSoft: '#3D2620',
    warning: '#E0A23B',
    warningSoft: '#3B3020',
    scrim: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = { [K in ThemeColor]: string };

/** 카테고리 아바타의 파스텔 배경 */
export const CategoryTint = {
  light: { food: '#F6E3D3', cosmetic: '#F3DEE6', medicine: '#DDE8F0', etc: '#E9E4DA' },
  dark: { food: '#43342A', cosmetic: '#40303A', medicine: '#2C3842', etc: '#36322C' },
} as const;

/**
 * 앱 기본 글꼴: 고운돋움. expo-font config plugin으로 빌드 시 내장된다(app.json).
 * Android는 plugin에 선언한 패밀리 이름, iOS는 PostScript 이름으로 찾는다.
 * 굵기가 400 하나뿐이라 fontWeight 600 이상은 OS가 획을 합성해 두껍게 그린다.
 * (Android에서 패밀리 없이 파일만 넣으면 굵은 글자가 시스템 글꼴로 대체된다.)
 * 웹은 내장하지 않아 시스템 글꼴을 쓴다.
 */
export const AppFont = Platform.select({ android: 'GowunDodum', ios: 'GowunDodum-Regular' });

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

/** 카드용 옅은 그림자. 따뜻한 갈색 톤이라 크림 배경에서 탁해 보이지 않는다. */
export const Shadow = {
  card: Platform.select({
    android: { elevation: 1 },
    default: {
      shadowColor: '#5A4630',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
  }),
  raised: Platform.select({
    android: { elevation: 4 },
    default: {
      shadowColor: '#3D2E1E',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
  }),
};

export const MaxContentWidth = 800;

/**
 * 날짜는 모두 로컬 기준 'YYYY-MM-DD' 문자열로 다룬다.
 * 문자열 비교가 곧 날짜 비교가 되므로 정렬/min 계산이 단순해진다.
 */

export type DateString = string;

export type ExpiryFields = {
  expiryDate: DateString | null;
  openedAt: DateString | null;
  paoMonths: number | null;
};

export type ExpiryStatus = 'expired' | 'soon' | 'ok';

export const SOON_THRESHOLD_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDate(value: DateString): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(date: Date): DateString {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): DateString {
  return formatDate(new Date());
}

/** 월말 보정: 1/31 + 1개월 = 2/28(또는 29) */
export function addMonths(value: DateString, months: number): DateString {
  const [y, m, d] = value.split('-').map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return formatDate(target);
}

export function addDays(value: DateString, days: number): DateString {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/** 유통기한과 (개봉일 + PAO) 중 더 이른 날짜. 둘 다 없으면 null. */
export function getEffectiveExpiry(item: ExpiryFields): DateString | null {
  const candidates: DateString[] = [];
  if (item.expiryDate) candidates.push(item.expiryDate);
  if (item.openedAt && item.paoMonths) candidates.push(addMonths(item.openedAt, item.paoMonths));
  if (candidates.length === 0) return null;
  return candidates.sort()[0];
}

/** 만료일까지 남은 일수. 오늘 만료 = 0, 지났으면 음수. */
export function getDday(expiry: DateString, base: DateString = today()): number {
  // UTC로 계산해 서머타임 영향 제거
  const toUtc = (s: DateString) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(expiry) - toUtc(base)) / MS_PER_DAY);
}

export function formatDday(dday: number): string {
  if (dday === 0) return 'D-Day';
  return dday > 0 ? `D-${dday}` : `D+${-dday}`;
}

export function getStatus(dday: number): ExpiryStatus {
  if (dday < 0) return 'expired';
  if (dday <= SOON_THRESHOLD_DAYS) return 'soon';
  return 'ok';
}

export function formatOffset(offset: number): string {
  return offset === 0 ? '당일' : `D-${offset}`;
}

/** 사람이 읽기 쉬운 남은 기간: "3일 남음" / "오늘까지" / "2일 지남" */
export function formatRemaining(dday: number): string {
  if (dday === 0) return '오늘까지';
  return dday > 0 ? `${dday}일 남음` : `${-dday}일 지남`;
}

/** "9월 30일". 기준 연도와 다르면 "2027년 1월 3일" */
export function formatShortDate(value: DateString, base: DateString = today()): string {
  const [y, m, d] = value.split('-').map(Number);
  const sameYear = base.slice(0, 4) === value.slice(0, 4);
  return sameYear ? `${m}월 ${d}일` : `${y}년 ${m}월 ${d}일`;
}

export type SectionKey = ExpiryStatus | 'undated';

export const SECTION_ORDER: SectionKey[] = ['expired', 'soon', 'ok', 'undated'];

type Sortable = ExpiryFields & { name: string };

/** 실제 만료일 오름차순, 날짜 없는 항목은 맨 뒤, 같은 날이면 이름순 */
export function sortByExpiry<T extends Sortable>(items: T[]): T[] {
  return items
    .map((item) => ({ item, expiry: getEffectiveExpiry(item) }))
    .sort((a, b) => {
      if (a.expiry === b.expiry) return a.item.name.localeCompare(b.item.name);
      if (!a.expiry) return 1;
      if (!b.expiry) return -1;
      return a.expiry < b.expiry ? -1 : 1;
    })
    .map(({ item }) => item);
}

/** 상태별 섹션으로 묶는다. 빈 섹션은 빠지고 순서는 SECTION_ORDER를 따른다. */
export function groupByStatus<T extends Sortable>(
  items: T[],
  base: DateString = today(),
): { key: SectionKey; data: T[] }[] {
  const buckets: Record<SectionKey, T[]> = { expired: [], soon: [], ok: [], undated: [] };
  for (const item of sortByExpiry(items)) {
    const expiry = getEffectiveExpiry(item);
    buckets[expiry ? getStatus(getDday(expiry, base)) : 'undated'].push(item);
  }
  return SECTION_ORDER.filter((key) => buckets[key].length > 0).map((key) => ({ key, data: buckets[key] }));
}

import { describe, expect, it } from '@jest/globals';

import {
  addDays,
  addMonths,
  formatDday,
  formatRemaining,
  formatShortDate,
  getDday,
  getEffectiveExpiry,
  getStatus,
  groupByStatus,
} from '@/lib/expiry';

describe('addMonths', () => {
  it('월말을 다음 달 마지막 날로 보정한다', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-08-31', 6)).toBe('2027-02-28');
  });

  it('연도를 넘긴다', () => {
    expect(addMonths('2026-10-02', 12)).toBe('2027-10-02');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
  });
});

describe('addDays', () => {
  it('월/연 경계를 넘긴다', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('getEffectiveExpiry', () => {
  it('유통기한과 개봉 후 기한 중 이른 날짜를 쓴다', () => {
    expect(getEffectiveExpiry({ expiryDate: '2027-12-31', openedAt: '2026-10-01', paoMonths: 6 })).toBe('2027-04-01');
    expect(getEffectiveExpiry({ expiryDate: '2026-11-01', openedAt: '2026-10-01', paoMonths: 6 })).toBe('2026-11-01');
  });

  it('한쪽만 있으면 그 값을 쓴다', () => {
    expect(getEffectiveExpiry({ expiryDate: '2026-11-01', openedAt: null, paoMonths: null })).toBe('2026-11-01');
    expect(getEffectiveExpiry({ expiryDate: null, openedAt: '2026-10-01', paoMonths: 12 })).toBe('2027-10-01');
  });

  it('개봉일만 있고 PAO가 없으면 무시한다', () => {
    expect(getEffectiveExpiry({ expiryDate: null, openedAt: '2026-10-01', paoMonths: null })).toBeNull();
  });
});

describe('getDday / formatDday / getStatus', () => {
  it('경계값', () => {
    expect(getDday('2026-10-02', '2026-10-02')).toBe(0);
    expect(getDday('2026-10-05', '2026-10-02')).toBe(3);
    expect(getDday('2026-10-01', '2026-10-02')).toBe(-1);
  });

  it('서머타임 구간에서도 정수 일수', () => {
    expect(getDday('2026-11-02', '2026-10-31')).toBe(2);
    expect(getDday('2026-03-09', '2026-03-07')).toBe(2);
  });

  it('표시 형식과 상태', () => {
    expect(formatDday(0)).toBe('D-Day');
    expect(formatDday(5)).toBe('D-5');
    expect(formatDday(-2)).toBe('D+2');
    expect(getStatus(-1)).toBe('expired');
    expect(getStatus(0)).toBe('soon');
    expect(getStatus(3)).toBe('soon');
    expect(getStatus(4)).toBe('ok');
  });
});

describe('formatRemaining / formatShortDate', () => {
  it('남은 기간 문구', () => {
    expect(formatRemaining(0)).toBe('오늘까지');
    expect(formatRemaining(3)).toBe('3일 남음');
    expect(formatRemaining(-2)).toBe('2일 지남');
  });

  it('같은 해면 연도를 생략한다', () => {
    expect(formatShortDate('2026-09-30', '2026-10-02')).toBe('9월 30일');
    expect(formatShortDate('2027-01-03', '2026-10-02')).toBe('2027년 1월 3일');
  });
});

describe('groupByStatus', () => {
  const item = (name: string, expiryDate: string | null) => ({ name, expiryDate, openedAt: null, paoMonths: null });

  it('상태 순서로 묶고 빈 섹션은 뺀다', () => {
    const sections = groupByStatus(
      [item('여유', '2026-12-01'), item('날짜없음', null), item('만료B', '2026-10-01'), item('만료A', '2026-09-01')],
      '2026-10-02',
    );
    expect(sections.map((s) => s.key)).toEqual(['expired', 'ok', 'undated']);
    expect(sections[0].data.map((i) => i.name)).toEqual(['만료A', '만료B']);
  });

  it('오늘 만료는 임박으로 분류한다', () => {
    const sections = groupByStatus([item('오늘', '2026-10-02')], '2026-10-02');
    expect(sections).toEqual([{ key: 'soon', data: [item('오늘', '2026-10-02')] }]);
  });
});

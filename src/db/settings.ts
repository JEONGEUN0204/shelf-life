import type { SQLiteDatabase } from 'expo-sqlite';

export type Settings = {
  /** 새 항목의 기본 알림 시점 (만료 N일 전) */
  defaultOffsets: number[];
  notifyHour: number;
  notifyMinute: number;
};

export const DEFAULT_SETTINGS: Settings = {
  defaultOffsets: [3, 0],
  notifyHour: 9,
  notifyMinute: 0,
};

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    if (key in settings) {
      try {
        (settings as Record<string, unknown>)[key] = JSON.parse(value);
      } catch {
        // 손상된 값은 기본값 유지
      }
    }
  }
  return settings;
}

export async function saveSettings(db: SQLiteDatabase, patch: Partial<Settings>) {
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(patch)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        JSON.stringify(value),
      );
    }
  });
}

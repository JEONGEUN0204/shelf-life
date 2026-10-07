import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'shelf-life.db';

/**
 * PRAGMA user_version 기반 마이그레이션.
 * 스키마를 바꿀 때는 MIGRATIONS 끝에 새 항목을 추가한다 (기존 항목은 수정하지 말 것).
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'food',
    location TEXT NOT NULL DEFAULT 'fridge',
    expiry_date TEXT,
    opened_at TEXT,
    pao_months INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    memo TEXT,
    notify_offsets TEXT NOT NULL DEFAULT '[3,0]',
    notification_ids TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_items_status ON items(status);
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export async function migrateDb(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const migration = MIGRATIONS[version];
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration);
    });
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DateString } from '@/lib/expiry';

export type ItemStatus = 'active' | 'consumed' | 'discarded';

export type Item = {
  id: number;
  name: string;
  category: string;
  location: string;
  expiryDate: DateString | null;
  openedAt: DateString | null;
  paoMonths: number | null;
  quantity: number;
  memo: string;
  notifyOffsets: number[];
  notificationIds: string[];
  status: ItemStatus;
  createdAt: string;
};

export type ItemInput = Omit<Item, 'id' | 'notificationIds' | 'status' | 'createdAt'>;

type ItemRow = {
  id: number;
  name: string;
  category: string;
  location: string;
  expiry_date: string | null;
  opened_at: string | null;
  pao_months: number | null;
  quantity: number;
  memo: string | null;
  notify_offsets: string;
  notification_ids: string;
  status: ItemStatus;
  created_at: string;
};

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    location: row.location,
    expiryDate: row.expiry_date,
    openedAt: row.opened_at,
    paoMonths: row.pao_months,
    quantity: row.quantity,
    memo: row.memo ?? '',
    notifyOffsets: parseJsonArray<number>(row.notify_offsets),
    notificationIds: parseJsonArray<string>(row.notification_ids),
    status: row.status,
    createdAt: row.created_at,
  };
}

function inputParams(input: ItemInput) {
  return [
    input.name.trim(),
    input.category,
    input.location,
    input.expiryDate,
    input.openedAt,
    input.paoMonths,
    input.quantity,
    input.memo.trim() || null,
    JSON.stringify(input.notifyOffsets),
  ];
}

export async function listActiveItems(db: SQLiteDatabase): Promise<Item[]> {
  const rows = await db.getAllAsync<ItemRow>("SELECT * FROM items WHERE status = 'active'");
  return rows.map(toItem);
}

export async function getItem(db: SQLiteDatabase, id: number): Promise<Item | null> {
  const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', id);
  return row ? toItem(row) : null;
}

export async function insertItem(db: SQLiteDatabase, input: ItemInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO items
      (name, category, location, expiry_date, opened_at, pao_months, quantity, memo, notify_offsets, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...inputParams(input), new Date().toISOString()],
  );
  return result.lastInsertRowId;
}

export async function updateItem(db: SQLiteDatabase, id: number, input: ItemInput) {
  await db.runAsync(
    `UPDATE items SET
      name = ?, category = ?, location = ?, expiry_date = ?, opened_at = ?,
      pao_months = ?, quantity = ?, memo = ?, notify_offsets = ?
     WHERE id = ?`,
    [...inputParams(input), id],
  );
}

export async function setItemStatus(db: SQLiteDatabase, id: number, status: ItemStatus) {
  await db.runAsync('UPDATE items SET status = ? WHERE id = ?', status, id);
}

export async function deleteItem(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}

export async function setNotificationIds(db: SQLiteDatabase, id: number, ids: string[]) {
  await db.runAsync('UPDATE items SET notification_ids = ? WHERE id = ?', JSON.stringify(ids), id);
}

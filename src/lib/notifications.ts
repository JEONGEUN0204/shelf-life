import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { locationOf } from '@/constants/categories';
import { listActiveItems, setNotificationIds, type Item } from '@/db/items';
import { getSettings, type Settings } from '@/db/settings';
import { addDays, getEffectiveExpiry, parseDate } from '@/lib/expiry';

const CHANNEL_ID = 'expiry';

/** iOS는 앱당 예약 알림을 64개까지만 유지하므로 여유를 두고 제한한다. */
const MAX_SCHEDULED = 60;

type PlannedNotification = {
  itemId: number;
  date: Date;
  content: Notifications.NotificationContentInput;
};

export function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '유통기한 알림',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function getPermissionGranted(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

function planForItem(item: Item, settings: Settings, now: Date): PlannedNotification[] {
  const expiry = getEffectiveExpiry(item);
  if (!expiry || item.status !== 'active') return [];

  const location = locationOf(item.location).label;
  return [...new Set(item.notifyOffsets)].flatMap((offset) => {
    const date = parseDate(addDays(expiry, -offset));
    date.setHours(settings.notifyHour, settings.notifyMinute, 0, 0);
    if (date <= now) return [];

    return [
      {
        itemId: item.id,
        date,
        content: {
          title: offset === 0 ? `오늘 만료: ${item.name}` : `${item.name} 만료 ${offset}일 전`,
          body: `${location} · 만료일 ${expiry}`,
          data: { itemId: item.id },
        },
      },
    ];
  });
}

async function schedule(plan: PlannedNotification): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: plan.content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: plan.date,
      channelId: CHANNEL_ID,
    },
  });
}

async function cancelIds(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/** 항목 하나의 알림을 취소 후 현재 내용 기준으로 다시 예약한다. */
export async function syncItemNotifications(db: SQLiteDatabase, item: Item) {
  await cancelIds(item.notificationIds);
  const settings = await getSettings(db);
  const ids = await Promise.all(planForItem(item, settings, new Date()).map(schedule));
  await setNotificationIds(db, item.id, ids);
}

export async function cancelItemNotifications(db: SQLiteDatabase, item: Item) {
  await cancelIds(item.notificationIds);
  await setNotificationIds(db, item.id, []);
}

let resyncInFlight: Promise<void> | null = null;

/**
 * 모든 예약을 지우고 활성 항목 전체를 가까운 순서로 다시 예약한다.
 * 앱 시작/포그라운드 복귀/설정 변경 시 호출해 DB와 OS 예약 상태를 맞춘다.
 */
export function resyncAllNotifications(db: SQLiteDatabase): Promise<void> {
  // 동시에 여러 번 호출돼도 한 번만 실행
  resyncInFlight ??= (async () => {
    try {
      const [items, settings] = await Promise.all([listActiveItems(db), getSettings(db)]);
      const now = new Date();
      const plans = items
        .flatMap((item) => planForItem(item, settings, now))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, MAX_SCHEDULED);

      await Notifications.cancelAllScheduledNotificationsAsync();

      const idsByItem = new Map<number, string[]>(items.map((item) => [item.id, []]));
      for (const plan of plans) {
        idsByItem.get(plan.itemId)!.push(await schedule(plan));
      }
      await db.withTransactionAsync(async () => {
        for (const [itemId, ids] of idsByItem) {
          await setNotificationIds(db, itemId, ids);
        }
      });
    } finally {
      resyncInFlight = null;
    }
  })();
  return resyncInFlight;
}

export async function getScheduledCount(): Promise<number> {
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: { title: '테스트 알림', body: '알림이 정상적으로 동작합니다.' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  });
}

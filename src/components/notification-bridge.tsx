import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { initNotifications, requestPermission, resyncAllNotifications } from '@/lib/notifications';

/**
 * 알림 초기화, 앱 활성화 시 예약 재동기화, 알림 탭 시 항목 상세로 이동을 담당한다.
 * SQLiteProvider 안에서 렌더링해야 한다.
 */
export function NotificationBridge() {
  const db = useSQLiteContext();
  const response = Notifications.useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    initNotifications();
    requestPermission()
      .then(() => resyncAllNotifications(db))
      .catch((e) => console.warn('[notifications] init failed', e));

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        resyncAllNotifications(db).catch((e) => console.warn('[notifications] resync failed', e));
      }
    });
    return () => sub.remove();
  }, [db]);

  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handledResponseId.current === id) return;
    handledResponseId.current = id;

    const itemId = response.notification.request.content.data?.itemId;
    if (typeof itemId === 'number') {
      router.push({ pathname: '/item/[id]', params: { id: String(itemId) } });
    }
  }, [response]);

  return null;
}

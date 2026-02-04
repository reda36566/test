import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Notification, NotificationType } from '@/types';
import { notifications as seedNotifications } from '@/data/mockData';

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date_creation' | 'lue'> & { lue?: boolean; date_creation?: string }) => void;
  addNotifications: (notificationsToAdd: Array<Omit<Notification, 'id' | 'date_creation' | 'lue'> & { lue?: boolean; date_creation?: string }>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  getNotificationsByUserId: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const STORAGE_KEY = 'ensa_reports_notifications';

const buildNotification = (
  notification: Omit<Notification, 'id' | 'date_creation' | 'lue'> & { lue?: boolean; date_creation?: string }
): Notification => ({
  ...notification,
  id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  lue: notification.lue ?? false,
  date_creation: notification.date_creation ?? new Date().toISOString(),
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
        return;
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setNotifications(seedNotifications);
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  const addNotification = (
    notification: Omit<Notification, 'id' | 'date_creation' | 'lue'> & { lue?: boolean; date_creation?: string }
  ) => {
    setNotifications((prev) => [buildNotification(notification), ...prev]);
  };

  const addNotifications = (
    notificationsToAdd: Array<Omit<Notification, 'id' | 'date_creation' | 'lue'> & { lue?: boolean; date_creation?: string }>
  ) => {
    if (notificationsToAdd.length === 0) return;
    setNotifications((prev) => [
      ...notificationsToAdd.map(buildNotification),
      ...prev,
    ]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, lue: true } : notification
      )
    );
  };

  const markAllAsRead = (userId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.utilisateur_id === userId ? { ...notification, lue: true } : notification
      )
    );
  };

  const getNotificationsByUserId = (userId: string) =>
    notifications
      .filter((notification) => notification.utilisateur_id === userId)
      .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());

  const getUnreadCount = (userId: string) =>
    notifications.filter((notification) => notification.utilisateur_id === userId && !notification.lue).length;

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      addNotifications,
      markAsRead,
      markAllAsRead,
      getNotificationsByUserId,
      getUnreadCount,
    }),
    [notifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export const notificationLabels: Record<NotificationType, string> = {
  NEW_VERSION: 'Nouvelle version',
  NEW_COMMENT: 'Nouveau commentaire',
  STATUS_CHANGE: 'Changement de statut',
  GRADE_PUBLISHED: 'Note publiée',
  PLAGIARISM_ALERT: 'Alerte plagiat',
  SYSTEM: 'Notification système',
};

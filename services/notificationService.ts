// services/notificationService.ts
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('瀏覽器不支援通知功能');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('請求通知權限失敗:', error);
    return false;
  }
};

export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('無法顯示通知：權限未授予或瀏覽器不支援');
    return;
  }

  new Notification(title, options);
};
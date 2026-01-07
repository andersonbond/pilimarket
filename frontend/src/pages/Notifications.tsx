import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonNote, IonButton, IonIcon, IonButtons, IonRefresher, IonRefresherContent, RefresherEventDetail } from '@ionic/react';
import { checkmarkDone, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification } from '../types/notification';
import { notificationService } from '../services/notifications';

// Simple date formatter
const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

const Notifications: React.FC = () => {
  const history = useHistory();
  const { unreadCount, markAllAsRead } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = async (pageNum: number = 1) => {
    try {
      const response = await notificationService.getNotifications(false, pageNum, 20);
      if (pageNum === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadNotifications(1);
    event.detail.complete();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
    
    // Navigate based on notification type
    if (notification.meta_data?.market_id) {
      history.push(`/markets/${notification.meta_data.market_id}`);
    } else if (notification.type === 'badge_earned') {
      history.push('/profile');
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <IonPage>
      <Header />
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Notifications</IonTitle>
          {unreadCount > 0 && (
            <IonButtons slot="end">
              <IonButton onClick={handleMarkAllAsRead} fill="clear">
                <IonIcon icon={checkmarkDone} slot="start" />
                Mark All Read
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && notifications.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 px-4">
            <IonIcon icon={checkmarkDone} className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All caught up!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">You have no notifications</p>
          </div>
        ) : (
          <>
            <IonList>
              {notifications.map((notification) => (
                <IonItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  className={notification.read ? '' : 'bg-blue-50 dark:bg-blue-900/20'}
                >
                  <IonLabel>
                    <h3 className={notification.read ? 'text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}>
                      {notification.message}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </IonLabel>
                  {!notification.read && (
                    <IonNote slot="end" color="primary">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </IonNote>
                  )}
                </IonItem>
              ))}
            </IonList>
            
            {hasMore && (
              <div className="p-4 text-center">
                <IonButton fill="clear" onClick={handleLoadMore} disabled={loading}>
                  {loading ? 'Loading...' : 'Load More'}
                </IonButton>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Notifications;


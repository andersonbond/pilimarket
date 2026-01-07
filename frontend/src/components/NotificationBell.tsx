import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonBadge, IonPopover, IonList, IonItem, IonLabel, IonNote, IonButton as IonButtonItem } from '@ionic/react';
import { notificationsOutline, notifications as notificationsIcon } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification } from '../types/notification';
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

const NotificationBell: React.FC = () => {
  const { unreadCount, notifications, markAsRead, refreshNotifications } = useNotifications();
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState<Notification[]>([]);
  const [popoverEvent, setPopoverEvent] = useState<Event | undefined>(undefined);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  // Update display notifications
  useEffect(() => {
    setDisplayNotifications(notifications.slice(0, 5)); // Show latest 5 in dropdown
  }, [notifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.meta_data?.market_id) {
      history.push(`/markets/${notification.meta_data.market_id}`);
    } else if (notification.type === 'badge_earned') {
      history.push('/profile');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    history.push('/notifications');
  };


  return (
    <>
      <IonButton
        fill="clear"
        onClick={(e) => {
          setPopoverEvent(e.nativeEvent);
          setIsOpen(true);
        }}
        className="relative text-gray-700 dark:text-gray-300"
      >
        <IonIcon icon={unreadCount > 0 ? notificationsIcon : notificationsOutline} />
        {unreadCount > 0 && (
          <IonBadge color="danger" className="absolute top-0 right-0 -mt-1 -mr-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </IonBadge>
        )}
      </IonButton>

      <IonPopover
        isOpen={isOpen}
        onDidDismiss={() => {
          setIsOpen(false);
          setPopoverEvent(undefined);
        }}
        event={popoverEvent}
        side="bottom"
        alignment="end"
        className="notification-popover"
        showBackdrop={false}
        style={{
          '--width': '500px',
          '--min-width': '500px',
        } as React.CSSProperties}
      >
        <div className="notification-popover-content w-[500px] min-w-[500px] max-w-[90vw] min-h-[400px]">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <IonButtonItem
                fill="clear"
                size="small"
                onClick={handleViewAll}
                className="text-sm"
              >
                View All
              </IonButtonItem>
            )}
          </div>
          
          <IonList className="min-h-[320px] max-h-[500px] overflow-y-auto">
            {displayNotifications.length === 0 ? (
              <IonItem>
                <IonLabel>
                  <h3>No notifications</h3>
                  <p>You're all caught up!</p>
                </IonLabel>
              </IonItem>
            ) : (
              displayNotifications.map((notification) => (
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
              ))
            )}
          </IonList>
          
          {displayNotifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <IonButtonItem
                expand="block"
                fill="clear"
                onClick={handleViewAll}
                className="text-center"
              >
                View All Notifications
              </IonButtonItem>
            </div>
          )}
        </div>
      </IonPopover>
    </>
  );
};

export default NotificationBell;


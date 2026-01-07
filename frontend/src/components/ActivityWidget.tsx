import React, { useState, useEffect } from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonIcon, IonButton } from '@ionic/react';
import { trendingUp, trophy, add, checkmarkCircle, arrowForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { activityService } from '../services/activity';
import { Activity } from '../types/activity';

// Simple date formatter
const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'forecast_placed':
      return trendingUp;
    case 'market_resolved':
      return checkmarkCircle;
    case 'badge_earned':
      return trophy;
    case 'market_created':
      return add;
    default:
      return trendingUp;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'forecast_placed':
      return 'text-blue-500';
    case 'market_resolved':
      return 'text-green-500';
    case 'badge_earned':
      return 'text-yellow-500';
    case 'market_created':
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
};

const ActivityWidget: React.FC = () => {
  const history = useHistory();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await activityService.getGlobalFeed(1, 5);
        setActivities(response.data.activities);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
    // Refresh every 60 seconds
    const interval = setInterval(loadActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleActivityClick = (activity: Activity) => {
    if (activity.market_id) {
      history.push(`/markets/${activity.market_id}`);
    }
  };

  return (
    <IonCard className="h-full">
      <IonCardHeader>
        <div className="flex items-center justify-between">
          <IonCardTitle className="text-lg font-semibold">Recent Activity</IonCardTitle>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => history.push('/activity')}
            className="text-sm"
          >
            View All
            <IonIcon icon={arrowForward} slot="end" />
          </IonButton>
        </div>
      </IonCardHeader>
      <IonCardContent>
        {loading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <IonIcon
                  icon={getActivityIcon(activity.activity_type)}
                  className={`text-xl ${getActivityColor(activity.activity_type)} flex-shrink-0 mt-0.5`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {activity.user_display_name && (
                      <span className="font-semibold">{activity.user_display_name}</span>
                    )}
                    {activity.activity_type === 'forecast_placed' && (
                      <> placed {activity.meta_data?.points || 0} chips</>
                    )}
                    {activity.activity_type === 'market_resolved' && (
                      <> resolved a market</>
                    )}
                    {activity.activity_type === 'badge_earned' && (
                      <> earned a badge</>
                    )}
                    {activity.activity_type === 'market_created' && (
                      <> created a market</>
                    )}
                  </p>
                  {activity.market_title && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">
                      {activity.market_title}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatTime(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ActivityWidget;


import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonNote, IonButton, IonIcon, IonButtons, IonRefresher, IonRefresherContent, RefresherEventDetail, IonSegment, IonSegmentButton } from '@ionic/react';
import { arrowBack, trendingUp, trophy, add, checkmarkCircle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
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

const ActivityFeed: React.FC = () => {
  const history = useHistory();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'user' | 'global'>('user');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadActivities = async (pageNum: number = 1) => {
    try {
      let response;
      if (feedType === 'user') {
        response = await activityService.getUserFeed(pageNum, 20);
      } else {
        response = await activityService.getGlobalFeed(pageNum, 50);
      }
      
      if (pageNum === 1) {
        setActivities(response.data.activities);
      } else {
        setActivities(prev => [...prev, ...response.data.activities]);
      }
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [feedType]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    setPage(1);
    await loadActivities(1);
    event.detail.complete();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadActivities(nextPage);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.market_id) {
      history.push(`/markets/${activity.market_id}`);
    }
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
          <IonTitle>Activity Feed</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <IonSegment value={feedType} onIonChange={(e) => {
            setFeedType(e.detail.value as 'user' | 'global');
            setPage(1);
            setActivities([]);
            setLoading(true);
          }}>
            <IonSegmentButton value="user">
              <IonLabel>My Feed</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="global">
              <IonLabel>Global</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {loading && activities.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading activities...</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 px-4">
            <IonIcon icon={trendingUp} className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No activities yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">Start forecasting to see activity here</p>
          </div>
        ) : (
          <>
            <IonList>
              {activities.map((activity) => (
                <IonItem
                  key={activity.id}
                  button
                  onClick={() => handleActivityClick(activity)}
                >
                  <IonIcon
                    icon={getActivityIcon(activity.activity_type)}
                    className={`mr-3 ${getActivityColor(activity.activity_type)}`}
                    slot="start"
                  />
                  <IonLabel>
                    <h3 className="text-gray-900 dark:text-white">
                      {activity.user_display_name && (
                        <span className="font-semibold">{activity.user_display_name}</span>
                      )}
                      {activity.activity_type === 'forecast_placed' && (
                        <> placed {activity.meta_data?.points || 0} chips on </>
                      )}
                      {activity.activity_type === 'market_resolved' && (
                        <> resolved </>
                      )}
                      {activity.activity_type === 'badge_earned' && (
                        <> earned the {activity.meta_data?.badge_name || 'badge'} badge</>
                      )}
                      {activity.activity_type === 'market_created' && (
                        <> created a new market</>
                      )}
                      {activity.market_title && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {activity.market_title}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(activity.created_at)}
                    </p>
                  </IonLabel>
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

export default ActivityFeed;


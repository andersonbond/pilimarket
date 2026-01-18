import React, { useEffect, useState } from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/react';
import { trophyOutline, arrowForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import api from '../services/api';

interface LeaderboardUser {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
  rank_score: number;
  badges: string[];
}

// Generate gradient avatar colors based on user ID (same as Leaderboard page)
const getAvatarGradient = (userId: string): string => {
  const gradients = [
    'from-orange-400 to-yellow-500',
    'from-purple-400 to-pink-500',
    'from-teal-400 to-blue-500',
    'from-green-400 to-emerald-500',
    'from-red-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-pink-400 to-rose-500',
    'from-cyan-400 to-teal-500',
  ];
  
  // Use userId to consistently pick a gradient
  const index = userId.charCodeAt(0) % gradients.length;
  return gradients[index];
};

const LeaderboardWidget: React.FC = () => {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/api/v1/leaderboard?period=global&limit=10');
      if (response.data.success) {
        setTopUsers(response.data.data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setTopUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <IonCard className="shadow-sm bg-white dark:bg-gray-800">
      <IonCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IonIcon icon={trophyOutline} className="text-primary text-xl" />
            <IonCardTitle className="text-lg font-bold text-gray-900 dark:text-white">Top Forecasters</IonCardTitle>
          </div>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => history.push('/leaderboard')}
            className="text-primary-600 dark:text-primary-400 text-sm"
          >
            View All
            <IonIcon icon={arrowForward} slot="end" />
          </IonButton>
        </div>
      </IonCardHeader>
      <IonCardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : topUsers.length === 0 ? (
          <div className="text-center py-4">
            <IonIcon icon={trophyOutline} className="text-3xl text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No rankings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.slice(0, 5).map((user) => (
              <div
                key={user.rank}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => history.push(`/users/${user.user_id}/profile`)}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 text-sm flex-shrink-0">
                    {getRankIcon(user.rank)}
                  </div>
                  {/* User Avatar */}
                  <div className="relative">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm"
                        onError={(e) => {
                          // Hide image and show gradient fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`avatar-fallback w-8 h-8 bg-gradient-to-br ${getAvatarGradient(user.user_id)} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm ${user.avatar_url ? 'hidden' : 'flex'}`}>
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                      {user.display_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rep: {user.reputation.toFixed(1)} • Score: {user.rank_score.toFixed(0)}
                    </p>
                  </div>
                </div>
                {user.badges && user.badges.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-medium flex-shrink-0 ml-2">
                    {user.badges[0]}
                  </span>
                )}
              </div>
            ))}
            {topUsers.length > 5 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <IonButton
                  expand="block"
                  fill="outline"
                  size="small"
                  onClick={() => history.push('/leaderboard')}
                  className="button-primary"
                >
                  View Full Leaderboard
                </IonButton>
              </div>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default LeaderboardWidget;

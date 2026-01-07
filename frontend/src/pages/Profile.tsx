import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonButtons,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonTextarea,
} from '@ionic/react';
import {
  close,
  create,
  save,
  trophyOutline,
  trendingUp,
  statsChart,
  flameOutline,
  walletOutline,
  starOutline,
  medalOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Badge, BadgeListResponse } from '../types/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const history = useHistory();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  const [reputationHistory, setReputationHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [forecastStats, setForecastStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [leaderboardRanks, setLeaderboardRanks] = useState<any>({});
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      fetchBadges();
      fetchReputationHistory();
      fetchStats();
      fetchLeaderboardRanks();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const response = await api.get(`/api/v1/users/${user.id}/forecast-stats`);
      if (response.data.success) {
        setForecastStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchLeaderboardRanks = async () => {
    if (!user) return;
    setIsLoadingRanks(true);
    try {
      const periods = ['global', 'weekly', 'monthly'];
      const ranks: any = {};

      for (const period of periods) {
        try {
          const response = await api.get(`/api/v1/leaderboard?period=${period}&limit=1000`);
          if (response.data.success && response.data.data.users) {
            const userIndex = response.data.data.users.findIndex((u: any) => u.id === user.id);
            if (userIndex !== -1) {
              ranks[period] = {
                rank: userIndex + 1,
                ...response.data.data.users[userIndex],
              };
            }
          }
        } catch (err) {
          // Ignore errors for individual periods
        }
      }

      setLeaderboardRanks(ranks);
    } catch (err) {
      console.error('Error fetching leaderboard ranks:', err);
    } finally {
      setIsLoadingRanks(false);
    }
  };

  const fetchBadges = async () => {
    if (!user) return;
    setIsLoadingBadges(true);
    try {
      const response = await api.get<BadgeListResponse>(`/api/v1/users/${user.id}/badges`);
      if (response.data.success) {
        setBadges(response.data.data.badges);
      }
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setIsLoadingBadges(false);
    }
  };

  const fetchReputationHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const response = await api.get(`/api/v1/users/${user.id}/reputation-history`);
      if (response.data.success) {
        setReputationHistory(response.data.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching reputation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.patch('/api/v1/users/me', {
        display_name: displayName,
        bio,
      });

      if (response.data.success) {
        updateUser(response.data.data.user);
        setIsEditModalOpen(false);
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const chartData = reputationHistory
    .map((entry) => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reputation: entry.reputation,
    }))
    .reverse();

  // Reputation percentage for meter
  const reputationPercentage = user ? Math.min(100, Math.max(0, user.reputation)) : 0;

  if (!user) {
    return null;
  }

  const accuracy = forecastStats
    ? forecastStats.total_forecasts > 0
      ? ((forecastStats.won_forecasts / forecastStats.total_forecasts) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Profile Header - Enhanced */}
          <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 mt-16">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative -mt-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white dark:border-gray-800">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {user.display_name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
                    {user.bio && (
                      <p className="text-gray-700 dark:text-gray-300 mt-2 max-w-md">{user.bio}</p>
                    )}
                  </div>
                </div>
                <IonButton
                  onClick={() => setIsEditModalOpen(true)}
                  className="button-primary mt-4 md:mt-0"
                  fill="outline"
                >
                  <IonIcon icon={create} slot="start" />
                  Edit Profile
                </IonButton>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              <IonCardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <IonIcon icon={walletOutline} className="text-2xl text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chips</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₱{user.chips.toLocaleString()}
                    </p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              <IonCardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <IonIcon icon={starOutline} className="text-2xl text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reputation</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.reputation.toFixed(1)}
                    </p>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${reputationPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              <IonCardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <IonIcon icon={medalOutline} className="text-2xl text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Badges</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{badges.length}</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              <IonCardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <IonIcon icon={statsChart} className="text-2xl text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{accuracy}%</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Forecast Statistics */}
              {forecastStats && (
                <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                  <IonCardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <IonIcon icon={statsChart} className="text-primary-500 text-xl" />
                      <IonCardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Forecast Performance
                      </IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {forecastStats.total_forecasts || 0}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <IonIcon icon={checkmarkCircleOutline} className="text-green-600 dark:text-green-400" />
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {forecastStats.won_forecasts || 0}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Won</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <IonIcon icon={closeCircleOutline} className="text-red-600 dark:text-red-400" />
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {forecastStats.lost_forecasts || 0}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Lost</p>
                      </div>
                      <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                          {accuracy}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Accuracy</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Reputation History Chart */}
              {reputationHistory.length > 0 && (
                <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                  <IonCardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <IonIcon icon={trendingUp} className="text-primary-500 text-xl" />
                      <IonCardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Reputation Trend
                      </IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent className="p-6">
                    {isLoadingHistory ? (
                      <div className="flex justify-center items-center h-64">
                        <IonSpinner name="crescent" color="primary" />
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorReputation" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f7b801" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f7b801" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-700" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#6b7280', fontSize: 12 }}
                              stroke="#9ca3af"
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fill: '#6b7280', fontSize: 12 }}
                              stroke="#9ca3af"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--ion-background-color)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                              }}
                              labelStyle={{ color: 'var(--ion-text-color)', fontWeight: 'bold' }}
                              itemStyle={{ color: 'var(--ion-text-color)' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="reputation"
                              stroke="#f7b801"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorReputation)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              )}

              {/* Badges Section */}
              <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <IonCardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <IonIcon icon={trophyOutline} className="text-primary-500 text-xl" />
                    <IonCardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Achievements
                    </IonCardTitle>
                  </div>
                </IonCardHeader>
                <IonCardContent className="p-6">
                  {isLoadingBadges ? (
                    <div className="flex justify-center py-8">
                      <IonSpinner name="crescent" color="primary" />
                    </div>
                  ) : badges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {badges.map((badge) => (
                        <div
                          key={badge.id}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer group"
                          title={badge.description}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-4xl transform group-hover:scale-110 transition-transform">
                              {badge.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                                {badge.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {badge.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <IonIcon icon={trophyOutline} className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        No badges yet
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Start forecasting to earn achievements!
                      </p>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Leaderboard Rankings */}
              <IonCard className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <IonCardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IonIcon icon={trophyOutline} className="text-primary-500 text-xl" />
                      <IonCardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Rankings
                      </IonCardTitle>
                    </div>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => history.push('/leaderboard')}
                      className="text-primary-600 dark:text-primary-400"
                    >
                      <IonIcon icon={arrowForwardOutline} slot="end" />
                    </IonButton>
                  </div>
                </IonCardHeader>
                <IonCardContent className="p-6">
                  {isLoadingRanks ? (
                    <div className="flex justify-center py-8">
                      <IonSpinner name="crescent" color="primary" />
                    </div>
                  ) : Object.keys(leaderboardRanks).length > 0 ? (
                    <div className="space-y-4">
                      {['global', 'weekly', 'monthly'].map((period) => {
                        const rank = leaderboardRanks[period];
                        if (!rank) return null;
                        return (
                          <div
                            key={period}
                            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                {period}
                              </span>
                              {rank.rank <= 3 && (
                                <span className="text-2xl">
                                  {rank.rank === 1 ? '🥇' : rank.rank === 2 ? '🥈' : '🥉'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                #{rank.rank}
                              </span>
                            </div>
                            {rank.winning_streak > 0 && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                <IonIcon icon={flameOutline} />
                                <span className="font-medium">{rank.winning_streak} win streak</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <IonIcon icon={trophyOutline} className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Start forecasting to appear on the leaderboard!
                      </p>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <IonModal isOpen={isEditModalOpen} onDidDismiss={() => setIsEditModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Profile</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsEditModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md mx-auto mt-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <IonCard className="bg-white dark:bg-gray-800 mb-4">
                <IonCardContent className="p-4">
                  <IonItem className="rounded-lg mb-4" lines="none">
                    <IonLabel position="stacked">Display Name</IonLabel>
                    <IonInput
                      type="text"
                      value={displayName}
                      onIonInput={(e) => setDisplayName(e.detail.value!)}
                      placeholder="Display name"
                      className="px-4 py-3"
                    />
                  </IonItem>

                  <IonItem className="rounded-lg" lines="none">
                    <IonLabel position="stacked">Bio</IonLabel>
                    <IonTextarea
                      value={bio}
                      onIonInput={(e) => setBio(e.detail.value!)}
                      placeholder="Tell us about yourself"
                      rows={4}
                      className="px-4 py-3"
                    />
                  </IonItem>
                </IonCardContent>
              </IonCard>

              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={isLoading}
                className="button-primary"
              >
                <IonIcon icon={save} slot="start" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Profile;

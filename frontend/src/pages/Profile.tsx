import React, { useState, useEffect, useMemo } from 'react';
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
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  close,
  create,
  save,
  statsChart,
  searchOutline,
  timeOutline,
  eyeOutline,
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { User } from '../types/user';
import { Forecast } from '../types/forecast';
import { activityService } from '../services/activity';
import { Activity } from '../types/activity';
import { Badge } from '../types/badge';
// Simple date formatter (avoiding date-fns dependency)
const formatTimeAgo = (dateString: string): string => {
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

// Generate gradient avatar colors based on user ID
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
  const index = userId.charCodeAt(0) % gradients.length;
  return gradients[index];
};

interface ForecastWithMarket extends Forecast {
  market_title?: string;
  outcome_name?: string;
  market_status?: string;
  current_consensus?: number;
}

const Profile: React.FC = () => {
  const { user: currentUser, updateUser } = useAuth();
  const history = useHistory();
  const { userId } = useParams<{ userId?: string }>();
  
  // Determine which user's profile to show
  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  // Profile data state
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forecastStats, setForecastStats] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // New states for redesigned profile
  const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');
  const [positionFilter, setPositionFilter] = useState<'active' | 'closed'>('active');
  const [profitLossPeriod, setProfitLossPeriod] = useState<'all' | '1d' | '1w' | '1m'>('all');
  const [forecasts, setForecasts] = useState<ForecastWithMarket[]>([]);
  const [isLoadingForecasts, setIsLoadingForecasts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);

  // Fetch profile user data
  useEffect(() => {
    if (profileUserId) {
      fetchProfileUser();
    }
  }, [profileUserId]);

  // Fetch profile data when profileUser is loaded
  useEffect(() => {
    if (profileUser) {
      setDisplayName(profileUser.display_name || '');
      setBio(profileUser.bio || '');
      setAvatarPreview(null); // Reset preview when modal opens
      fetchStats();
      fetchForecasts(); // Fetch forecasts for both own and public profiles
      fetchBadges(); // Fetch badges
      if (activeTab === 'activity') {
        fetchActivities(1, true);
      }
    }
  }, [profileUser, isOwnProfile]);

  // Fetch activities when activity tab is active
  useEffect(() => {
    if (profileUser && activeTab === 'activity') {
      fetchActivities(1, true);
    }
  }, [activeTab, profileUser]);

  const fetchProfileUser = async () => {
    if (!profileUserId) return;
    
    setIsLoadingProfile(true);
    try {
      if (isOwnProfile && currentUser) {
        setProfileUser(currentUser);
      } else {
        const response = await api.get(`/api/v1/users/${profileUserId}/profile`);
        if (response.data.success) {
          setProfileUser(response.data.data.user);
        } else {
          setProfileUser(null);
        }
      }
    } catch (err) {
      console.error('Error fetching profile user:', err);
      setProfileUser(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchStats = async () => {
    if (!profileUserId) return;
    try {
      // Stats are included in the profile response
      const response = await api.get(`/api/v1/users/${profileUserId}/profile`);
      if (response.data.success && response.data.data.stats) {
        setForecastStats(response.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchBadges = async () => {
    if (!profileUserId) return;
    setIsLoadingBadges(true);
    try {
      const response = await api.get(`/api/v1/users/${profileUserId}/badges`);
      if (response.data.success && response.data.data.badges) {
        setBadges(response.data.data.badges);
          }
        } catch (err) {
      console.error('Error fetching badges:', err);
      setBadges([]);
    } finally {
      setIsLoadingBadges(false);
    }
  };

  const fetchForecasts = async () => {
    if (!profileUserId) return;
    setIsLoadingForecasts(true);
    try {
      // Fetch all forecasts with pagination
      // For public profiles, use public_only=true to get resolved forecasts only
      let allForecasts: ForecastWithMarket[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const url = isOwnProfile 
          ? `/api/v1/users/${profileUserId}/forecasts?page=${page}&limit=100`
          : `/api/v1/users/${profileUserId}/forecasts?page=${page}&limit=100&public_only=true`;
        const response = await api.get(url);
      if (response.data.success) {
          const forecasts = response.data.data.forecasts || [];
          allForecasts = [...allForecasts, ...forecasts];
          
          const pagination = response.data.data.pagination;
          hasMore = page < pagination.pages;
          page++;
        } else {
          hasMore = false;
        }
      }

      setForecasts(allForecasts);
      console.log('Fetched forecasts:', allForecasts.length, 'isOwnProfile:', isOwnProfile);
    } catch (err: any) {
      console.error('Error fetching forecasts:', err);
      console.error('Error details:', err.response?.data || err.message);
      setForecasts([]);
    } finally {
      setIsLoadingForecasts(false);
    }
  };

  const fetchActivities = async (pageNum: number = 1, reset: boolean = false) => {
    if (!profileUserId) return;
    setIsLoadingActivities(true);
    try {
      const response = await activityService.getUserActivity(profileUserId, pageNum, 20);
      if (response.success) {
        if (reset) {
          setActivities(response.data.activities);
        } else {
          setActivities(prev => [...prev, ...response.data.activities]);
        }
        setHasMoreActivities(response.data.pagination.page < response.data.pagination.pages);
        setActivityPage(pageNum);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, WebP, HEIC, or HEIF image');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploadingAvatar(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/v1/users/me/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const avatarUrl = response.data.data.avatar_url;
        // Update profile user with new avatar URL
        if (profileUser) {
          const updatedUser = { ...profileUser, avatar_url: avatarUrl };
          setProfileUser(updatedUser);
          updateUser(updatedUser);
        }
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to upload avatar');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await api.patch('/api/v1/users/me', {
        display_name: displayName,
        bio,
        avatar_url: profileUser?.avatar_url, // Include current avatar_url
      });

      if (response.data.success) {
        const updatedUser = response.data.data.user;
        updateUser(updatedUser);
        setProfileUser(updatedUser);
        setIsEditModalOpen(false);
        setAvatarPreview(null);
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate profit/loss - use stats for public profiles, forecasts for own profile
  const profitLoss = useMemo(() => {
    // If we have forecasts (own profile), calculate from forecasts with period filter
    if (forecasts && forecasts.length > 0) {
      // Filter by period
      let filteredForecasts = [...forecasts];
      const now = new Date();
      
      if (profitLossPeriod === '1d') {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredForecasts = filteredForecasts.filter(f => new Date(f.created_at) >= oneDayAgo);
      } else if (profitLossPeriod === '1w') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredForecasts = filteredForecasts.filter(f => new Date(f.created_at) >= oneWeekAgo);
      } else if (profitLossPeriod === '1m') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredForecasts = filteredForecasts.filter(f => new Date(f.created_at) >= oneMonthAgo);
      }
      
      return filteredForecasts.reduce((total, forecast) => {
        if (forecast.status === 'won') {
          if (forecast.reward_amount) {
            return total + (forecast.reward_amount - forecast.points);
          } else {
            return total + Math.floor(forecast.points * 0.5);
          }
        } else if (forecast.status === 'lost') {
          return total - forecast.points;
        }
        return total;
      }, 0);
    }
    
    // For public profiles, use stats (only shows all-time, period filtering not available)
    if (forecastStats && forecastStats.profit_loss !== undefined) {
      return forecastStats.profit_loss;
    }
    
    return 0;
  }, [forecasts, forecastStats, profitLossPeriod]);

  // Calculate positions value (active forecasts)
  const positionsValue = useMemo(() => {
    // Always prioritize forecastStats as it's the source of truth from the database
    // This works for both own and public profiles
    if (forecastStats && forecastStats.positions_value !== undefined) {
      return forecastStats.positions_value;
    }
    
    // Fallback: calculate from forecasts if stats not available yet
    // This is mainly for own profiles where we have all forecasts loaded
    if (forecasts && forecasts.length > 0) {
      const pendingForecasts = forecasts.filter(f => f.status === 'pending');
      return pendingForecasts.reduce((total, forecast) => total + forecast.points, 0);
    }
    
    return 0;
  }, [forecasts, forecastStats]);

  // Get biggest win
  const biggestWin = useMemo(() => {
    // If we have forecasts (own profile), calculate from forecasts
    if (forecasts && forecasts.length > 0) {
      const wonForecasts = forecasts.filter(f => f.status === 'won');
      if (wonForecasts.length === 0) return null;
      
      const win = wonForecasts.reduce((max, f) => {
        const profit = f.reward_amount 
          ? (f.reward_amount - f.points)
          : Math.floor(f.points * 0.5);
        const maxProfit = max.reward_amount 
          ? (max.reward_amount - max.points)
          : Math.floor(max.points * 0.5);
        return profit > maxProfit ? f : max;
      });
      
      return win.reward_amount 
        ? (win.reward_amount - win.points)
        : Math.floor(win.points * 0.5);
    }
    
    // For public profiles, use stats
    if (forecastStats && forecastStats.biggest_win !== undefined && forecastStats.biggest_win !== null) {
      return forecastStats.biggest_win;
    }
    
    return null;
  }, [forecasts, forecastStats]);

  // Filter positions
  const filteredPositions = useMemo(() => {
    // For public profiles, only show resolved positions (won/lost)
    if (!isOwnProfile) {
      let filtered = forecasts.filter(f => f.status === 'won' || f.status === 'lost');
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(f => 
          f.market_title?.toLowerCase().includes(query) ||
          f.outcome_name?.toLowerCase().includes(query)
        );
      }
      return filtered;
    }

    // For own profile, show both active and closed based on filter
    let filtered = forecasts.filter(f => {
      if (positionFilter === 'active') {
        return f.status === 'pending';
      } else {
        return f.status === 'won' || f.status === 'lost';
      }
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.market_title?.toLowerCase().includes(query) ||
        f.outcome_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [forecasts, positionFilter, searchQuery, isOwnProfile]);

  // Prepare profit/loss chart data - filter by period and calculate cumulative
  const profitLossChartData = useMemo(() => {
    // Only show chart if we have forecasts (own profile)
    // For public profiles, show a simple line with current profit/loss
    if (!forecasts || forecasts.length === 0) {
      // For public profiles, show a simple chart with current profit/loss
      const currentProfitLoss = forecastStats?.profit_loss || 0;
      return [
        { date: 'Start', value: 0 },
        { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: currentProfitLoss }
      ];
    }
    
    // Filter forecasts by period
    let filteredForecasts = [...forecasts];
    const now = new Date();
    
    if (profitLossPeriod === '1d') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filteredForecasts = filteredForecasts.filter(f => new Date(f.created_at) >= oneDayAgo);
    } else if (profitLossPeriod === '1w') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredForecasts = filteredForecasts.filter(f => new Date(f.created_at) >= oneWeekAgo);
    } else if (profitLossPeriod === '1m') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredForecasts = filteredForecasts.filter(f => new Date(f.created_at) >= oneMonthAgo);
    }
    
    // Only include resolved forecasts (won/lost) for chart
    const resolvedForecasts = filteredForecasts.filter(f => f.status === 'won' || f.status === 'lost');
    
    // Sort by date
    const sortedForecasts = resolvedForecasts.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    let cumulative = 0;
    const data: { date: string; value: number }[] = [];
    
    // Add starting point
    if (sortedForecasts.length > 0) {
      const firstDate = new Date(sortedForecasts[0].created_at);
      data.push({ 
        date: firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        value: 0 
      });
    }
    
    sortedForecasts.forEach(forecast => {
      if (forecast.status === 'won') {
        if (forecast.reward_amount) {
          cumulative += (forecast.reward_amount - forecast.points);
        } else {
          cumulative += Math.floor(forecast.points * 0.5);
        }
      } else if (forecast.status === 'lost') {
        cumulative -= forecast.points;
      }
      
      const date = new Date(forecast.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      data.push({ date, value: cumulative });
    });

    return data.length > 0 ? data : [{ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: 0 }];
  }, [forecasts, forecastStats, profitLossPeriod]);

  // Format join date
  const joinDate = profileUser?.created_at 
    ? new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  if (isLoadingProfile) {
    return (
      <IonPage>
        <Header />
        <IonContent className="ion-padding">
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!profileUser) {
    return (
      <IonPage>
        <Header />
        <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto py-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The user profile you're looking for doesn't exist.</p>
            <IonButton onClick={() => history.push('/')} className="button-primary">
              Go Home
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Top Section - User Info & Profit/Loss */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column - User Profile */}
            <div className="lg:col-span-2">
              <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                <IonCardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      {profileUser.avatar_url ? (
                        <img
                          src={profileUser.avatar_url}
                          alt={profileUser.display_name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0 shadow-md"
                          onError={(e) => {
                            // Hide image and show gradient fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`avatar-fallback w-16 h-16 bg-gradient-to-br ${getAvatarGradient(profileUser.id)} rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md ${profileUser.avatar_url ? 'hidden' : 'flex'}`}
                      >
                        {profileUser.display_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {profileUser.display_name}
                    </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <IonIcon icon={timeOutline} className="text-base" />
                          Joined {joinDate}
                        </span>
                    {isOwnProfile && (
                          <span className="flex items-center gap-1">
                            <IonIcon icon={eyeOutline} className="text-base" />
                            Profile views
                          </span>
                    )}
                  </div>
                      
                      {/* Badges */}
                      {badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {badges.map((badge) => (
                            <div
                              key={badge.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-700 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300"
                              title={badge.description}
                            >
                              <span className="text-base">{badge.icon}</span>
                              <span>{badge.name}</span>
              </div>
                          ))}
            </div>
                      )}
                      
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Positions Value</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {positionsValue.toLocaleString()}
                          </p>
                  </div>
                  <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Biggest Win</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {biggestWin !== null ? biggestWin.toLocaleString() : '—'}
                    </p>
                  </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Predictions</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {forecastStats?.total_forecasts || 0}
                          </p>
                    </div>
                  </div>
                </div>

                    {/* Edit Button */}
                    {isOwnProfile && (
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex-shrink-0"
                      >
                        <IonIcon icon={create} slot="start" />
                        Edit
                      </IonButton>
                    )}
                </div>
              </IonCardContent>
            </IonCard>
          </div>

            {/* Right Column - Profit/Loss */}
            <div className="lg:col-span-1">
              <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                <IonCardHeader className="pb-3">
                      <IonCardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Profit/Loss
                      </IonCardTitle>
                  </IonCardHeader>
                <IonCardContent>
                  <div className="mb-4">
                    <p className={`text-3xl font-bold ${profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString()}
                    </p>
                      </div>

                  {/* Timeframe Tabs - Only show for own profile (when we have forecasts) */}
                  {isOwnProfile && forecasts.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {(['all', '1d', '1w', '1m'] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setProfitLossPeriod(period)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            profitLossPeriod === period
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {period === 'all' ? 'All-Time' : period.toUpperCase()}
                        </button>
                      ))}
                        </div>
                  )}

                  {/* Profit/Loss Chart */}
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={profitLossChartData}>
                            <defs>
                          <linearGradient id="colorProfitLoss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={profitLoss >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={profitLoss >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={profitLoss >= 0 ? "#10b981" : "#ef4444"}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorProfitLoss)"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--ion-background-color)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                          }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  </IonCardContent>
                </IonCard>
                  </div>
                    </div>

          {/* Bottom Section - Positions/Activity Tabs */}
          <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
            <IonCardContent className="p-0">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <IonSegment
                  value={activeTab}
                  onIonChange={(e) => setActiveTab(e.detail.value as any)}
                  className="bg-transparent"
                >
                  <IonSegmentButton value="positions">
                    <IonLabel>Positions</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="activity">
                    <IonLabel>Activity</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
                            </div>

              {/* Positions Tab Content */}
              {activeTab === 'positions' && (
                <div className="p-4">
                  {/* Sub-tabs and Search - Only show Active/Closed for own profile */}
                  {isOwnProfile && (
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPositionFilter('active')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            positionFilter === 'active'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setPositionFilter('closed')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            positionFilter === 'closed'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Closed
                        </button>
                            </div>
                      <div className="flex-1 relative">
                        <IonItem className="rounded-lg border border-gray-200 dark:border-gray-700" lines="none">
                          <IonIcon icon={searchOutline} slot="start" className="text-gray-400" />
                          <IonInput
                            value={searchQuery}
                            placeholder="Search positions"
                            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
                            className="text-gray-900 dark:text-white"
                          />
                        </IonItem>
                          </div>
                        </div>
                  )}

                  {/* For public profiles, show search only */}
                  {!isOwnProfile && (
                    <div className="mb-4">
                      <IonItem className="rounded-lg border border-gray-200 dark:border-gray-700" lines="none">
                        <IonIcon icon={searchOutline} slot="start" className="text-gray-400" />
                        <IonInput
                          value={searchQuery}
                          placeholder="Search resolved positions"
                          onIonInput={(e) => setSearchQuery(e.detail.value || '')}
                          className="text-gray-900 dark:text-white"
                        />
                      </IonItem>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-4">
                        Only resolved positions (won/lost) are visible
                      </p>
                    </div>
                  )}

                      {/* Positions Table */}
                      {isLoadingForecasts ? (
                        <div className="flex justify-center items-center py-12">
                          <IonSpinner name="crescent" />
                      </div>
                      ) : filteredPositions.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500 dark:text-gray-400">
                            {!isOwnProfile 
                              ? 'No resolved positions found'
                              : `No ${positionFilter} positions found`
                            }
                          </p>
                    </div>
                      ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              MARKET
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              PREDICTION
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              POINTS
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              STATUS
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              VALUE
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredPositions.map((forecast) => {
                            const isWon = forecast.status === 'won';
                            const isLost = forecast.status === 'lost';
                            const isPending = forecast.status === 'pending';
                            const profit = isWon && forecast.reward_amount 
                              ? (forecast.reward_amount - forecast.points)
                              : isLost ? -forecast.points : 0;
                            const profitPercent = isPending ? 0 : ((profit / forecast.points) * 100);

                        return (
                              <tr
                                key={forecast.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                onClick={() => forecast.market_id && history.push(`/markets/${forecast.market_id}`)}
                              >
                                <td className="px-4 py-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                                    {forecast.market_title || 'Unknown Market'}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    forecast.outcome_name?.toLowerCase() === 'yes'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                  }`}>
                                    {forecast.outcome_name || 'N/A'}
                              </span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {forecast.points.toLocaleString()} chips
                                </span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    isPending
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                      : isWon
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                  }`}>
                                    {isPending ? 'Pending' : isWon ? 'Won' : 'Lost'}
                              </span>
                                </td>
                                <td className="px-4 py-4">
                                  {isPending ? (
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {forecast.points.toLocaleString()}
                                    </span>
                                  ) : (
                                    <div>
                                      <div className={`text-sm font-semibold ${
                                        profit >= 0
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`}>
                                        {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                            </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)
                              </div>
                          </div>
                                  )}
                                </td>
                              </tr>
                        );
                      })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab Content */}
              {activeTab === 'activity' && (
                <div className="p-4">
                  {isLoadingActivities && activities.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                      <IonSpinner name="crescent" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-12">
                      <IonIcon icon={statsChart} className="text-4xl text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => {
                        const getActivityIcon = (type: string) => {
                          switch (type) {
                            case 'forecast_placed':
                              return '📊';
                            case 'market_resolved':
                              return '✅';
                            case 'badge_earned':
                              return '🏆';
                            case 'market_created':
                              return '➕';
                            default:
                              return '📈';
                          }
                        };

                        const getActivityMessage = (activity: Activity) => {
                          const userName = activity.user_display_name || 'User';
                          const marketTitle = activity.market_title || 'a market';
                          
                          switch (activity.activity_type) {
                            case 'forecast_placed':
                              return `${userName} placed a forecast on "${marketTitle}"`;
                            case 'market_resolved':
                              return `Market "${marketTitle}" was resolved`;
                            case 'badge_earned':
                              return `${userName} earned a badge`;
                            case 'market_created':
                              return `${userName} created market "${marketTitle}"`;
                            default:
                              return `${userName} performed an action`;
                          }
                        };

                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            onClick={() => activity.market_id && history.push(`/markets/${activity.market_id}`)}
                          >
                            <div className="text-2xl flex-shrink-0">
                              {getActivityIcon(activity.activity_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {getActivityMessage(activity)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                          </div>
                        );
                      })}
                      
                      {hasMoreActivities && (
                        <div className="flex justify-center mt-4">
                          <IonButton
                            fill="clear"
                            onClick={() => fetchActivities(activityPage + 1, false)}
                            disabled={isLoadingActivities}
                          >
                            {isLoadingActivities ? (
                              <IonSpinner name="crescent" />
                            ) : (
                              'Load More'
                            )}
                          </IonButton>
                        </div>
              )}
            </div>
                  )}
          </div>
              )}
            </IonCardContent>
          </IonCard>
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
                  {/* Avatar Upload */}
                  <div className="mb-6">
                    <IonLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profile Photo
                    </IonLabel>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {(avatarPreview || profileUser?.avatar_url) ? (
                          <img
                            src={avatarPreview || profileUser?.avatar_url}
                            alt="Avatar preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className={`w-20 h-20 bg-gradient-to-br ${getAvatarGradient(profileUser?.id || '')} rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-200 dark:border-gray-700`}>
                            {profileUser?.display_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <IonSpinner name="crescent" color="light" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="avatar-upload"
                          disabled={isUploadingAvatar}
                        />
                        <label
                          htmlFor="avatar-upload"
                          className={`inline-block px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                            isUploadingAvatar
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          JPEG, PNG, GIF, WebP, HEIC (max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>

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

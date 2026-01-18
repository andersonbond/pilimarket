import React, { useEffect, useState, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonInput,
  IonItem,
} from '@ionic/react';
import { trophyOutline, searchOutline, chevronDownOutline, informationCircleOutline, close } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';

interface LeaderboardUser {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
  rank_score: number;
  winning_streak?: number;
  activity_streak?: number;
  total_forecasts?: number;
  badges: string[];
  profit_loss?: number;
  volume?: number;
}

interface BiggestWin {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  avatar_gradient?: string;
  event: string;
  initial_amount: number;
  final_amount: number;
}

interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardUser[];
    user_rank?: LeaderboardUser;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'election', label: 'Election' },
  { value: 'politics', label: 'Politics' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'economy', label: 'Economy' },
  { value: 'weather', label: 'Weather' },
];

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
  
  // Use userId to consistently pick a gradient
  const index = userId.charCodeAt(0) % gradients.length;
  return gradients[index];
};

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [sortBy, setSortBy] = useState<'profit_loss' | 'volume'>('profit_loss');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [biggestWins, setBiggestWins] = useState<BiggestWin[]>([]);
  const [isLoadingWins, setIsLoadingWins] = useState(false);

  // Map frontend period to backend period
  const backendPeriod = period === 'today' ? 'weekly' : period === 'all' ? 'global' : period;

  useEffect(() => {
    fetchLeaderboard();
    fetchBiggestWins();
  }, [backendPeriod, category, page]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCategoryDropdown && !target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<LeaderboardResponse>(
        `/api/v1/leaderboard?period=${backendPeriod}&category=${category}&page=${page}&limit=50`
      );
      if (response.data.success) {
        setUsers(response.data.data.leaderboard || []);
        setUserRank(response.data.data.user_rank || null);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBiggestWins = async () => {
    setIsLoadingWins(true);
    try {
      const response = await api.get<{ success: boolean; data: { wins: any[] } }>(
        '/api/v1/leaderboard/biggest-wins?limit=8'
      );
      if (response.data.success && response.data.data.wins) {
        const wins = response.data.data.wins.map((win) => ({
          rank: win.rank,
          user_id: win.user_id,
          display_name: win.display_name,
          avatar_url: win.avatar_url,
          avatar_gradient: getAvatarGradient(win.user_id),
          event: win.market_title || 'Market Event',
          initial_amount: win.initial_amount || 0,
          final_amount: win.final_amount || win.initial_amount || 0,
        }));
        setBiggestWins(wins);
      }
    } catch (error) {
      console.error('Error fetching biggest wins:', error);
      setBiggestWins([]);
    } finally {
      setIsLoadingWins(false);
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u) =>
        u.display_name.toLowerCase().includes(query)
      );
    }

    // Sort by selected column
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'profit_loss') {
        return (b.profit_loss || 0) - (a.profit_loss || 0);
      } else {
        return (b.volume || 0) - (a.volume || 0);
      }
    });

    return filtered;
  }, [users, searchQuery, sortBy]);


  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString();
  };

  const isCurrentUser = (userId: string) => {
    return user && user.id === userId;
  };

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Leaderboard
            </h1>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Leaderboard */}
            <div className="lg:col-span-2 space-y-4">
              {/* Period Tabs */}
              <IonCard className="bg-white dark:bg-gray-800">
                <IonCardContent className="p-0">
                  <IonSegment
                    value={period}
                    onIonChange={(e) => {
                      setPeriod(e.detail.value as any);
                      setPage(1);
                    }}
                    className="bg-gray-100 dark:bg-gray-700"
                  >
                    <IonSegmentButton value="today">
                      <IonLabel>Today</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="weekly">
                      <IonLabel>Weekly</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="monthly">
                      <IonLabel>Monthly</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="all">
                      <IonLabel>All</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>
                </IonCardContent>
              </IonCard>

              {/* Search and Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <IonItem className="rounded-lg border border-gray-200 dark:border-gray-700" lines="none">
                    <IonIcon icon={searchOutline} slot="start" className="text-gray-400" />
                    <IonInput
                      value={searchQuery}
                      placeholder="Search by name"
                      onIonInput={(e) => setSearchQuery(e.detail.value || '')}
                      className="text-gray-900 dark:text-white"
                    />
                  </IonItem>
                </div>
                <div className="relative category-dropdown-container">
                  <IonButton
                    fill="outline"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full sm:w-auto"
                  >
                    {CATEGORIES.find((c) => c.value === category)?.label || 'All Categories'}
                    <IonIcon icon={chevronDownOutline} slot="end" />
                  </IonButton>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => {
                            setCategory(cat.value);
                            setShowCategoryDropdown(false);
                            setPage(1);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            category === cat.value
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Leaderboard Table */}
              <IonCard className="bg-white dark:bg-gray-800">
                <IonCardContent className="p-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <IonSpinner name="crescent" />
                    </div>
                  ) : filteredAndSortedUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <IonIcon icon={trophyOutline} className="text-4xl text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No users found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              Rank
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              User
                            </th>
                            <th
                              className={`px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer transition-colors ${
                                sortBy === 'profit_loss'
                                  ? 'text-primary-600 dark:text-primary-400 underline'
                                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                              }`}
                              onClick={() => setSortBy('profit_loss')}
                            >
                              Profit/Loss
                            </th>
                            <th
                              className={`px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer transition-colors ${
                                sortBy === 'volume'
                                  ? 'text-primary-600 dark:text-primary-400 underline'
                                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                              }`}
                              onClick={() => setSortBy('volume')}
                            >
                              Volume
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredAndSortedUsers.map((userEntry) => (
                            <tr
                              key={userEntry.user_id}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                                isCurrentUser(userEntry.user_id)
                                  ? 'bg-primary-50/50 dark:bg-primary-900/20'
                                  : ''
                              }`}
                              onClick={() => history.push(`/users/${userEntry.user_id}/profile`)}
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {userEntry.rank <= 3 ? (
                                    <span className="text-2xl">
                                      {userEntry.rank === 1 ? '🥇' : userEntry.rank === 2 ? '🥈' : '🥉'}
                                    </span>
                                  ) : (
                                    `#${userEntry.rank}`
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {userEntry.avatar_url ? (
                                      <img
                                        src={userEntry.avatar_url}
                                        alt={userEntry.display_name}
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-sm"
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
                                      className={`avatar-fallback w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                                        userEntry.user_id
                                      )} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 relative shadow-sm ${userEntry.avatar_url ? 'hidden' : 'flex'}`}
                                    >
                                      {userEntry.rank <= 3 && (
                                        <IonIcon
                                          icon={trophyOutline}
                                          className="absolute -top-1 -right-1 text-yellow-400 text-lg drop-shadow-md"
                                        />
                                      )}
                                      {userEntry.display_name.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {userEntry.display_name}
                                      {isCurrentUser(userEntry.user_id) && (
                                        <span className="ml-2 text-xs text-primary font-semibold">(You)</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div
                                  className={`text-sm font-semibold ${
                                    (userEntry.profit_loss || 0) >= 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {(userEntry.profit_loss || 0) >= 0 ? '+' : ''}
                                  {formatCurrency(userEntry.profit_loss || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white font-medium">
                                  {formatCurrency(userEntry.volume || 0)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {!isLoading && filteredAndSortedUsers.length > 0 && pagination.pages > 1 && (
                    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {pagination.page} of {pagination.pages}
                      </div>
                      <div className="flex gap-2">
                        <IonButton
                          fill="outline"
                          size="small"
                          disabled={pagination.page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Previous
                        </IonButton>
                        <IonButton
                          fill="outline"
                          size="small"
                          disabled={pagination.page >= pagination.pages}
                          onClick={() => setPage(page + 1)}
                        >
                          Next
                        </IonButton>
                      </div>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>

            {/* Right Column - Biggest Wins */}
            <div className="lg:col-span-1">
              <IonCard className="bg-white dark:bg-gray-800">
                <IonCardContent className="p-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Biggest wins this month
                  </h2>
                  {isLoadingWins ? (
                    <div className="flex justify-center items-center py-8">
                      <IonSpinner name="crescent" />
                    </div>
                  ) : biggestWins.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No wins to display this month
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {biggestWins.map((win) => (
                        <div
                          key={`${win.user_id}-${win.rank}`}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => history.push(`/users/${win.user_id}/profile`)}
                        >
                          <div className="flex-shrink-0">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              #{win.rank}
                            </span>
                          </div>
                          <div className="relative">
                            {win.avatar_url ? (
                              <img
                                src={win.avatar_url}
                                alt={win.display_name}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
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
                              className={`avatar-fallback w-8 h-8 rounded-full bg-gradient-to-br ${win.avatar_gradient || getAvatarGradient(win.user_id)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${win.avatar_url ? 'hidden' : 'flex'}`}
                            >
                              {win.display_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {win.display_name.length > 15
                                ? `${win.display_name.substring(0, 15)}...`
                                : win.display_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {win.event}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(win.initial_amount)} → {formatCurrency(win.final_amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        </div>
      </IonContent>

      {/* Certificate Info Modal */}
      <IonModal isOpen={showCertificateModal} onDidDismiss={() => setShowCertificateModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Digital Certificate</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowCertificateModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto py-6">
            <div className="bg-white dark:bg-gray-800 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-8 shadow-lg mb-6">
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-full text-sm font-bold mb-2">
                    ACBMARKET CERTIFICATE OF EXCELLENCE
                  </div>
                </div>
                <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Top Forecaster
                </h4>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                  <span className="font-semibold">January 2026</span> Cycle
                </p>
              </div>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Leaderboard;

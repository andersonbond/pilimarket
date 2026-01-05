import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonSpinner, IonButton, IonIcon } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { arrowBack } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { Market, MarketDetailResponse } from '../types/market';
import { useAuth } from '../contexts/AuthContext';

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { isAuthenticated, user } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<MarketDetailResponse>(`/api/v1/markets/${id}`);
        
        if (response.data.success) {
          const marketData = response.data.data.market;
          
          // Calculate percentages for outcomes if not in consensus
          if (!marketData.consensus || Object.keys(marketData.consensus).length === 0) {
            const totalPoints = marketData.outcomes.reduce((sum, outcome) => sum + outcome.total_points, 0);
            const consensus: Record<string, number> = {};
            marketData.outcomes.forEach((outcome) => {
              const percentage = totalPoints > 0 ? (outcome.total_points / totalPoints) * 100 : 0;
              consensus[outcome.name] = percentage;
            });
            marketData.consensus = consensus;
          }

          setMarket(marketData);
        }
      } catch (err: any) {
        console.error('Error fetching market:', err);
        setError(err.response?.data?.detail || 'Failed to load market');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMarket();
    }
  }, [id]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      election: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      politics: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      sports: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      entertainment: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      economy: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
      weather: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
      other: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    };
    return colors[category.toLowerCase()] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      suspended: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
      resolved: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    };
    return colors[status.toLowerCase()] || colors.open;
  };

  if (isLoading) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !market) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBack} slot="start" />
              Back
            </IonButton>
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400 text-lg mb-4">
                {error || 'Market not found'}
              </p>
              <IonButton onClick={() => history.push('/markets')}>
                Browse Markets
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const consensus = market.consensus || {};
  const sortedOutcomes = [...market.outcomes].sort((a, b) => {
    const aPercent = consensus[a.name] || 0;
    const bPercent = consensus[b.name] || 0;
    return bPercent - aPercent;
  });

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <IonButton fill="clear" onClick={() => history.goBack()} className="mb-4">
            <IonIcon icon={arrowBack} slot="start" />
            Back
          </IonButton>

          {/* Market Image */}
          {market.image_url && (
            <div className="mb-6 rounded-xl overflow-hidden shadow-sm">
              <img
                src={market.image_url}
                alt={market.title}
                className="w-full h-64 md:h-80 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Market Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(market.category)}`}>
                    {market.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(market.status)}`}>
                    {market.status}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {market.title}
                </h1>
                {market.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {market.description}
                  </p>
                )}
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Volume</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {market.total_volume ? market.total_volume.toLocaleString() : '0'} chips
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Max per User</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {market.max_points_per_user.toLocaleString()} chips
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(market.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Outcomes</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {market.outcomes.length}
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Rules */}
          {market.rules && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Resolution Rules
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {market.rules}
                </p>
              </div>
            </div>
          )}

          {/* Outcomes & Consensus */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Current Consensus
            </h2>
            <div className="space-y-4">
              {sortedOutcomes.map((outcome) => {
                const percentage = consensus[outcome.name] || 0;
                const isYes = outcome.name.toLowerCase() === 'yes';
                const isNo = outcome.name.toLowerCase() === 'no';
                const barColor = isYes
                  ? 'bg-green-500'
                  : isNo
                  ? 'bg-red-500'
                  : 'bg-primary';

                return (
                  <div key={outcome.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {outcome.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {percentage.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full ${barColor} flex items-center justify-end pr-2 transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 10 && (
                          <span className="text-white text-xs font-semibold">
                            {percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{outcome.total_points.toLocaleString()} chips</span>
                      <span>{percentage.toFixed(2)}% probability</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forecast Section (Placeholder for Phase 4) */}
          {isAuthenticated && market.status === 'open' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Make a Forecast
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Forecast functionality will be available in Phase 4.
              </p>
              <IonButton disabled className="button-primary">
                Coming Soon
              </IonButton>
            </div>
          )}

          {!isAuthenticated && market.status === 'open' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Make a Forecast
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign in to make forecasts on this market.
              </p>
              <IonButton onClick={() => history.push('/login')} className="button-primary">
                Sign In
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MarketDetail;


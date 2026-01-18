import React, { useState, useEffect, useCallback } from 'react';
import { IonContent, IonPage, IonSpinner, IonButton, IonIcon, IonCard, IonCardContent, IonToast, IonAccordion, IonAccordionGroup, IonItem, IonLabel } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { arrowBack, informationCircle, trendingUp, people, calendar, layers, checkmarkCircle, bookmarkOutline, chevronDown, linkOutline, trophyOutline, closeCircleOutline, settingsOutline } from 'ionicons/icons';
import Header from '../components/Header';
import ForecastSlip from '../components/ForecastSlip';
import MarketGraph from '../components/MarketGraph';
import CommentSection from '../components/CommentSection';
import api from '../services/api';
import { Market, MarketDetailResponse } from '../types/market';
import { ForecastCreate, Forecast } from '../types/forecast';
import { useAuth } from '../contexts/AuthContext';

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [userForecast, setUserForecast] = useState<Forecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingForecast, setIsPlacingForecast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [resolutionAccordionValue, setResolutionAccordionValue] = useState<string | undefined>(undefined);
  const [resolution, setResolution] = useState<any | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Polling for real-time updates (only if market is open)
  const POLL_INTERVAL = 5000; // 5 seconds

  const fetchMarket = useCallback(async () => {
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
    }
  }, [id]);

  const fetchUserForecast = useCallback(async () => {
    if (!isAuthenticated || !id) return;

    try {
      const response = await api.get(`/api/v1/markets/${id}/forecasts`);
      if (response.data.success && response.data.data.user_forecast) {
        setUserForecast(response.data.data.user_forecast);
      } else {
        setUserForecast(null);
      }
    } catch (err) {
      console.error('Error fetching user forecast:', err);
      setUserForecast(null);
    }
  }, [id, isAuthenticated]);

  const fetchResolution = useCallback(async () => {
    if (!id || !market || market.status !== 'resolved') return;

    try {
      const response = await api.get(`/api/v1/markets/${id}/resolution`);
      if (response.data.success) {
        setResolution(response.data.data.resolution);
      }
    } catch (err: any) {
      // Resolution might not exist yet (old markets)
      if (err.response?.status !== 404) {
        console.error('Error fetching resolution:', err);
      }
      setResolution(null);
    }
  }, [id, market]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchMarket().finally(() => setIsLoading(false));
    fetchUserForecast();
  }, [fetchMarket, fetchUserForecast]);

  useEffect(() => {
    if (market && market.status === 'resolved') {
      fetchResolution();
    }
  }, [market, fetchResolution]);

  // Update Open Graph meta tags for Facebook sharing
  useEffect(() => {
    if (!market) return;

    const baseUrl = window.location.origin;
    const marketUrl = `${baseUrl}/markets/${market.id}`;
    
    // Get current top outcome for description
    const consensus = market.consensus || {};
    const sortedOutcomes = [...market.outcomes].sort((a, b) => {
      const aPercent = consensus[a.name] || 0;
      const bPercent = consensus[b.name] || 0;
      return bPercent - aPercent;
    });
    const topOutcome = sortedOutcomes.length > 0 ? sortedOutcomes[0] : null;
    const topOutcomePercent = topOutcome ? (consensus[topOutcome.name] || 0).toFixed(0) : '0';
    
    // Update or create Open Graph meta tags
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateMetaTagName = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Open Graph tags
    updateMetaTag('og:title', market.title);
    updateMetaTag('og:description', topOutcome 
      ? `${topOutcome.name}: ${topOutcomePercent}% chance | ${market.description || 'Philippine Prediction Market'}`
      : market.description || 'Philippine Prediction Market');
    updateMetaTag('og:image', market.image_url || `${baseUrl}/logo.png`);
    updateMetaTag('og:url', marketUrl);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'ACBMarket');

    // Twitter Card tags
    updateMetaTagName('twitter:card', 'summary_large_image');
    updateMetaTagName('twitter:title', market.title);
    updateMetaTagName('twitter:description', topOutcome 
      ? `${topOutcome.name}: ${topOutcomePercent}% chance`
      : market.description || 'Philippine Prediction Market');
    updateMetaTagName('twitter:image', market.image_url || `${baseUrl}/logo.png`);

    // Update page title
    document.title = `${market.title} | ACBMarket`;

    // Cleanup function to restore default meta tags when component unmounts
    return () => {
      document.title = 'ACBMarket - Philippine Prediction Market';
    };
  }, [market]);

  const handleCopyLink = async () => {
    if (!market) return;
    
    const baseUrl = window.location.origin;
    const marketUrl = `${baseUrl}/markets/${market.id}`;
    
    try {
      await navigator.clipboard.writeText(marketUrl);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = marketUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy link:', fallbackErr);
        setToastMessage('Failed to copy link');
        setToastColor('danger');
        setShowToast(true);
      }
      document.body.removeChild(textArea);
    }
  };

  // Polling for real-time updates
  useEffect(() => {
    if (!market || market.status !== 'open') return;

    const interval = setInterval(() => {
      fetchMarket();
      if (isAuthenticated) {
        fetchUserForecast();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [market, isAuthenticated, fetchMarket, fetchUserForecast]);

  const handlePlaceForecast = async (forecastData: ForecastCreate) => {
    if (!id) return;

    setIsPlacingForecast(true);
    setError(null);
    try {
      const response = await api.post(`/api/v1/markets/${id}/forecast`, forecastData);
      
      if (response.data.success) {
        const { forecast, new_balance } = response.data.data;
        
        // Update user chips
        if (user) {
          updateUser({ chips: new_balance });
        }
        
        // Update local state
        setUserForecast(forecast);
        
        // Refresh market data to update consensus
        await fetchMarket();
        
        setToastMessage(`Forecast placed! ${forecastData.points} chips on "${forecast.outcome_name || 'selected outcome'}"`);
        setToastColor('success');
        setShowToast(true);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.errors?.[0]?.message || 'Failed to place forecast';
      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsPlacingForecast(false);
    }
  };

  const handleUpdateForecast = async (forecastId: string, forecastData: ForecastCreate) => {
    setIsPlacingForecast(true);
    setError(null);
    try {
      const response = await api.patch(`/api/v1/forecasts/${forecastId}`, forecastData);
      
      if (response.data.success) {
        const { forecast, new_balance } = response.data.data;
        
        // Update user chips
        if (user) {
          updateUser({ chips: new_balance });
        }
        
        // Update local state
        setUserForecast(forecast);
        
        // Refresh market data
        await fetchMarket();
        
        setToastMessage('Forecast updated successfully!');
        setToastColor('success');
        setShowToast(true);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.errors?.[0]?.message || 'Failed to update forecast';
      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsPlacingForecast(false);
    }
  };


  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      election: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      politics: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      sports: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      entertainment: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      economy: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
      weather: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
      world: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',
      local: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
      technology: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
      culture: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
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
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <IonButton fill="clear" onClick={() => history.goBack()} className="mb-3 -ml-2">
              <IonIcon icon={arrowBack} slot="start" />
              Back
            </IonButton>
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400 text-lg mb-4">
                {error || 'Market not found'}
              </p>
              <IonButton onClick={() => history.push('/markets')} className="button-primary">
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
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          {/* Back Button - Compact */}
          <IonButton fill="clear" onClick={() => history.goBack()} className="mb-4 -ml-2">
            <IonIcon icon={arrowBack} slot="start" />
            Back
          </IonButton>

          {/* Two Column Layout for Large Screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 lg:pb-0">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4">

          {/* Market Header - Polymarket Style */}
          <IonCard className="bg-white dark:bg-gray-800">
            <IonCardContent className="p-4">
              {/* Top Row: Image, Title, Icons */}
              <div className="flex items-start gap-3 mb-4">
                {/* Market Image - Left side, small square */}
                {market.image_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={market.image_url}
                      alt={market.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Title and Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="market-title text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                    {market.title}
                  </h1>
                  
                  {/* Volume and Created Date */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <IonIcon icon={trendingUp} className="text-base" />
                      ₱{market.total_volume ? market.total_volume.toLocaleString() : '0'} Vol.
                    </span>
                    <span className="flex items-center gap-1">
                      <IonIcon icon={calendar} className="text-base" />
                      Created: {new Date(market.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Deadline - Enhanced Display */}
                  {market.end_date && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <IonIcon icon={calendar} className="text-orange-600 dark:text-orange-400 text-lg flex-shrink-0" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">
                          Ends:
                        </span>
                        <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                          {new Date(market.end_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <IonButton 
                    fill="clear" 
                    size="default"
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    <IonIcon icon={linkOutline} className="text-xl" />
                  </IonButton>
                  <IonButton fill="clear" size="default">
                    <IonIcon icon={bookmarkOutline} className="text-xl" />
                  </IonButton>
                </div>
              </div>

              {/* Current Chance Display - Prominent */}
              {sortedOutcomes.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {consensus[sortedOutcomes[0].name]?.toFixed(0) || 0}% chance
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      {sortedOutcomes[0].name}
                    </span>
                  </div>
                </div>
              )}

              {/* Category and Status Tags */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(market.category)}`}>
                  {market.category}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(market.status)}`}>
                  {market.status}
                </span>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Graph Section - First */}
          <div>
            <MarketGraph
              marketId={market.id}
              outcomes={market.outcomes.map((o) => ({ id: o.id, name: o.name }))}
            />
          </div>

          {/* Consensus Section - Second */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Resolution Rules - Compact */}
            {market.rules && (
              <div className="lg:col-span-1">
                <IonCard className="bg-white dark:bg-gray-800 h-full">
                  <IonCardContent className="p-4">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                      <IonIcon icon={informationCircle} className="mr-1.5 text-primary" />
                      Resolution Rules
                    </h2>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {market.rules}
                      </p>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            )}

            {/* Outcomes & Consensus - Takes remaining space */}
            <div className={market.rules ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <IonCard className="bg-white dark:bg-gray-800">
                <IonCardContent className="p-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Current Consensus
                  </h2>
                  <div className="space-y-3">
                    {sortedOutcomes.map((outcome) => {
                      const percentage = consensus[outcome.name] || 0;
                      const isYes = outcome.name.toLowerCase() === 'yes';
                      const isNo = outcome.name.toLowerCase() === 'no';
                      const barColor = isYes
                        ? 'bg-green-500'
                        : isNo
                        ? 'bg-red-500'
                        : 'bg-primary';
                      const isUserForecast = userForecast?.outcome_id === outcome.id;

                      return (
                        <div key={outcome.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {outcome.name}
                              </span>
                              {isUserForecast && (
                                <IonIcon icon={checkmarkCircle} className="text-primary text-base" title="Your forecast" />
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {outcome.total_points.toLocaleString()} chips
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[3rem] text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-7 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full ${barColor} flex items-center justify-end pr-2 transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 12 && (
                                <span className="text-white text-xs font-semibold">
                                  {percentage.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </div>

          {/* Resolution Section - Third (Accordion) */}
          <IonCard className="bg-white dark:bg-gray-800 overflow-hidden">
            <IonCardContent className="p-0">
              <IonAccordionGroup 
                value={resolutionAccordionValue}
                onIonChange={(e) => setResolutionAccordionValue(e.detail.value as string | undefined)}
              >
                <IonAccordion value="resolution">
                  <IonItem slot="header" className="bg-white dark:bg-gray-800">
                    <IonLabel>
                      <div className="flex items-center gap-2">
                        <IonIcon icon={informationCircle} className="text-primary text-lg" />
                        <span className="font-semibold text-gray-900 dark:text-white">Resolution Information</span>
                      </div>
                    </IonLabel>
                  </IonItem>
                  <div slot="content" className="p-4 bg-white dark:bg-gray-800">
                    {market.status === 'resolved' && market.resolution_outcome ? (
                      <div className="space-y-4">
                        {/* Winning Outcome */}
                        {resolution && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <IonIcon icon={trophyOutline} className="text-green-600 dark:text-green-400 text-xl" />
                              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                                Winning Outcome: {resolution.outcome_name || 'N/A'}
                              </p>
                            </div>
                            {market.resolution_time && (
                              <p className="text-xs text-green-700 dark:text-green-400">
                                Resolved on: {new Date(market.resolution_time).toLocaleString()}
                              </p>
                            )}
                            {resolution.resolver_name && (
                              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                Resolved by: {resolution.resolver_name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* User Forecast Result */}
                        {isAuthenticated && userForecast && (
                          <div className={`border rounded-lg p-4 ${
                            userForecast.status === 'won'
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : userForecast.status === 'lost'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {userForecast.status === 'won' && (
                                <IonIcon icon={trophyOutline} className="text-green-600 dark:text-green-400 text-xl" />
                              )}
                              {userForecast.status === 'lost' && (
                                <IonIcon icon={closeCircleOutline} className="text-red-600 dark:text-red-400 text-xl" />
                              )}
                              <p className={`text-sm font-semibold ${
                                userForecast.status === 'won'
                                  ? 'text-green-800 dark:text-green-300'
                                  : userForecast.status === 'lost'
                                  ? 'text-red-800 dark:text-red-300'
                                  : 'text-gray-800 dark:text-gray-300'
                              }`}>
                                Your Forecast: {userForecast.status === 'won' ? 'Won!' : userForecast.status === 'lost' ? 'Lost' : 'Pending'}
                              </p>
                            </div>
                            <p className={`text-xs ${
                              userForecast.status === 'won'
                                ? 'text-green-700 dark:text-green-400'
                                : userForecast.status === 'lost'
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-400'
                            }`}>
                              You forecasted "{userForecast.outcome_name}" with ₱{userForecast.points.toLocaleString()} chips.
                            </p>
                          </div>
                        )}

                        {/* Resolution Note */}
                        {resolution && resolution.resolution_note && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                              Resolution Explanation:
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                              {resolution.resolution_note}
                            </p>
                          </div>
                        )}

                        {/* Evidence URLs */}
                        {resolution && resolution.evidence_urls && resolution.evidence_urls.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <IonIcon icon={linkOutline} className="text-lg" />
                              Evidence:
                            </p>
                            <div className="space-y-2">
                              {resolution.evidence_urls.map((url: string, index: number) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline block break-all"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resolution Rules (if exists) */}
                        {market.rules && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              Resolution Rules:
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                              {market.rules}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                            This market has not been resolved yet.
                          </p>
                          {(user?.is_admin || user?.is_market_moderator) && market.status === 'open' && (
                            <IonButton
                              onClick={() => history.push(`/admin/markets/${id}/resolve`)}
                              className="button-primary"
                              size="small"
                            >
                              <IonIcon icon={settingsOutline} slot="start" />
                              Resolve Market
                            </IonButton>
                          )}
                        </div>
                        {market.rules && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-left">
                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              Resolution Rules:
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                              {market.rules}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </IonAccordion>
              </IonAccordionGroup>
            </IonCardContent>
          </IonCard>

              {/* Comments Section */}
              <CommentSection marketId={market.id} />
            </div>

            {/* Right Column - Trading Interface (Sticky on Large Screens) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4">
                {isAuthenticated && market.status === 'open' ? (
                  <ForecastSlip
                    market={market}
                    userForecast={userForecast || undefined}
                    onPlaceForecast={handlePlaceForecast}
                    onUpdateForecast={userForecast ? handleUpdateForecast : undefined}
                    isLoading={isPlacingForecast}
                  />
                ) : !isAuthenticated && market.status === 'open' ? (
                  <IonCard className="bg-white dark:bg-gray-800">
                    <IonCardContent className="p-4">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        Trade on This Market
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Sign in to buy positions on this market.
                      </p>
                      <IonButton onClick={() => history.push('/login')} className="button-primary">
                        Sign In
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                ) : (
                  <IonCard className="bg-white dark:bg-gray-800">
                    <IonCardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This market is {market.status}. Trading is no longer available.
                      </p>
                    </IonCardContent>
                  </IonCard>
                )}
              </div>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
        <IonToast
          isOpen={showCopiedToast}
          onDidDismiss={() => setShowCopiedToast(false)}
          message="Copied!"
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default MarketDetail;

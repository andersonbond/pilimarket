import React, { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import CategoriesBar from '../components/CategoriesBar';
import LeaderboardWidget from '../components/LeaderboardWidget';
import ActivityWidget from '../components/ActivityWidget';
import MarketCard from '../components/MarketCard';
import MarketFilters from '../components/MarketFilters';
import api from '../services/api';
import { Market } from '../types/market';

const Home: React.FC = () => {
  //const { isAuthenticated, user } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('volume');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hideSports, setHideSports] = useState(false);
  const [hidePolitics, setHidePolitics] = useState(false);

  useEffect(() => {
    const fetchMarkets = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/markets?status=open&limit=20&page=1');
        if (response.data.success) {
          // Process markets to calculate percentages
          const processedMarkets = response.data.data.markets.map((market: Market) => {
            const totalPoints = market.outcomes.reduce((sum, outcome) => sum + outcome.total_points, 0);
            const outcomesWithPercentage = market.outcomes.map((outcome) => ({
              ...outcome,
              percentage: totalPoints > 0 ? (outcome.total_points / totalPoints) * 100 : 0,
            }));
            return {
              ...market,
              outcomes: outcomesWithPercentage,
              total_volume: totalPoints,
            };
          });
          setMarkets(processedMarkets);
        }
      } catch (error: any) {
        console.error('Error fetching markets:', error);
        // Don't set mock data - show empty state or error
        setMarkets([]);
        // Log the full error for debugging
        if (error.response) {
          console.error('API Error Response:', error.response.data);
        } else if (error.request) {
          console.error('No response received. Is the backend running?');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Filter markets based on category and hide options
  const filteredMarkets = markets.filter((market) => {
    // Category filter
    if (selectedCategory !== 'All' && market.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    // Hide filters
    if (hideSports && market.category.toLowerCase() === 'sports') return false;
    if (hidePolitics && market.category.toLowerCase() === 'politics') return false;
    return true;
  });

  // Sort markets
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'volume') {
      return (b.total_volume || 0) - (a.total_volume || 0);
    } else if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  return (
    <IonPage>
      <Header />
      <CategoriesBar selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
      <IonContent>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          {/* Top Bar - User Stats */}
          {/* {isAuthenticated && user && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-end">
                
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Chips: </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{user.chips.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Rep: </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{user.reputation.toFixed(1)}</span>
                    </div>
                  </div>
                
              </div>
            </div>
          </div>
          )} */}

          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Markets Column */}
              <div className="lg:col-span-3">
                {/* Filters */}
                <MarketFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  hideSports={hideSports}
                  hidePolitics={hidePolitics}
                  onHideSportsChange={setHideSports}
                  onHidePoliticsChange={setHidePolitics}
                />

                {/* Markets Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse">
                        <div className="h-32 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="p-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sortedMarkets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedMarkets.map((market) => (
                      <MarketCard key={market.id} market={market} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No markets found</p>
                  </div>
                )}
              </div>

              {/* Sidebar - Leaderboard and Activity */}
              <div className="lg:col-span-1 space-y-6">
                <div className="sticky top-20 space-y-6">
                  <LeaderboardWidget />
                  <ActivityWidget />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-20 mt-auto">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <Link
                  to="/terms"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <Link
                  to="/privacy"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <Link
                  to="/faq"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <Link
                  to="/disclaimer"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Disclaimer
                </Link>
              </div>
              <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-500">
                © {new Date().getFullYear()} Pilimarket. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import CategoriesBar from '../components/CategoriesBar';
import LeaderboardWidget from '../components/LeaderboardWidget';
import MarketCard from '../components/MarketCard';
import MarketFilters from '../components/MarketFilters';
import api from '../services/api';
import { Market } from '../types/market';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
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
        const response = await api.get('/api/v1/markets?status=open&limit=20');
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
      } catch (error) {
        console.error('Error fetching markets:', error);
        // Mock data for now
        setMarkets([
          {
            id: '1',
            title: 'Will Martin Romualdez win the 2028 Philippine Presidential Election?',
            slug: 'marcos-2028-election',
            category: 'politics',
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            max_points_per_user: 10000,
            outcomes: [
              { id: '1', market_id: '1', name: 'Yes', total_points: 35000, percentage: 65 },
              { id: '2', market_id: '1', name: 'No', total_points: 19000, percentage: 35 },
            ],
            total_volume: 54000,
          },
          {
            id: '2',
            title: 'Will Sara Duterte run for president in 2028?',
            slug: 'saraduterte-2028-election',
            category: 'politics',
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            max_points_per_user: 10000,
            outcomes: [
              { id: '3', market_id: '2', name: 'Yes', total_points: 28000, percentage: 72 },
              { id: '4', market_id: '2', name: 'No', total_points: 11000, percentage: 28 },
            ],
            total_volume: 39000,
          },
          {
            id: '3',
            title: 'Will the Philippines qualify for the 2026 FIFA World Cup?',
            slug: 'philippines-world-cup-2026',
            category: 'sports',
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            max_points_per_user: 10000,
            outcomes: [
              { id: '5', market_id: '3', name: 'Yes', total_points: 12000, percentage: 25 },
              { id: '6', market_id: '3', name: 'No', total_points: 36000, percentage: 75 },
            ],
            total_volume: 48000,
          },
          {
            id: '4',
            title: 'Will there be a major earthquake in Metro Manila in 2026?',
            slug: 'manila-earthquake-2025',
            category: 'politics',
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            max_points_per_user: 10000,
            outcomes: [
              { id: '7', market_id: '4', name: 'Yes', total_points: 8000, percentage: 15 },
              { id: '8', market_id: '4', name: 'No', total_points: 45000, percentage: 85 },
            ],
            total_volume: 53000,
          },
          {
            id: '5',
            title: 'Will the Philippines GDP growth exceed 6% in 2026?',
            slug: 'philippines-gdp-2025',
            category: 'politics',
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            max_points_per_user: 10000,
            outcomes: [
              { id: '9', market_id: '5', name: 'Yes', total_points: 32000, percentage: 68 },
              { id: '10', market_id: '5', name: 'No', total_points: 15000, percentage: 32 },
            ],
            total_volume: 47000,
          },
        ]);
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
          {isAuthenticated && user && (
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
          )}

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

              {/* Sidebar - Leaderboard */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <LeaderboardWidget />
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

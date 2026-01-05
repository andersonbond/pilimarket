import React from 'react';
import { useHistory } from 'react-router-dom';
import { IonCard, IonCardContent } from '@ionic/react';

import { Market } from '../types/market';

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const history = useHistory();
  // Get consensus from market or calculate from outcomes
  const consensus = market.consensus || {};
  const yesOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'yes');
  const noOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'no');
  
  // Use consensus if available, otherwise calculate from outcomes
  let yesPercentage = 0;
  let noPercentage = 0;
  
  if (Object.keys(consensus).length > 0) {
    yesPercentage = consensus['Yes'] || consensus['yes'] || 0;
    noPercentage = consensus['No'] || consensus['no'] || 0;
  } else {
    yesPercentage = yesOutcome?.percentage || 0;
    noPercentage = noOutcome?.percentage || 0;
  }
  
  const totalPoints = market.total_volume || (yesOutcome?.total_points || 0) + (noOutcome?.total_points || 0);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      election: 'bg-blue-100 text-blue-700',
      politics: 'bg-red-100 text-red-700',
      crypto: 'bg-yellow-100 text-yellow-700',
      sports: 'bg-green-100 text-green-700',
      entertainment: 'bg-purple-100 text-purple-700',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  // Get image URL - use uploaded image if available, otherwise placeholder
  const getImageUrl = () => {
    if (market.image_url) {
      return market.image_url;
    }
    // Generate placeholder image URL based on category
    return `https://picsum.photos/seed/${market.id}/400/200`;
  };

  return (
    <IonCard 
      className="cursor-pointer hover:shadow-xl transition-shadow overflow-hidden bg-white dark:bg-gray-800"
      onClick={() => history.push(`/markets/${market.id}`)}
    >
      {/* Market Image */}
      <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
        <img
          src={getImageUrl()}
          alt={market.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
      
      <IonCardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {market.title}
            </h3>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(market.category)}`}>
              {market.category}
            </span>
          </div>
        </div>

        {/* Probability Bars */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-green-500 flex items-center justify-end pr-2"
                style={{ width: `${yesPercentage}%` }}
              >
                {yesPercentage > 10 && (
                  <span className="text-white text-xs font-semibold">{yesPercentage.toFixed(0)}%</span>
                )}
              </div>
              <div
                className="h-full bg-red-500 flex items-center pl-2 absolute right-0"
                style={{ width: `${noPercentage}%` }}
              >
                {noPercentage > 10 && (
                  <span className="text-white text-xs font-semibold">{noPercentage.toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Yes {yesPercentage.toFixed(1)}%</span>
            <span>No {noPercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Volume */}
        {market.total_volume !== undefined && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {market.total_volume > 0 ? (
              <span>${(market.total_volume / 100).toLocaleString()} Vol.</span>
            ) : (
              <span>No volume yet</span>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default MarketCard;


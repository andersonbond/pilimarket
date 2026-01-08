import React from 'react';
import { useHistory } from 'react-router-dom';
import { IonCard, IonCardContent } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';

import { Market } from '../types/market';

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const history = useHistory();
  const { isAuthenticated } = useAuth();
  
  // Get consensus from market or calculate from outcomes
  const consensus = market.consensus || {};
  const yesOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'yes');
  const noOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'no');
  
  // Get 2 most recent outcomes (or Yes/No if available)
  const getOutcomesForButtons = () => {
    // Prefer Yes/No if available
    if (yesOutcome && noOutcome) {
      return [yesOutcome, noOutcome];
    }
    // Otherwise, get first 2 outcomes
    return market.outcomes.slice(0, 2);
  };
  
  const outcomesForButtons = getOutcomesForButtons();
  
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

  // Handle outcome button click
  const handleOutcomeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!isAuthenticated) {
      // Redirect to login with return URL
      history.push(`/login?return=/markets/${market.id}`);
      return;
    }
    
    // Navigate to market detail page
    history.push(`/markets/${market.id}`);
  };

  // Get button color based on outcome name - soft colors with darker text for contrast
  const getButtonColor = (outcomeName: string) => {
    const name = outcomeName.toLowerCase();
    if (name === 'yes') {
      return 'bg-green-100 hover:bg-green-300 dark:bg-green-500 dark:hover:bg-green-600 text-green-900 dark:text-white shadow-sm hover:shadow transition-colors';
    } else if (name === 'no') {
      return 'bg-red-100 hover:bg-red-300 dark:bg-red-500 dark:hover:bg-red-600 text-red-900 dark:text-white shadow-sm hover:shadow transition-colors';
    }
    // Default colors for other outcomes
    return 'bg-blue-100 hover:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow transition-colors';
  };

  return (
    <IonCard 
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden bg-white dark:bg-gray-800"
      onClick={() => history.push(`/markets/${market.id}`)}
      role="article"
      aria-label={`Market: ${market.title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          history.push(`/markets/${market.id}`);
        }
      }}
    >
      <IonCardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Market Image - Left side, square with rounded corners */}
          <div className="flex-shrink-0">
            <img
              src={getImageUrl()}
              alt={market.title}
              className="w-16 h-16 object-cover rounded-lg"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Content - Right side of image */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
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
            <div className="flex-1 h-7 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
              {/* Yes bar - positioned from left */}
              {yesPercentage > 0 && (
                <div
                  className="h-full bg-green-400 dark:bg-green-500 flex items-center justify-end pr-2 absolute left-0 z-10 transition-all duration-300"
                  style={{ width: `${yesPercentage}%` }}
                >
                  {yesPercentage > 10 && (
                    <span className="text-white text-xs font-medium">{yesPercentage.toFixed(0)}%</span>
                  )}
                </div>
              )}
              {/* No bar - positioned from right */}
              {noPercentage > 0 && (
                <div
                  className="h-full bg-red-400 dark:bg-red-500 flex items-center pl-2 absolute right-0 z-20 transition-all duration-300"
                  style={{ width: `${noPercentage}%` }}
                >
                  {noPercentage > 10 && (
                    <span className="text-white text-xs font-medium">{noPercentage.toFixed(0)}%</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Yes {yesPercentage.toFixed(1)}%</span>
            <span>No {noPercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Outcome Selection Buttons - Call to Action */}
        {market.status === 'open' && outcomesForButtons.length > 0 && (
          <div className="mb-3">
            <div className={`grid gap-2 ${outcomesForButtons.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {outcomesForButtons.map((outcome) => (
                <button
                  key={outcome.id}
                  onClick={handleOutcomeClick}
                  className={`${getButtonColor(outcome.name)} font-medium h-9 text-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full flex items-center justify-center`}
                >
                  {outcome.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Volume and Deadline */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {market.total_volume !== undefined && (
            <div>
              {market.total_volume > 0 ? (
                <span>₱{market.total_volume.toLocaleString()} Vol.</span>
              ) : (
                <span>No volume yet</span>
              )}
            </div>
          )}
          {market.end_date && (
            <div className="text-orange-600 dark:text-orange-400">
              Ends: {new Date(market.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default MarketCard;


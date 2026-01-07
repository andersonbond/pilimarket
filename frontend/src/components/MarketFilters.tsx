import React from 'react';
import { IonIcon } from '@ionic/react';
import { swapVertical, eyeOff } from 'ionicons/icons';

interface MarketFiltersProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  hideSports: boolean;
  hidePolitics: boolean;
  onHideSportsChange: (hide: boolean) => void;
  onHidePoliticsChange: (hide: boolean) => void;
}

const MarketFilters: React.FC<MarketFiltersProps> = ({
  sortBy,
  onSortChange,
  hideSports,
  hidePolitics,
  onHideSportsChange,
  onHidePoliticsChange,
}) => {
  const sortOptions = [
    { value: 'volume', label: '24hr Volume' },
    { value: 'newest', label: 'Newest' },
    { value: 'ending', label: 'Ending Soon' },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
      {/* Sort Section */}
      <div className="flex items-center gap-2">
        <IonIcon icon={swapVertical} className="text-gray-500 dark:text-gray-400 text-base" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sort:</span>
        <div className="flex gap-1.5">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                sortBy === option.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-2 md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-3">
        <IonIcon icon={eyeOff} className="text-gray-500 dark:text-gray-400 text-base" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Hide:</span>
        <div className="flex gap-3">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={hideSports}
              onChange={(e) => onHideSportsChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary focus:ring-1 bg-white dark:bg-gray-700 cursor-pointer"
            />
            <span className="ml-1.5 text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Sports
            </span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={hidePolitics}
              onChange={(e) => onHidePoliticsChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary focus:ring-1 bg-white dark:bg-gray-700 cursor-pointer"
            />
            <span className="ml-1.5 text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Politics
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default MarketFilters;

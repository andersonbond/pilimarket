import React, { useRef } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { 
  chevronBack, 
  chevronForward,
  apps,
  flag,
  business,
  football,
  film,
  cash,
  cloud,
  globe,
  location,
  hardwareChip,
  musicalNotes,
} from 'ionicons/icons';

interface CategoriesBarProps {
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
}

const categories = [
  { name: 'All', icon: apps },
  { name: 'Elections', icon: flag },
  { name: 'Politics', icon: business },
  { name: 'Sports', icon: football },
  { name: 'Entertainment', icon: film },
  { name: 'Economy', icon: cash },
  { name: 'Weather', icon: cloud },
  { name: 'World', icon: globe },
  { name: 'Local', icon: location },
  { name: 'Technology', icon: hardwareChip },
  { name: 'Culture', icon: musicalNotes },
];

const getCategoryIcon = (categoryName: string) => {
  const category = categories.find(c => c.name === categoryName);
  return category?.icon || apps;
};

const CategoriesBar: React.FC<CategoriesBarProps> = ({ selectedCategory = 'All', onCategorySelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-[56px] z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-2 py-3">
          {/* Left Scroll Button */}
          <IonButton
            fill="clear"
            size="small"
            onClick={() => scroll('left')}
            className="flex-shrink-0"
          >
            <IonIcon icon={chevronBack} />
          </IonButton>

          {/* Scrollable Categories */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="flex space-x-2 min-w-max">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => onCategorySelect?.(category.name)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <IonIcon icon={category.icon} className="text-base" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Scroll Button */}
          <IonButton
            fill="clear"
            size="small"
            onClick={() => scroll('right')}
            className="flex-shrink-0"
          >
            <IonIcon icon={chevronForward} />
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default CategoriesBar;


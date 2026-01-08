import React, { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonIcon, IonCard, IonCardContent, IonAlert, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { wallet, checkmarkCircle, closeCircle, informationCircle } from 'ionicons/icons';
import { Market, Outcome } from '../types/market';
import { ForecastCreate } from '../types/forecast';
import { useAuth } from '../contexts/AuthContext';

interface ForecastSlipProps {
  market: Market;
  userForecast?: any;
  onPlaceForecast: (forecast: ForecastCreate) => Promise<void>;
  onUpdateForecast?: (forecastId: string, forecast: ForecastCreate) => Promise<void>;
  isLoading?: boolean;
}

const ForecastSlip: React.FC<ForecastSlipProps> = ({
  market,
  userForecast,
  onPlaceForecast,
  onUpdateForecast,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const history = useHistory();
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(
    userForecast?.outcome_id || market.outcomes[0]?.id || ''
  );
  const [points, setPoints] = useState<number>(userForecast?.points || 100);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOutcome = market.outcomes.find((o) => o.id === selectedOutcomeId);
  
  // Calculate max points
  const existingForecastPoints = userForecast?.points || 0;
  const userChips = user?.chips || 0;
  
  // If user has an existing forecast, they can use their chips + the points from existing forecast
  // (since updating will refund the old forecast points)
  // Otherwise, they're limited by their chips and the per-market limit
  const effectiveMaxPoints = userForecast
    ? Math.min(
        userChips + existingForecastPoints, // Can use chips + refunded points
        market.max_points_per_user // But still limited by per-market limit
      )
    : Math.min(
        userChips,
        market.max_points_per_user // New forecast: limited by chips and per-market limit
      );

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleQuickSelect = (amount: number) => {
    // Allow selecting any amount up to market limit
    if (amount <= market.max_points_per_user) {
      setPoints(amount);
    }
  };

  const validateForecast = (): string | null => {
    if (!selectedOutcomeId) {
      return 'Please select an outcome';
    }
    if (!points || points < 1) {
      return 'Points must be at least 1';
    }
    
    // If updating existing forecast, new amount must be greater than current
    if (userForecast && points <= userForecast.points) {
      return `You can only increase your forecast. Current: ₱${userForecast.points.toLocaleString()}. Minimum: ₱${(userForecast.points + 1).toLocaleString()}`;
    }
    
    // Check market limit (not user chips - that's handled separately)
    if (points > market.max_points_per_user) {
      return `Exceeds market limit. Maximum ₱${market.max_points_per_user.toLocaleString()} allowed per user`;
    }
    return null;
  };

  const handleSubmit = async () => {
    // First check basic validation (outcome, points, market limit)
    const validationError = validateForecast();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if user has insufficient chips - redirect to purchase page
    const availableChips = userForecast
      ? (user?.chips || 0) + existingForecastPoints
      : (user?.chips || 0);
    
    if (availableChips < points) {
      // Redirect to purchase page with return URL
      const returnUrl = `/markets/${market.id}`;
      history.push(`/purchase?return=${encodeURIComponent(returnUrl)}&required=${points}`);
      return;
    }

    // User has sufficient chips, proceed with confirmation
    setError(null);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    try {
      if (userForecast && onUpdateForecast) {
        await onUpdateForecast(userForecast.id, {
          outcome_id: selectedOutcomeId,
          points,
        });
      } else {
        await onPlaceForecast({
          outcome_id: selectedOutcomeId,
          points,
        });
      }
      // Reset form after successful forecast
      if (!userForecast) {
        setPoints(100);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place forecast');
    }
  };


  if (!user) {
    return (
      <IonCard className="bg-white dark:bg-gray-800">
        <IonCardContent className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please log in to place a forecast.
          </p>
        </IonCardContent>
      </IonCard>
    );
  }

  if (market.status !== 'open') {
    return (
      <IonCard className="bg-white dark:bg-gray-800">
        <IonCardContent className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This market is {market.status}. Forecasts are no longer accepted.
          </p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      <IonCard className="bg-white dark:bg-gray-800">
        <IonCardContent className="p-4">
          <div className="space-y-4">
            {/* Current Balance */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <IonIcon icon={wallet} className="text-primary text-xl" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Your Balance</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ₱{user.chips.toLocaleString()}
              </span>
            </div>

            {/* Outcome Selection */}
            <div>
              <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Select Outcome
              </IonLabel>
              <div className="grid grid-cols-2 gap-2">
                {market.outcomes.map((outcome) => {
                  const isSelected = selectedOutcomeId === outcome.id;
                  const isYes = outcome.name.toLowerCase() === 'yes';
                  const isNo = outcome.name.toLowerCase() === 'no';
                  
                  return (
                    <button
                      key={outcome.id}
                      onClick={() => setSelectedOutcomeId(outcome.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? isYes
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : isNo
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-primary bg-primary/10 dark:bg-primary/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {outcome.name}
                        </span>
                        {isSelected && (
                          <IonIcon icon={checkmarkCircle} className="text-primary text-xl" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Points Input */}
            <div>
              <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Amount (Chips)
              </IonLabel>
              
              {/* Quick Select */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {quickAmounts.map((amount) => {
                  // Only disable if amount exceeds market limit
                  const isDisabled = amount > market.max_points_per_user;
                  return (
                    <button
                      key={amount}
                      onClick={() => handleQuickSelect(amount)}
                      disabled={isDisabled}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        points === amount
                          ? 'bg-primary text-black'
                          : isDisabled
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      ₱{amount}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <IonItem className="ion-no-padding" lines="none">
                <IonInput
                  type="number"
                  value={points}
                  onIonInput={(e) => setPoints(parseInt(e.detail.value!) || 0)}
                  placeholder={userForecast ? `Min: ₱${(userForecast.points + 1).toLocaleString()}` : "Enter amount"}
                  min={userForecast ? userForecast.points + 1 : 1}
                  max={market.max_points_per_user}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </IonItem>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {userForecast ? (
                  <>Min: ₱{(userForecast.points + 1).toLocaleString()} | Max: ₱{market.max_points_per_user.toLocaleString()} | Available: ₱{userChips.toLocaleString()}</>
                ) : (
                  <>Min: ₱1 | Max: ₱{market.max_points_per_user.toLocaleString()} | Available: ₱{userChips.toLocaleString()}</>
                )}
                {userChips === 0 && (
                  <span className="text-primary font-semibold ml-1">(Purchase chips to continue)</span>
                )}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {userForecast ? (
                <>
                  <IonButton
                    expand="block"
                    onClick={handleSubmit}
                    disabled={isLoading || (points <= userForecast.points && selectedOutcomeId === userForecast.outcome_id)}
                    className="button-primary flex-1"
                  >
                    {isLoading ? (
                      <>
                        <IonSpinner name="crescent" slot="start" />
                        Updating...
                      </>
                    ) : (
                      'Update Forecast'
                    )}
                  </IonButton>
                </>
              ) : (
                <IonButton
                  expand="block"
                  onClick={handleSubmit}
                  disabled={isLoading || !points || points < 1 || points > market.max_points_per_user}
                  className="button-primary"
                >
                  {isLoading ? (
                    <>
                      <IonSpinner name="crescent" slot="start" />
                      Placing...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={wallet} slot="start" />
                      Buy {selectedOutcome?.name || 'Position'}
                    </>
                  )}
                </IonButton>
              )}
            </div>

            {/* Non-redeemable Reminder */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start">
                <IonIcon icon={informationCircle} className="text-blue-600 dark:text-blue-400 text-lg mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Important Reminder</p>
                  <p>
                    Chips are virtual and non-redeemable. They cannot be converted to cash or withdrawn. 
                    This is a forecasting platform for entertainment purposes only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Confirmation Modal */}
      <IonAlert
        isOpen={showConfirmModal}
        onDidDismiss={() => setShowConfirmModal(false)}
        header={userForecast ? 'Update Forecast?' : 'Confirm Purchase'}
        message={
          userForecast
            ? `Increase your forecast from ₱${userForecast.points.toLocaleString()} to ₱${points.toLocaleString()} chips on "${selectedOutcome?.name}"? This will deduct an additional ₱${(points - userForecast.points).toLocaleString()} from your balance.`
            : `Buy ${points} chips on "${selectedOutcome?.name}"? This will deduct ₱${points} from your balance.`
        }
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: userForecast ? 'Update' : 'Confirm',
            handler: handleConfirm,
          },
        ]}
      />

    </>
  );
};

export default ForecastSlip;


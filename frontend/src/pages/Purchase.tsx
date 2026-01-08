import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonSpinner, IonAlert, IonIcon, IonCard, IonCardContent, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { wallet, informationCircle, checkmarkCircle, closeCircle, arrowBack, trophy, close } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseCreate } from '../types/purchase';

const Purchase: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  
  // Get return URL and required chips from query params
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('return');
  const requiredChips = searchParams.get('required');
  
  // Set initial amount to required chips if provided, otherwise default to 100
  const [chipsAmount, setChipsAmount] = useState<number>(
    requiredChips ? Math.max(parseInt(requiredChips, 10), 20) : 100
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Predefined chip amounts
  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  const handleQuickSelect = (amount: number) => {
    setChipsAmount(amount);
  };

  const validateAmount = (): string | null => {
    if (!chipsAmount || chipsAmount < 20) {
      return 'Minimum purchase is 20 chips (₱20)';
    }
    if (chipsAmount > 100000) {
      return 'Maximum purchase is 100,000 chips (₱100,000)';
    }
    return null;
  };

  const handlePurchase = async () => {
    const validationError = validateAmount();
    if (validationError) {
      setAlertHeader('Validation Error');
      setAlertMessage(validationError);
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const purchaseData: PurchaseCreate = {
        chips_added: chipsAmount,
      };

      const response = await api.post('/api/v1/purchases/checkout', purchaseData);

      if (response.data.success) {
        const { purchase, new_balance } = response.data.data;
        
        // Update user chips in context
        if (user) {
          updateUser({ chips: new_balance });
        }

        setAlertHeader('Purchase Successful!');
        setAlertMessage(
          `You successfully purchased ${purchase.chips_added.toLocaleString()} chips (₱${purchase.chips_added.toLocaleString()}). Your new balance is ₱${new_balance.toLocaleString()}.`
        );
        setIsSuccess(true);
        setShowAlert(true);
        
        // If there's a return URL, redirect back after a short delay
        if (returnUrl) {
          setTimeout(() => {
            history.push(returnUrl);
          }, 2000);
        } else {
          // Reset form after success if no return URL
          setTimeout(() => {
            setChipsAmount(100);
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Error purchasing chips:', error);
      setAlertHeader('Purchase Failed');
      setAlertMessage(
        error.response?.data?.detail || error.response?.data?.errors?.[0]?.message || 'Failed to purchase chips. Please try again.'
      );
      setIsSuccess(false);
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to purchase chips.
            </p>
            <IonButton onClick={() => history.push('/login')} className="button-primary">
              Log In
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          {/* Back Button */}
          {returnUrl && (
            <IonButton 
              fill="clear" 
              onClick={() => history.push(returnUrl)} 
              className="mb-3 -ml-2"
            >
              <IonIcon icon={arrowBack} slot="start" />
              Back to Market
            </IonButton>
          )}
          
          {/* Header and Balance - Compact */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <IonIcon icon={wallet} className="mr-2" />
                Purchase Chips
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₱{user.chips.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Redirect Message */}
          {returnUrl && requiredChips && (
            <IonCard className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4">
              <IonCardContent className="p-4">
                <div className="flex items-start">
                  <IonIcon icon={informationCircle} className="text-blue-600 dark:text-blue-400 text-xl mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">You need chips to place your forecast</p>
                    <p>
                      You need at least <span className="font-bold">₱20</span> chips to place your forecast (minimum purchase). 
                      {parseInt(requiredChips, 10) > 20 && (
                        <> Your forecast requires <span className="font-bold">₱{parseInt(requiredChips, 10).toLocaleString()}</span> chips.</>
                      )}
                      {' '}After purchasing, you'll be redirected back to continue.
                    </p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Purchase Form Card - More Compact */}
          <IonCard className="bg-white dark:bg-gray-800">
            <IonCardContent className="p-4">
              <div className="space-y-4">
                {/* Quick Select and Custom Input - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quick Select */}
                  <div>
                    <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Quick Select
                    </IonLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((amount) => (
                        <IonButton
                          key={amount}
                          fill={chipsAmount === amount ? 'solid' : 'outline'}
                          onClick={() => handleQuickSelect(amount)}
                          className={chipsAmount === amount ? 'button-primary' : ''}
                          size="small"
                        >
                          ₱{amount.toLocaleString()}
                        </IonButton>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div>
                    <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Custom Amount
                    </IonLabel>
                    <IonItem className="ion-no-padding" lines="none">
                      <IonInput
                        type="number"
                        value={chipsAmount}
                        onIonInput={(e) => setChipsAmount(parseInt(e.detail.value!) || 0)}
                        placeholder="Enter amount"
                        min={20}
                        max={100000}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </IonItem>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Min: ₱20 | Max: ₱100,000
                    </p>
                  </div>
                </div>

                {/* Purchase Summary - Compact Horizontal */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-lg p-3 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Purchase Amount</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ₱{chipsAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Chips</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {chipsAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Purchase Button and History - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <IonButton
                    expand="block"
                    onClick={handlePurchase}
                    disabled={isSubmitting || !chipsAmount || chipsAmount < 20 || chipsAmount > 100000}
                    className="button-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <IonSpinner name="crescent" slot="start" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={wallet} slot="start" />
                        Purchase {chipsAmount.toLocaleString()} Chips
                      </>
                    )}
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => history.push('/purchase/history')}
                  >
                    View History
                  </IonButton>
                </div>

                {/* Winning Chips Notice */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <IonIcon icon={wallet} className="text-green-600 dark:text-green-400 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                        💰 Win Chips When Your Forecasts Are Correct!
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        <strong>Winning users receive chips as rewards!</strong> When markets resolve, you get your original bet back 
                        <strong> plus a proportional share of chips from losing forecasts</strong> (90% of losing chips are distributed to winners). 
                        The more you bet, the larger your share of the rewards. Make accurate forecasts to earn more chips!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prize Notice - Emphasized */}
                <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 dark:from-primary/30 dark:via-secondary/30 dark:to-primary/30 border-2 border-primary/40 dark:border-primary/50 rounded-lg p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <IonIcon icon={trophy} className="text-primary text-3xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <span>🏆 Monthly Top Forecasters Receive Digital Certificates!</span>
                      </h3>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed mb-2">
                        Top-performing forecasters at the end of each month will receive a prestigious digital certificate recognizing their forecasting excellence.{' '}
                        <button
                          onClick={() => setShowCertificateModal(true)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-bold"
                        >
                          Click here for more info...
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compact Disclaimer */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start">
                    <IonIcon icon={informationCircle} className="text-blue-600 dark:text-blue-400 text-lg mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">Test Mode - No Payment Required</p>
                      <p>
                        Chips are virtual, non-redeemable tokens (1 chip = ₱1.00 for reference only). 
                        They cannot be converted to cash or withdrawn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Compact Info Section */}
          <IonCard className="bg-white dark:bg-gray-800 mt-4">
            <IonCardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <IonIcon icon={informationCircle} className="mr-2 text-sm" />
                About Chips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center">
                  <IonIcon icon={checkmarkCircle} className="text-green-500 mr-2 flex-shrink-0" />
                  <span>1 Chip = ₱1.00 (reference only)</span>
                </div>
                <div className="flex items-center">
                  <IonIcon icon={checkmarkCircle} className="text-green-500 mr-2 flex-shrink-0" />
                  <span>Virtual tokens for forecasting</span>
                </div>
                <div className="flex items-center">
                  <IonIcon icon={closeCircle} className="text-red-500 mr-2 flex-shrink-0" />
                  <span>Non-redeemable, no cash value</span>
                </div>
                <div className="flex items-center">
                  <IonIcon icon={closeCircle} className="text-red-500 mr-2 flex-shrink-0" />
                  <span>All purchases are final</span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMessage}
          buttons={['OK']}
          cssClass={isSuccess ? 'alert-success' : ''}
        />

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
              {/* Sample Certificate Preview */}
              <div className="bg-white dark:bg-gray-800 border-2 border-primary/60 dark:border-primary/40 rounded-lg p-8 shadow-lg mb-6">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-full text-sm font-bold mb-2">
                      PILIMARKET CERTIFICATE OF EXCELLENCE
                    </div>
                  </div>
                  <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Top Forecaster
                  </h4>
                  <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                    <span className="font-semibold">January 2026</span> Cycle
                  </p>
                  <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-6 mt-6">
                    <p className="text-base text-gray-600 dark:text-gray-400 italic mb-3">
                      This certificate recognizes exceptional ability to analyze trends, interpret data signals, and make accurate predictions in complex, real-world scenarios.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Demonstrates mastery in pattern recognition, statistical reasoning, and strategic thinking—skills essential for navigating uncertain futures.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About the Certificate</h3>
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Recognition Criteria</h4>
                    <p className="text-sm leading-relaxed">
                      This certificate is awarded to forecasters who achieve top rankings in the monthly leaderboard, demonstrating consistent accuracy and superior analytical capabilities across multiple prediction markets.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What It Represents</h4>
                    <p className="text-sm leading-relaxed">
                      Earning this certificate showcases your ability to synthesize information, identify key indicators, and make well-reasoned predictions—the same skills valued in political analysis, market research, strategic planning, and data-driven decision making.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Professional Value</h4>
                    <p className="text-sm leading-relaxed">
                      This achievement demonstrates your proficiency in quantitative reasoning, risk assessment, and probabilistic thinking. These competencies are highly sought after in fields requiring analytical rigor and strategic foresight.
                    </p>
                  </div>
                </div>
              </div>

              {/* How to Earn Section */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-lg p-6 border border-primary/30 dark:border-primary/40">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <IonIcon icon={trophy} className="text-primary text-xl" />
                  How to Earn This Certificate
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>Climb to the top of the monthly leaderboard by making accurate forecasts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>Maintain high accuracy rates across multiple markets and categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>Build your reputation score through consistent, well-reasoned predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>Stay active and engaged throughout the month to maximize your ranking</span>
                  </li>
                </ul>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Purchase;

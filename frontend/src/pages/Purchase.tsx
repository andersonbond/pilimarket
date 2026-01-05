import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonSpinner, IonAlert, IonIcon, IonCard, IonCardContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { wallet, informationCircle, checkmarkCircle, closeCircle } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseCreate } from '../types/purchase';

const Purchase: React.FC = () => {
  const history = useHistory();
  const { user, updateUser } = useAuth();
  const [chipsAmount, setChipsAmount] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
        
        // Reset form after success
        setTimeout(() => {
          setChipsAmount(100);
        }, 2000);
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
      </IonContent>
    </IonPage>
  );
};

export default Purchase;

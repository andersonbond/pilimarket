import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonSpinner, IonIcon, IonCard, IonCardContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { wallet, arrowBack, checkmarkCircle, closeCircle, time, refresh } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Purchase } from '../types/purchase';

const PurchaseHistory: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user, page]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/purchases', {
        params: {
          page,
          limit: 20,
        },
      });

      if (response.data.success) {
        setPurchases(response.data.data.purchases);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'refunded':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return checkmarkCircle;
      case 'failed':
        return closeCircle;
      case 'pending':
        return time;
      default:
        return time;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to view purchase history.
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
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <IonIcon icon={wallet} className="mr-2" />
                Purchase History
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View all your chip purchases
              </p>
            </div>
            <IonButton onClick={() => history.push('/purchase')} className="button-primary">
              <IonIcon icon={wallet} slot="start" />
              Buy Chips
            </IonButton>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : purchases.length === 0 ? (
            <IonCard className="bg-white dark:bg-gray-800">
              <IonCardContent className="p-12 text-center">
                <IonIcon icon={wallet} className="text-6xl text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Purchases Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven't made any chip purchases yet.
                </p>
                <IonButton onClick={() => history.push('/purchase')} className="button-primary">
                  Purchase Chips
                </IonButton>
              </IonCardContent>
            </IonCard>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {purchases.map((purchase) => (
                  <IonCard key={purchase.id} className="bg-white dark:bg-gray-800">
                    <IonCardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <IonIcon
                              icon={getStatusIcon(purchase.status)}
                              className={`text-xl ${getStatusColor(purchase.status)}`}
                            />
                            <span className={`font-semibold capitalize ${getStatusColor(purchase.status)}`}>
                              {purchase.status}
                            </span>
                            {purchase.provider === 'test' && (
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                Test Mode
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chips Added</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {purchase.chips_added.toLocaleString()} chips
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                ₱{(purchase.amount_cents / 100).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {formatDate(purchase.created_at)}
                              </p>
                            </div>
                          </div>
                          {purchase.provider_tx_id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Transaction ID: {purchase.provider_tx_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <IonButton
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    fill="outline"
                    size="small"
                  >
                    Previous
                  </IonButton>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <IonButton
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    fill="outline"
                    size="small"
                  >
                    Next
                  </IonButton>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PurchaseHistory;


import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonBadge,
  IonDatetime,
  IonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { arrowBackOutline, cashOutline } from 'ionicons/icons';
import Header from '../components/Header';
import { getPurchases, PurchaseMonitoring } from '../services/admin';

const AdminPurchaseMonitoring: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseMonitoring[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    fetchPurchases();
  }, [page, statusFilter]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const response = await getPurchases(
        page,
        20,
        undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      if (response.success) {
        setPurchases(response.data.purchases);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setAlertMessage('Failed to fetch purchases');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₱${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'medium';
      default:
        return 'medium';
    }
  };

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6">
          <div className="flex items-center mb-6">
            <IonButton fill="clear" onClick={() => history.push('/admin')}>
              <IonIcon icon={arrowBackOutline} slot="start" />
              Back to Dashboard
            </IonButton>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white ml-4">Purchase Monitoring</h1>
          </div>

          <IonCard className="bg-white dark:bg-gray-800 shadow-sm mb-4">
            <IonCardContent>
              <IonSegment
                value={statusFilter}
                onIonChange={(e) => {
                  setStatusFilter(e.detail.value as string);
                  setPage(1);
                }}
              >
                <IonSegmentButton value="all">All</IonSegmentButton>
                <IonSegmentButton value="completed">Completed</IonSegmentButton>
                <IonSegmentButton value="pending">Pending</IonSegmentButton>
                <IonSegmentButton value="failed">Failed</IonSegmentButton>
                <IonSegmentButton value="refunded">Refunded</IonSegmentButton>
              </IonSegment>
            </IonCardContent>
          </IonCard>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : (
            <>
              <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                <IonCardHeader>
                  <IonCardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Purchases ({purchases.length})
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {purchases.map((purchase) => (
                      <IonItem key={purchase.id} className="mb-2 rounded-lg">
                        <IonIcon icon={cashOutline} slot="start" className="text-primary-500 text-2xl" />
                        <IonLabel>
                          <h2 className="font-semibold text-gray-900 dark:text-white">
                            {purchase.user_display_name || purchase.user_email || purchase.user_id}
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(purchase.created_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <IonBadge color={getStatusColor(purchase.status)}>
                              {purchase.status}
                            </IonBadge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Provider: {purchase.provider}
                            </span>
                          </div>
                        </IonLabel>
                        <div slot="end" className="text-right">
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatCurrency(purchase.amount_cents)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {purchase.chips_added.toLocaleString()} chips
                          </p>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <IonButton
                    fill="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </IonButton>
                  <span className="text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <IonButton
                    fill="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </IonButton>
                </div>
              )}
            </>
          )}
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminPurchaseMonitoring;


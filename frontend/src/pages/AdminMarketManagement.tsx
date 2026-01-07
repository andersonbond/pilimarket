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
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonTextarea,
  IonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { pauseCircleOutline, playCircleOutline, flagOutline, arrowBackOutline } from 'ionicons/icons';
import Header from '../components/Header';
import { getMarkets, suspendMarket, unsuspendMarket, MarketManagement } from '../services/admin';

const AdminMarketManagement: React.FC = () => {
  const [markets, setMarkets] = useState<MarketManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMarket, setSelectedMarket] = useState<MarketManagement | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    fetchMarkets();
  }, [page, searchTerm, statusFilter, categoryFilter]);

  const fetchMarkets = async () => {
    setIsLoading(true);
    try {
      const response = await getMarkets(
        page,
        20,
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined,
        categoryFilter !== 'all' ? categoryFilter : undefined
      );
      if (response.success) {
        setMarkets(response.data.markets);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
      setAlertMessage('Failed to fetch markets');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (market: MarketManagement) => {
    try {
      if (market.status === 'suspended') {
        await unsuspendMarket(market.id);
        setAlertMessage('Market unsuspended successfully');
      } else {
        await suspendMarket(market.id, actionReason || undefined);
        setAlertMessage('Market suspended successfully');
      }
      setShowSuspendModal(false);
      setActionReason('');
      fetchMarkets();
      setShowAlert(true);
    } catch (error: any) {
      setAlertMessage(error.response?.data?.detail || 'Failed to suspend/unsuspend market');
      setShowAlert(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'resolved':
        return 'primary';
      case 'cancelled':
        return 'danger';
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white ml-4">Market Management</h1>
          </div>

          <IonCard className="bg-white dark:bg-gray-800 shadow-sm mb-4">
            <IonCardContent>
              <IonSearchbar
                value={searchTerm}
                onIonInput={(e) => {
                  setSearchTerm(e.detail.value || '');
                  setPage(1);
                }}
                placeholder="Search by title"
                className="mb-4"
              />
              <div className="mb-4">
                <IonSegment
                  value={statusFilter}
                  onIonChange={(e) => {
                    setStatusFilter(e.detail.value as string);
                    setPage(1);
                  }}
                >
                  <IonSegmentButton value="all">All Status</IonSegmentButton>
                  <IonSegmentButton value="open">Open</IonSegmentButton>
                  <IonSegmentButton value="suspended">Suspended</IonSegmentButton>
                  <IonSegmentButton value="resolved">Resolved</IonSegmentButton>
                </IonSegment>
              </div>
              <IonSegment
                value={categoryFilter}
                onIonChange={(e) => {
                  setCategoryFilter(e.detail.value as string);
                  setPage(1);
                }}
              >
                <IonSegmentButton value="all">All Categories</IonSegmentButton>
                <IonSegmentButton value="election">Election</IonSegmentButton>
                <IonSegmentButton value="politics">Politics</IonSegmentButton>
                <IonSegmentButton value="sports">Sports</IonSegmentButton>
                <IonSegmentButton value="entertainment">Entertainment</IonSegmentButton>
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
                    Markets ({markets.length})
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {markets.map((market) => (
                      <IonItem key={market.id} className="mb-2 rounded-lg">
                        <IonLabel>
                          <h2 className="font-semibold text-gray-900 dark:text-white">{market.title}</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{market.category}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <IonBadge color={getStatusColor(market.status)}>
                              {market.status}
                            </IonBadge>
                            {market.is_flagged && (
                              <IonBadge color="danger">
                                <IonIcon icon={flagOutline} className="mr-1" />
                                Flagged
                              </IonBadge>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {market.total_forecasts} forecasts • ₱{market.total_points.toLocaleString()} total
                            </span>
                          </div>
                        </IonLabel>
                        <div slot="end" className="flex gap-2">
                          {market.status !== 'resolved' && market.status !== 'cancelled' && (
                            <IonButton
                              fill="outline"
                              size="small"
                              color={market.status === 'suspended' ? 'success' : 'warning'}
                              onClick={() => {
                                setSelectedMarket(market);
                                setShowSuspendModal(true);
                              }}
                            >
                              <IonIcon
                                icon={market.status === 'suspended' ? playCircleOutline : pauseCircleOutline}
                                slot="start"
                              />
                              {market.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                            </IonButton>
                          )}
                          <IonButton
                            fill="outline"
                            size="small"
                            onClick={() => history.push(`/markets/${market.id}`)}
                          >
                            View
                          </IonButton>
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

        {/* Suspend/Unsuspend Modal */}
        <IonModal isOpen={showSuspendModal} onDidDismiss={() => setShowSuspendModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {selectedMarket?.status === 'suspended' ? 'Unsuspend Market' : 'Suspend Market'}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSuspendModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              {selectedMarket?.status === 'suspended'
                ? `Are you sure you want to unsuspend "${selectedMarket.title}"?`
                : `Are you sure you want to suspend "${selectedMarket?.title}"?`}
            </p>
            <IonTextarea
              placeholder="Reason (optional)"
              value={actionReason}
              onIonInput={(e) => setActionReason(e.detail.value || '')}
              rows={3}
              className="mb-4"
            />
            <IonButton
              expand="block"
              color={selectedMarket?.status === 'suspended' ? 'success' : 'warning'}
              onClick={() => selectedMarket && handleSuspend(selectedMarket)}
            >
              {selectedMarket?.status === 'suspended' ? 'Unsuspend Market' : 'Suspend Market'}
            </IonButton>
          </IonContent>
        </IonModal>

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

export default AdminMarketManagement;


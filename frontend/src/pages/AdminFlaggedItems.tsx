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
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonBadge,
  IonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { flagOutline, checkmarkCircleOutline, arrowBackOutline } from 'ionicons/icons';
import Header from '../components/Header';
import { getFlaggedItems, unflagItem, FlaggedItem } from '../services/admin';

const AdminFlaggedItems: React.FC = () => {
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    fetchFlaggedItems();
  }, [page, itemTypeFilter]);

  const fetchFlaggedItems = async () => {
    setIsLoading(true);
    try {
      const response = await getFlaggedItems(
        page,
        20,
        itemTypeFilter !== 'all' ? itemTypeFilter : undefined
      );
      if (response.success) {
        setFlaggedItems(response.data.items);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching flagged items:', error);
      setAlertMessage('Failed to fetch flagged items');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnflag = async (item: FlaggedItem) => {
    try {
      await unflagItem(item.type, item.item_id);
      setAlertMessage('Item unflagged successfully');
      fetchFlaggedItems();
      setShowAlert(true);
    } catch (error: any) {
      setAlertMessage(error.response?.data?.detail || 'Failed to unflag item');
      setShowAlert(true);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white ml-4">Flagged Items</h1>
          </div>

          <IonCard className="bg-white dark:bg-gray-800 shadow-sm mb-4">
            <IonCardContent>
              <IonSegment
                value={itemTypeFilter}
                onIonChange={(e) => {
                  setItemTypeFilter(e.detail.value as string);
                  setPage(1);
                }}
              >
                <IonSegmentButton value="all">All</IonSegmentButton>
                <IonSegmentButton value="forecast">Forecasts</IonSegmentButton>
                <IonSegmentButton value="user">Users</IonSegmentButton>
                <IonSegmentButton value="market">Markets</IonSegmentButton>
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
                    Flagged Items ({flaggedItems.length})
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {flaggedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <IonIcon icon={flagOutline} className="text-6xl mb-4 opacity-50" />
                      <p>No flagged items found</p>
                    </div>
                  ) : (
                    <IonList>
                      {flaggedItems.map((item) => (
                        <IonItem key={item.id} className="mb-2 rounded-lg">
                          <IonIcon icon={flagOutline} slot="start" className="text-red-500 text-2xl" />
                          <IonLabel>
                            <h2 className="font-semibold text-gray-900 dark:text-white capitalize">
                              {item.type}: {item.item_id}
                            </h2>
                            {item.reason && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Reason: {item.reason}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <IonBadge color="warning">{item.status}</IonBadge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.flagged_at).toLocaleString()}
                              </span>
                            </div>
                          </IonLabel>
                          <div slot="end" className="flex gap-2">
                            {item.type === 'forecast' && item.meta_data?.market_id && (
                              <IonButton
                                fill="outline"
                                size="small"
                                onClick={() => history.push(`/markets/${item.meta_data.market_id}`)}
                              >
                                View Market
                              </IonButton>
                            )}
                            <IonButton
                              fill="outline"
                              size="small"
                              color="success"
                              onClick={() => handleUnflag(item)}
                            >
                              <IonIcon icon={checkmarkCircleOutline} slot="start" />
                              Unflag
                            </IonButton>
                          </div>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
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

export default AdminFlaggedItems;


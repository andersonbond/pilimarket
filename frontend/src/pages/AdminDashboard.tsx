import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { peopleOutline, statsChartOutline, cashOutline, flagOutline, banOutline, lockClosedOutline, pauseCircleOutline } from 'ionicons/icons';
import Header from '../components/Header';
import { getAdminStats, AdminStats } from '../services/admin';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (cents: number) => {
    return `₱${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <IonPage>
        <Header />
        <IonContent className="ion-padding">
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>

          {stats && (
            <IonGrid>
              <IonRow>
                {/* Stats Cards */}
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Users
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center">
                        <IonIcon icon={peopleOutline} className="text-4xl text-primary-500 mr-3" />
                        <div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats.total_users.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Markets
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center">
                        <IonIcon icon={statsChartOutline} className="text-4xl text-primary-500 mr-3" />
                        <div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats.total_markets.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Forecasts
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center">
                        <IonIcon icon={statsChartOutline} className="text-4xl text-primary-500 mr-3" />
                        <div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats.total_forecasts.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Revenue
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center">
                        <IonIcon icon={cashOutline} className="text-4xl text-primary-500 mr-3" />
                        <div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(stats.total_revenue_cents)}
                          </p>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow className="mt-4">
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Active Users (30d)
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.active_users_30d.toLocaleString()}
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Flagged Items
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.flagged_items_count.toLocaleString()}
                        </p>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => history.push('/admin/flagged')}
                        >
                          View
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Suspended Markets
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.suspended_markets_count.toLocaleString()}
                        </p>
                        <IonIcon icon={pauseCircleOutline} className="text-2xl text-yellow-500" />
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Banned Users
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.banned_users_count.toLocaleString()}
                        </p>
                        <IonIcon icon={banOutline} className="text-2xl text-red-500" />
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow className="mt-4">
                <IonCol size="12" sizeMd="6" sizeLg="3">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Frozen Accounts
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.frozen_accounts_count.toLocaleString()}
                        </p>
                        <IonIcon icon={lockClosedOutline} className="text-2xl text-orange-500" />
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              {/* Quick Actions */}
              <IonRow className="mt-6">
                <IonCol size="12">
                  <IonCard className="bg-white dark:bg-gray-800 shadow-sm">
                    <IonCardHeader>
                      <IonCardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Quick Actions
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <IonButton
                          expand="block"
                          fill="outline"
                          onClick={() => history.push('/admin/users')}
                        >
                          Manage Users
                        </IonButton>
                        <IonButton
                          expand="block"
                          fill="outline"
                          onClick={() => history.push('/admin/markets')}
                        >
                          Manage Markets
                        </IonButton>
                        <IonButton
                          expand="block"
                          fill="outline"
                          onClick={() => history.push('/admin/purchases')}
                        >
                          Monitor Purchases
                        </IonButton>
                        <IonButton
                          expand="block"
                          fill="outline"
                          onClick={() => history.push('/admin/flagged')}
                        >
                          Review Flagged Items
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;


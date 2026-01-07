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
import { banOutline, checkmarkCircleOutline, lockClosedOutline, lockOpenOutline, arrowBackOutline } from 'ionicons/icons';
import Header from '../components/Header';
import { getUsers, banUser, unbanUser, freezeChips, UserManagement } from '../services/admin';

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getUsers(page, 20, searchTerm || undefined, statusFilter !== 'all' ? statusFilter : undefined);
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlertMessage('Failed to fetch users');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async (user: UserManagement) => {
    try {
      if (user.is_banned) {
        await unbanUser(user.id);
        setAlertMessage('User unbanned successfully');
      } else {
        await banUser(user.id, actionReason || undefined);
        setAlertMessage('User banned successfully');
      }
      setShowBanModal(false);
      setActionReason('');
      fetchUsers();
      setShowAlert(true);
    } catch (error: any) {
      setAlertMessage(error.response?.data?.detail || 'Failed to ban/unban user');
      setShowAlert(true);
    }
  };

  const handleFreeze = async (user: UserManagement) => {
    try {
      await freezeChips(user.id, !user.chips_frozen, actionReason || undefined);
      setAlertMessage(`User chips ${user.chips_frozen ? 'unfrozen' : 'frozen'} successfully`);
      setShowFreezeModal(false);
      setActionReason('');
      fetchUsers();
      setShowAlert(true);
    } catch (error: any) {
      setAlertMessage(error.response?.data?.detail || 'Failed to freeze/unfreeze chips');
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white ml-4">User Management</h1>
          </div>

          <IonCard className="bg-white dark:bg-gray-800 shadow-sm mb-4">
            <IonCardContent>
              <IonSearchbar
                value={searchTerm}
                onIonInput={(e) => {
                  setSearchTerm(e.detail.value || '');
                  setPage(1);
                }}
                placeholder="Search by email or display name"
                className="mb-4"
              />
              <IonSegment
                value={statusFilter}
                onIonChange={(e) => {
                  setStatusFilter(e.detail.value as string);
                  setPage(1);
                }}
              >
                <IonSegmentButton value="all">All</IonSegmentButton>
                <IonSegmentButton value="active">Active</IonSegmentButton>
                <IonSegmentButton value="banned">Banned</IonSegmentButton>
                <IonSegmentButton value="frozen">Frozen</IonSegmentButton>
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
                    Users ({users.length})
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {users.map((user) => (
                      <IonItem key={user.id} className="mb-2 rounded-lg">
                        <IonLabel>
                          <h2 className="font-semibold text-gray-900 dark:text-white">{user.display_name}</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <IonBadge color={user.is_banned ? 'danger' : 'success'}>
                              {user.is_banned ? 'Banned' : 'Active'}
                            </IonBadge>
                            {user.chips_frozen && (
                              <IonBadge color="warning">Frozen</IonBadge>
                            )}
                            {user.is_admin && (
                              <IonBadge color="primary">Admin</IonBadge>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ₱{user.chips.toLocaleString()} • {user.total_forecasts} forecasts • {user.total_purchases} purchases
                            </span>
                          </div>
                        </IonLabel>
                        <div slot="end" className="flex gap-2">
                          <IonButton
                            fill="outline"
                            size="small"
                            color={user.is_banned ? 'success' : 'danger'}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanModal(true);
                            }}
                          >
                            <IonIcon icon={user.is_banned ? checkmarkCircleOutline : banOutline} slot="start" />
                            {user.is_banned ? 'Unban' : 'Ban'}
                          </IonButton>
                          <IonButton
                            fill="outline"
                            size="small"
                            color={user.chips_frozen ? 'success' : 'warning'}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowFreezeModal(true);
                            }}
                          >
                            <IonIcon icon={user.chips_frozen ? lockOpenOutline : lockClosedOutline} slot="start" />
                            {user.chips_frozen ? 'Unfreeze' : 'Freeze'}
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

        {/* Ban/Unban Modal */}
        <IonModal isOpen={showBanModal} onDidDismiss={() => setShowBanModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedUser?.is_banned ? 'Unban User' : 'Ban User'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowBanModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              {selectedUser?.is_banned
                ? `Are you sure you want to unban ${selectedUser.display_name}?`
                : `Are you sure you want to ban ${selectedUser?.display_name}?`}
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
              color={selectedUser?.is_banned ? 'success' : 'danger'}
              onClick={() => selectedUser && handleBan(selectedUser)}
            >
              {selectedUser?.is_banned ? 'Unban User' : 'Ban User'}
            </IonButton>
          </IonContent>
        </IonModal>

        {/* Freeze/Unfreeze Modal */}
        <IonModal isOpen={showFreezeModal} onDidDismiss={() => setShowFreezeModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedUser?.chips_frozen ? 'Unfreeze Chips' : 'Freeze Chips'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowFreezeModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              {selectedUser?.chips_frozen
                ? `Are you sure you want to unfreeze chips for ${selectedUser.display_name}?`
                : `Are you sure you want to freeze chips for ${selectedUser?.display_name}?`}
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
              color={selectedUser?.chips_frozen ? 'success' : 'warning'}
              onClick={() => selectedUser && handleFreeze(selectedUser)}
            >
              {selectedUser?.chips_frozen ? 'Unfreeze Chips' : 'Freeze Chips'}
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

export default AdminUserManagement;


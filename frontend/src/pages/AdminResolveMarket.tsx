import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonTextarea, IonItem, IonLabel, IonSpinner, IonAlert, IonIcon, IonCard, IonCardContent, IonSelect, IonSelectOption } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { checkmarkCircle, closeCircle, documentText, linkOutline, addCircleOutline, trashOutline, warningOutline } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Market, Outcome } from '../types/market';

interface ResolutionCreate {
  outcome_id: string;
  evidence_urls: string[];
  resolution_note: string;
}

const AdminResolveMarket: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<ResolutionCreate>({
    outcome_id: '',
    evidence_urls: [''],
    resolution_note: '',
  });

  useEffect(() => {
    fetchMarket();
  }, [id]);

  const fetchMarket = async () => {
    try {
      const response = await api.get(`/api/v1/markets/${id}`);
      if (response.data.success) {
        const marketData = response.data.data.market;
        setMarket(marketData);
        // Set default outcome to first outcome
        if (marketData.outcomes && marketData.outcomes.length > 0) {
          setFormData((prev) => ({
            ...prev,
            outcome_id: marketData.outcomes[0].id,
          }));
        }
      }
    } catch (error: any) {
      console.error('Error fetching market:', error);
      setAlertHeader('Error');
      setAlertMessage(error.response?.data?.detail || 'Failed to load market');
      setIsSuccess(false);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ResolutionCreate, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEvidenceUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.evidence_urls];
    newUrls[index] = value;
    handleInputChange('evidence_urls', newUrls);
  };

  const addEvidenceUrl = () => {
    handleInputChange('evidence_urls', [...formData.evidence_urls, '']);
  };

  const removeEvidenceUrl = (index: number) => {
    if (formData.evidence_urls.length > 1) {
      const newUrls = formData.evidence_urls.filter((_, i) => i !== index);
      handleInputChange('evidence_urls', newUrls);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.outcome_id) {
      return 'Please select a winning outcome';
    }
    
    // Filter out empty URLs
    const validUrls = formData.evidence_urls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      return 'Please provide at least one evidence URL';
    }
    
    // Check minimum URLs based on category
    const minUrls = market?.category.toLowerCase() === 'election' ? 2 : 1;
    if (validUrls.length < minUrls) {
      return `At least ${minUrls} evidence URL(s) required for ${market?.category} markets`;
    }
    
    // Validate URL format
    for (const url of validUrls) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'All evidence URLs must start with http:// or https://';
      }
    }
    
    if (!formData.resolution_note || formData.resolution_note.trim().length < 10) {
      return 'Resolution note must be at least 10 characters';
    }
    
    if (formData.resolution_note.length > 5000) {
      return 'Resolution note must be less than 5000 characters';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setAlertHeader('Validation Error');
      setAlertMessage(validationError);
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out empty URLs
      const validUrls = formData.evidence_urls.filter(url => url.trim() !== '');
      
      const resolutionData: ResolutionCreate = {
        outcome_id: formData.outcome_id,
        evidence_urls: validUrls,
        resolution_note: formData.resolution_note.trim(),
      };

      const response = await api.post(`/api/v1/markets/${id}/resolve`, resolutionData);

      if (response.data.success) {
        setAlertHeader('Market Resolved!');
        setAlertMessage(
          `Market resolved successfully. ${response.data.data.scoring.won} forecasts won, ${response.data.data.scoring.lost} forecasts lost.`
        );
        setIsSuccess(true);
        setShowAlert(true);
        
        // Redirect to market detail page after a short delay
        setTimeout(() => {
          history.push(`/markets/${id}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error resolving market:', error);
      setAlertHeader('Resolution Failed');
      setAlertMessage(
        error.response?.data?.detail || error.response?.data?.errors?.[0]?.message || 'Failed to resolve market. Please try again.'
      );
      setIsSuccess(false);
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || (!user.is_admin && !user.is_market_moderator)) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Market moderator or admin access required.
            </p>
            <IonButton onClick={() => history.push('/')} className="button-primary">
              Go Home
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (isLoading) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-4xl flex justify-center items-center min-h-screen">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!market) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Market not found.
            </p>
            <IonButton onClick={() => history.push('/markets')} className="button-primary">
              Browse Markets
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (market.status === 'resolved') {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <IonIcon icon={warningOutline} className="text-6xl text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Market Already Resolved</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This market has already been resolved. Resolutions are immutable.
            </p>
            <IonButton onClick={() => history.push(`/markets/${id}`)} className="button-primary">
              View Market
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const minEvidenceUrls = market.category.toLowerCase() === 'election' ? 2 : 1;
  const selectedOutcome = market.outcomes?.find(o => o.id === formData.outcome_id);

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <IonButton fill="clear" onClick={() => history.push(`/markets/${id}`)} className="mb-4 -ml-2">
            <IonIcon icon={closeCircle} slot="start" />
            Cancel
          </IonButton>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resolve Market</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Once resolved, this market cannot be changed. All forecasts will be scored as won or lost.
          </p>

          {/* Market Info Card */}
          <IonCard className="bg-white dark:bg-gray-800 mb-6">
            <IonCardContent className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{market.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Category: {market.category}</p>
            </IonCardContent>
          </IonCard>

          <IonCard className="bg-white dark:bg-gray-800">
            <IonCardContent className="p-4 space-y-6">
              {/* Winning Outcome Selection */}
              <div>
                <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Winning Outcome <span className="text-red-500">*</span>
                </IonLabel>
                <IonSelect
                  value={formData.outcome_id}
                  onIonChange={(e) => handleInputChange('outcome_id', e.detail.value)}
                  interface="popover"
                  className="custom-select"
                >
                  {market.outcomes?.map((outcome) => (
                    <IonSelectOption key={outcome.id} value={outcome.id}>
                      {outcome.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
                {selectedOutcome && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Selected: <span className="font-semibold">{selectedOutcome.name}</span>
                  </p>
                )}
              </div>

              {/* Evidence URLs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Evidence URLs <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (Min: {minEvidenceUrls})
                    </span>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={addEvidenceUrl}
                    className="text-primary"
                  >
                    <IonIcon icon={addCircleOutline} slot="start" />
                    Add URL
                  </IonButton>
                </div>
                {formData.evidence_urls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <IonItem className="ion-no-padding flex-1" lines="none">
                      <IonInput
                        type="url"
                        value={url}
                        onIonInput={(e) => handleEvidenceUrlChange(index, e.detail.value!)}
                        placeholder="https://example.com/evidence"
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </IonItem>
                    {formData.evidence_urls.length > 1 && (
                      <IonButton
                        fill="clear"
                        color="danger"
                        onClick={() => removeEvidenceUrl(index)}
                        className="flex-shrink-0"
                      >
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Provide links to evidence supporting this resolution. Must start with http:// or https://
                </p>
              </div>

              {/* Resolution Note */}
              <div>
                <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Resolution Note <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ({formData.resolution_note.length}/5000)
                  </span>
                </IonLabel>
                <IonTextarea
                  value={formData.resolution_note}
                  onIonInput={(e) => handleInputChange('resolution_note', e.detail.value!)}
                  placeholder="Explain how this market was resolved and why this outcome won..."
                  rows={6}
                  maxlength={5000}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 10 characters. This explanation will be visible to all users.
                </p>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <IonIcon icon={warningOutline} className="text-yellow-600 dark:text-yellow-400 text-xl mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-semibold mb-1">This action cannot be undone</p>
                    <p>
                      Once you resolve this market, all forecasts will be automatically scored as won or lost.
                      The resolution cannot be changed or deleted.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <IonButton
                  expand="block"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="button-primary flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <IonSpinner name="crescent" slot="start" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={checkmarkCircle} slot="start" />
                      Resolve Market
                    </>
                  )}
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => history.push(`/markets/${id}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </IonButton>
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

export default AdminResolveMarket;


import React, { useState, useRef } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonTextarea, IonItem, IonLabel, IonSpinner, IonAlert, IonIcon, IonDatetime } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { imageOutline, closeCircle, documentText, calendarOutline } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminCreateMarket: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rules: '',
    category: 'politics',
    max_points_per_user: 10000,
    image_url: '',
    end_date: '', // ISO datetime string
    outcomes: [
      { name: 'Yes' },
      { name: 'No' },
    ],
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const categories = [
    { value: 'election', label: 'Election' },
    { value: 'politics', label: 'Politics' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'economy', label: 'Economy' },
    { value: 'weather', label: 'Weather' },
    { value: 'other', label: 'Other' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index].name = value;
    setFormData((prev) => ({
      ...prev,
      outcomes: newOutcomes,
    }));
  };

  const addOutcome = () => {
    if (formData.outcomes.length < 10) {
      setFormData((prev) => ({
        ...prev,
        outcomes: [...prev.outcomes, { name: '' }],
      }));
    }
  };

  const removeOutcome = (index: number) => {
    if (formData.outcomes.length > 2) {
      const newOutcomes = formData.outcomes.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        outcomes: newOutcomes,
      }));
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setAlertHeader('File Too Large');
      setAlertMessage('Image size must be less than 10MB');
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAlertHeader('Invalid File Type');
      setAlertMessage('Please upload a JPEG, PNG, GIF, or WebP image');
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/v1/markets/upload-image', formData);

      if (response.data.success) {
        const imageUrl = response.data.data.image_url;
        handleInputChange('image_url', imageUrl);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setAlertHeader('Upload Error');
      setAlertMessage(
        error.response?.data?.detail || 'Failed to upload image. Please try again.'
      );
      setIsSuccess(false);
      setShowAlert(true);
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    handleInputChange('image_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim() || formData.title.length < 5) {
      return 'Title must be at least 5 characters';
    }
    if (!formData.rules.trim() || formData.rules.length < 10) {
      return 'Resolution rules must be at least 10 characters';
    }
    if (formData.outcomes.length < 2) {
      return 'At least 2 outcomes are required';
    }
    if (formData.outcomes.length > 10) {
      return 'Maximum 10 outcomes allowed';
    }
    for (const outcome of formData.outcomes) {
      if (!outcome.name.trim()) {
        return 'All outcomes must have a name';
      }
    }
    // Check for duplicate outcome names
    const names = formData.outcomes.map((o) => o.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      return 'Outcome names must be unique';
    }
    if (formData.max_points_per_user < 1 || formData.max_points_per_user > 1000000) {
      return 'Max points per user must be between 1 and 1,000,000';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const response = await api.post('/api/v1/markets', {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        rules: formData.rules.trim() || undefined,
        category: formData.category,
        max_points_per_user: formData.max_points_per_user,
        image_url: formData.image_url || undefined,
        end_date: formData.end_date || undefined,
        outcomes: formData.outcomes.map((o) => ({ name: o.name.trim() })),
      });

      if (response.data.success) {
        setAlertHeader('Success');
        setAlertMessage('Market created successfully!');
        setIsSuccess(true);
        setShowAlert(true);
        
        // Redirect to market detail page after a delay
        setTimeout(() => {
          history.push(`/markets/${response.data.data.market.id}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error creating market:', error);
      setAlertHeader('Error');
      setAlertMessage(
        error.response?.data?.detail || error.response?.data?.errors?.[0]?.message || 'Failed to create market'
      );
      setIsSuccess(false);
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user is admin or market moderator
  if (!user?.is_admin && !user?.is_market_moderator) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need market moderator or admin privileges to create markets.
              </p>
              <IonButton onClick={() => history.push('/markets')}>
                Back to Markets
              </IonButton>
            </div>
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create New Market
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Fill out the form below to create a new prediction market
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Market Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <IonIcon icon={documentText} className="mr-2" />
                Market Information
              </h2>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Market Title *
                  </IonLabel>
                  <IonInput
                    value={formData.title}
                    onIonInput={(e) => handleInputChange('title', e.detail.value!)}
                    placeholder="e.g., Will X win the 2028 election?"
                    required
                    minlength={5}
                    maxlength={200}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Description (Optional)
                  </IonLabel>
                  <IonTextarea
                    value={formData.description}
                    onIonInput={(e) => handleInputChange('description', e.detail.value!)}
                    placeholder="Provide additional context about this market..."
                    rows={4}
                    maxlength={5000}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.description.length}/5000 characters
                  </p>
                </div>

                {/* Rules */}
                <div>
                  <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Resolution Rules *
                  </IonLabel>
                  <IonTextarea
                    value={formData.rules}
                    onIonInput={(e) => handleInputChange('rules', e.detail.value!)}
                    placeholder="Describe how this market will be resolved. For example: 'This market resolves to Yes if X wins the election according to official election results. Otherwise, it resolves to No.'"
                    rows={5}
                    maxlength={5000}
                    required
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.rules.length}/5000 characters - Explain how the outcome will be determined
                  </p>
                </div>

                {/* Category and Max Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Category *
                    </IonLabel>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Max Points Per User *
                    </IonLabel>
                    <IonInput
                      type="number"
                      value={formData.max_points_per_user}
                      onIonInput={(e) => handleInputChange('max_points_per_user', parseInt(e.detail.value!) || 10000)}
                      min={1}
                      max={1000000}
                      required
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3"
                    />
                  </div>
                </div>

                {/* Market Deadline */}
                <div>
                  <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block flex items-center">
                    <IonIcon icon={calendarOutline} className="mr-2" />
                    Market Deadline (Optional)
                  </IonLabel>
                  <IonItem className="ion-no-padding" lines="none">
                    <IonDatetime
                      presentation="date-time"
                      value={formData.end_date}
                      onIonChange={(e) => {
                        const value = e.detail.value as string;
                        // Convert to ISO string format
                        if (value) {
                          const date = new Date(value);
                          handleInputChange('end_date', date.toISOString());
                        } else {
                          handleInputChange('end_date', '');
                        }
                      }}
                      min={new Date().toISOString()}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 w-full"
                    />
                  </IonItem>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When forecasting closes for this market. Leave empty for no deadline.
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <IonIcon icon={imageOutline} className="mr-2" />
                Market Image (Optional)
              </h2>
              
              <div className="space-y-4">
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <IonIcon icon={closeCircle} className="text-xl" />
                    </button>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <IonSpinner name="crescent" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <IonIcon icon={imageOutline} className="text-4xl text-gray-400 mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      JPEG, PNG, GIF, or WebP (Max 10MB)
                    </p>
                    {isUploading && (
                      <div className="mt-4">
                        <IonSpinner name="crescent" />
                      </div>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Outcomes Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Outcomes * (At least 2, max 10)
              </h2>
              
              <div className="space-y-3">
                {formData.outcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <IonInput
                        value={outcome.name}
                        onIonInput={(e) => handleOutcomeChange(index, e.detail.value!)}
                        placeholder={`Outcome ${index + 1} name`}
                        required
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3"
                      />
                    </div>
                    {formData.outcomes.length > 2 && (
                      <IonButton
                        type="button"
                        fill="outline"
                        color="danger"
                        onClick={() => removeOutcome(index)}
                        className="flex-shrink-0"
                      >
                        Remove
                      </IonButton>
                    )}
                  </div>
                ))}
                {formData.outcomes.length < 10 && (
                  <IonButton
                    type="button"
                    fill="outline"
                    onClick={addOutcome}
                    className="w-full"
                  >
                    Add Outcome
                  </IonButton>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <IonButton
                type="submit"
                disabled={isSubmitting || isUploading}
                className="button-primary flex-1"
              >
                {isSubmitting ? (
                  <>
                    <IonSpinner name="crescent" slot="start" />
                    Creating...
                  </>
                ) : (
                  'Create Market'
                )}
              </IonButton>
              <IonButton
                type="button"
                fill="outline"
                onClick={() => history.push('/markets')}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </IonButton>
            </div>
          </form>
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

export default AdminCreateMarket;

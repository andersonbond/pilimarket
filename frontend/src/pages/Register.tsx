import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonCheckbox, IonIcon, IonSpinner } from '@ionic/react';
import { personAdd, close, personOutline, callOutline, lockClosedOutline, eyeOutline, eyeOffOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  // Email is auto-generated from display name (field is hidden)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [contactNumberDigits, setContactNumberDigits] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const history = useHistory();

  const handleDisplayNameChange = (value: string) => {
    // Check if input contains special characters
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(value);
    
    if (hasSpecialChars) {
      setDisplayNameError('Only letters and numbers are allowed (no special characters)');
    } else {
      setDisplayNameError('');
    }
    
    // Only allow alphanumeric characters (letters and numbers)
    const alphanumericOnly = value.replace(/[^a-zA-Z0-9]/g, '');
    setDisplayName(alphanumericOnly);
  };

  const handleContactNumberChange = (value: string) => {
    // Only allow digits, max 10 digits
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setContactNumberDigits(digits);
  };

  const validateDisplayName = (): boolean => {
    // Only alphanumeric characters allowed
    const pattern = /^[a-zA-Z0-9]+$/;
    return pattern.test(displayName);
  };

  const validateContactNumber = (): boolean => {
    // Format: +63 followed by exactly 10 digits
    return contactNumberDigits.length === 10;
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 8) return { strength: 1, label: 'Weak', color: 'text-red-500' };
    if (password.length < 12) return { strength: 2, label: 'Medium', color: 'text-yellow-500' };
    return { strength: 3, label: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!validateDisplayName()) {
      setError('Display name must contain only letters and numbers (no special characters)');
      return;
    }

    if (!validateContactNumber()) {
      setError('Contact number must be exactly 10 digits (e.g., 9123456789)');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service');
      return;
    }

    setIsLoading(true);

    try {
      // Email is optional, so we don't send it
      const fullContactNumber = '+63' + contactNumberDigits;
      await register({ password, display_name: displayName, contact_number: fullContactNumber });
      history.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return displayName.length >= 3 && 
           validateDisplayName() &&
           // email.length > 0 && // Email not required for now
           validateContactNumber() && 
           password.length >= 8 && 
           password === confirmPassword && 
           acceptedTerms;
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
          <div className="max-w-md lg:max-w-4xl xl:max-w-5xl w-full">
            {/* Close Button */}
            <div className="flex justify-end mb-2">
              <IonButton 
                fill="clear" 
                onClick={() => history.push('/')} 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                size="default"
              >
                <IonIcon icon={close} slot="icon-only" className="text-2xl" />
              </IonButton>
            </div>

            {/* Logo/Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="/logo.png" 
                  alt="ACBMarket" 
                  className="h-16 w-auto rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-5xl font-dm-sans font-extrabold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                ACBMarket
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Join the prediction market community</p>
            </div>

            {/* Register Card */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Fill in your details to get started</p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-fade-in">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                <style>{`
                  ion-item {
                    --inner-padding-end: 0;
                    --inner-padding-start: 0;
                  }
                  ion-item ion-input {
                    width: 100% !important;
                    flex: 1;
                  }
                  ion-item .item-native {
                    width: 100%;
                  }
                  .contact-number-wrapper {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    gap: 0.5rem;
                  }
                  .contact-number-prefix {
                    user-select: none;
                    pointer-events: none;
                    font-weight: 500;
                  }
                `}</style>
                {/* Display Name */}
                <div className="space-y-2">
                  <IonItem 
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors w-full" 
                    lines="none"
                  >
                    <IonIcon icon={personOutline} slot="start" className="text-gray-400 dark:text-gray-500 text-xl" />
                    <IonLabel position="stacked" className="text-gray-700 dark:text-gray-300 font-medium">
                      Display Name
                    </IonLabel>
                    <IonInput
                      type="text"
                      value={displayName}
                      onIonInput={(e) => handleDisplayNameChange(e.detail.value!)}
                      placeholder="Choose a display name (letters and numbers only)"
                      required
                      minlength={3}
                      maxlength={50}
                      autocomplete="username"
                      className="w-full"
                    />
                  </IonItem>
                  {displayNameError && (
                    <p className="text-xs text-red-500 ml-4 animate-fade-in">{displayNameError}</p>
                  )}
                  {displayName.length > 0 && displayName.length < 3 && !displayNameError && (
                    <p className="text-xs text-red-500 ml-4">Must be at least 3 characters</p>
                  )}
                </div>

                {/* Email - Hidden for now */}
                {/* <div className="space-y-2 hidden">
                  <IonItem 
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors" 
                    lines="none"
                  >
                    <IonIcon icon={mailOutline} slot="start" className="text-gray-400 dark:text-gray-500 text-xl" />
                    <IonLabel position="stacked" className="text-gray-700 dark:text-gray-300 font-medium">
                      Email Address
                    </IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      onIonInput={(e) => setEmail(e.detail.value!)}
                      placeholder="you@example.com"
                      maxlength={255}
                      autocomplete="email"
                    />
                  </IonItem>
                </div> */}

                {/* Contact Number */}
                <div className="space-y-2">
                  <IonItem 
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors w-full" 
                    lines="none"
                  >
                    <IonIcon icon={callOutline} slot="start" className="text-gray-400 dark:text-gray-500 text-xl" />
                    <IonLabel position="stacked" className="text-gray-700 dark:text-gray-300 font-medium">
                      Contact Number
                    </IonLabel>
                    <div className="contact-number-wrapper">
                      <span className="contact-number-prefix text-gray-700 dark:text-gray-300 font-medium">+63</span>
                      <IonInput
                        type="tel"
                        value={contactNumberDigits}
                        onIonInput={(e) => handleContactNumberChange(e.detail.value!)}
                        placeholder="9123456789"
                        required
                        maxlength={10}
                        className="flex-1"
                      />
                    </div>
                  </IonItem>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    Format: +63 followed by 10 digits (e.g., 9123456789)
                  </p>
                  {contactNumberDigits.length > 0 && !validateContactNumber() && (
                    <p className="text-xs text-red-500 ml-4">Must be exactly 10 digits</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <IonItem 
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors w-full" 
                    lines="none"
                  >
                    <IonIcon icon={lockClosedOutline} slot="start" className="text-gray-400 dark:text-gray-500 text-xl" />
                    <IonLabel position="stacked" className="text-gray-700 dark:text-gray-300 font-medium">
                      Password
                    </IonLabel>
                    <IonInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      placeholder="Enter your password"
                      required
                      minlength={8}
                      maxlength={100}
                      autocomplete="new-password"
                      className="w-full"
                    />
                    <IonButton
                      fill="clear"
                      slot="end"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 dark:text-gray-500"
                    >
                      <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} slot="icon-only" />
                    </IonButton>
                  </IonItem>
                  {password.length > 0 && (
                    <div className="ml-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              passwordStrength.strength === 1 ? 'bg-red-500 w-1/3' :
                              passwordStrength.strength === 2 ? 'bg-yellow-500 w-2/3' :
                              passwordStrength.strength === 3 ? 'bg-green-500 w-full' : ''
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      {password.length < 8 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Must be at least 8 characters</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <IonItem 
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors w-full" 
                    lines="none"
                  >
                    <IonIcon icon={lockClosedOutline} slot="start" className="text-gray-400 dark:text-gray-500 text-xl" />
                    <IonLabel position="stacked" className="text-gray-700 dark:text-gray-300 font-medium">
                      Confirm Password
                    </IonLabel>
                    <IonInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                      placeholder="Re-enter your password"
                      required
                      minlength={8}
                      maxlength={100}
                      autocomplete="new-password"
                      className="w-full"
                    />
                    <IonButton
                      fill="clear"
                      slot="end"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 dark:text-gray-500"
                    >
                      <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} slot="icon-only" />
                    </IonButton>
                  </IonItem>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-red-500 ml-4">Passwords do not match</p>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <p className="text-xs text-green-500 ml-4 flex items-center gap-1">
                      <IonIcon icon={checkmarkCircleOutline} className="text-sm" />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Terms Checkbox - Full Width */}
                <div className="pt-2 lg:col-span-2">
                  <IonItem 
                    lines="none" 
                    className={`rounded-xl border-2 transition-colors ${
                      acceptedTerms 
                        ? 'border-primary-300 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <IonCheckbox
                      checked={acceptedTerms}
                      onIonChange={(e) => setAcceptedTerms(e.detail.checked)}
                      slot="start"
                    />
                    <IonLabel className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      I agree to the{' '}
                      <Link 
                        to="/terms" 
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
                      >
                        Terms of Service
                      </Link>
                    </IonLabel>
                  </IonItem>
                </div>

                {/* Submit Button - Full Width */}
                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    disabled={isLoading || !isFormValid()}
                    className="w-full text-white text-center uppercase border-none rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-150 ease-in-out hover:-translate-y-0.5 disabled:hover:translate-y-0 mt-6"
                    style={{
                      padding: '16px 0',
                      background: '#1d4ed8',
                      fontSize: '20px',
                      fontWeight: 700,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading && isFormValid()) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isLoading ? (
                      <>
                        <IonSpinner name="crescent" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={personAdd} className="text-xl" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sign In Link */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold transition-colors"
                  >
                    Sign in instead
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;


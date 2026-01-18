import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonIcon, IonSpinner } from '@ionic/react';
import { logIn, close, callOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [contactNumber, setContactNumber] = useState(''); // Only stores 10 digits
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const history = useHistory();
  const location = useLocation();

  // Get return URL from query params
  const getReturnUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('return') || '/';
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const returnUrl = getReturnUrl();
      history.replace(returnUrl);
    }
  }, [isAuthenticated, authLoading, history, location.search]);

  const handleContactNumberChange = (value: string) => {
    // Only allow digits and limit to 10 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setContactNumber(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Prepend +63 to the 10-digit number
      const fullContactNumber = `+63${contactNumber}`;
      await login({ contact_number: fullContactNumber, password });
      // Redirect to return URL or home
      const returnUrl = getReturnUrl();
      history.push(returnUrl);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
          <div className="max-w-md lg:max-w-lg w-full">
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
              <p className="text-gray-600 dark:text-gray-300 text-lg">Welcome back! Sign in to continue</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl  border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sign In</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Enter your credentials to access your account</p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-fade-in">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contact Number Field */}
                <div className="space-y-2">
                  <IonLabel className="text-gray-700 dark:text-gray-300 font-medium px-4">
                    Contact Number
                  </IonLabel>
                  <IonItem 
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors" 
                    lines="none"
                  >
                    <IonIcon icon={callOutline} slot="start" className="text-gray-400 dark:text-gray-500 text-xl" />
                    <div className="flex items-center w-full">
                      <span className="text-gray-700 dark:text-gray-300 font-medium mr-2">+63</span>
                      <IonInput
                        type="tel"
                        value={contactNumber}
                        onIonInput={(e) => handleContactNumberChange(e.detail.value!)}
                        placeholder="9123456789"
                        required
                        maxlength={10}
                        autocomplete="tel"
                        className="flex-1"
                      />
                    </div>
                  </IonItem>
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
                    Enter your 10-digit mobile number (e.g., 9123456789)
                  </p>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <IonItem 
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors" 
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
                      maxlength={100}
                      autocomplete="current-password"
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
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || contactNumber.length !== 10 || !password}
                  className="w-full text-white text-center uppercase border-none rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-150 ease-in-out hover:-translate-y-0.5 disabled:hover:translate-y-0 mt-6"
                  style={{
                    padding: '16px 0',
                    background: '#1d4ed8',
                    fontSize: '20px',
                    fontWeight: 700,
                  }}
                    onMouseEnter={(e) => {
                      if (!isLoading && contactNumber.length === 10 && password) {
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={logIn} className="text-xl" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold transition-colors"
                  >
                    Create one now
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

export default Login;

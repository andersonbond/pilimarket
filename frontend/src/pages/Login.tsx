import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonIcon, IonSpinner } from '@ionic/react';
import { logIn, close, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();
  const location = useLocation();

  // Get return URL from query params
  const getReturnUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('return') || '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
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
                  alt="Pilimarket" 
                  className="h-16 w-auto rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-5xl font-dm-sans font-extrabold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                Pilimarket
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
                {/* Email Field */}
                <div className="space-y-2">
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
                      required
                      maxlength={255}
                      autocomplete="email"
                    />
                  </IonItem>
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
                <IonButton
                  expand="block"
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="h-14 font-semibold text-lg button-primary rounded-xl  transition-all mt-6"
                >
                  {isLoading ? (
                    <>
                      <IonSpinner name="crescent" slot="start" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={logIn} slot="start" />
                      Sign In
                    </>
                  )}
                </IonButton>
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

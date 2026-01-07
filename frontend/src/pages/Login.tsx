import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { logIn, close } from 'ionicons/icons';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
          <div className="max-w-md w-full">
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <IonButton fill="clear" onClick={() => history.push('/')} className="text-gray-600 dark:text-gray-400">
                <IonIcon icon={close} />
              </IonButton>
            </div>

            {/* Logo/Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Pilimarket</h1>
              <p className="text-gray-600 dark:text-gray-400">Philippine Prediction Market</p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sign In</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <IonItem className="rounded-lg mb-2" lines="none">
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      onIonInput={(e) => setEmail(e.detail.value!)}
                      placeholder="Enter your email"
                      required
                      maxlength={255}
                      autocomplete="email"
                    />
                  </IonItem>
                </div>

                <div className="mb-6">
                  <IonItem className="rounded-lg mb-2" lines="none">
                    <IonLabel position="stacked">Password</IonLabel>
                    <IonInput
                      type="password"
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      placeholder="Enter your password"
                      required
                      maxlength={100}
                      autocomplete="current-password"
                    />
                  </IonItem>
                </div>

                <div className="mb-6 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={isLoading}
                  className="mb-4 h-12 font-semibold button-primary"
                >
                  <IonIcon icon={logIn} slot="start" />
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </IonButton>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign up
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

import React, { useState } from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar, IonIcon, IonModal, IonContent } from '@ionic/react';
import { person, statsChart, trophy, logOut, logIn, personAdd, moon, sunny, helpCircle, close, menu, add, wallet } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <IonHeader>
      <IonToolbar>
        {/* Mobile: Title and Menu */}
        <div slot="start" className="flex items-center md:hidden">
          <IonTitle onClick={() => history.push('/')} className="cursor-pointer flex-shrink-0 text-lg">
            Pilimarket
          </IonTitle>
        </div>

        {/* Desktop: Title and Search */}
        <div slot="start" className="hidden md:flex items-center">
          <IonTitle onClick={() => history.push('/')} className="cursor-pointer flex-shrink-0 mr-4">
            Pilimarket
          </IonTitle>
          <div className="flex">
            <IonSearchbar
              value={searchQuery}
              onIonInput={(e) => {
                setSearchQuery(e.detail.value!);
                // TODO: Implement search functionality
                if (e.detail.value?.trim()) {
                  history.push(`/markets?search=${encodeURIComponent(e.detail.value)}`);
                }
              }}
              onIonClear={() => setSearchQuery('')}
              placeholder="Search Pilimarket..."
              className="searchbar-custom searchbar-compact"
            />
          </div>
        </div>

        {/* Mobile: Right side buttons (How it Works, theme and menu) */}
        <IonButtons slot="end" className="md:hidden">
          <IonButton onClick={() => setIsHowItWorksOpen(true)} fill="clear" className="text-gray-700 dark:text-gray-300">
            <IonIcon icon={helpCircle} />
          </IonButton>
          <IonButton onClick={toggleTheme} fill="clear" className="theme-toggle">
            <IonIcon icon={isDark ? sunny : moon} />
          </IonButton>
          <IonButton onClick={() => setIsMobileMenuOpen(true)} fill="clear">
            <IonIcon icon={menu} />
          </IonButton>
        </IonButtons>

        {/* Desktop: All buttons */}
        <IonButtons slot="end" className="hidden md:flex">
          <IonButton onClick={() => setIsHowItWorksOpen(true)} fill="clear" className="text-gray-700 dark:text-gray-300">
            <IonIcon icon={helpCircle} slot="start" />
            <span>How it Works</span>
          </IonButton>
          <IonButton onClick={toggleTheme} fill="clear" className="theme-toggle">
            <IonIcon icon={isDark ? sunny : moon} />
          </IonButton>
          {isAuthenticated ? (
            <>
              <IonButton onClick={() => history.push('/purchase')} className="button-secondary">
                <IonIcon icon={wallet} slot="start" />
                <span className="hidden lg:inline">₱{user?.chips?.toLocaleString() || '0'}</span>
                <span className="lg:hidden">₱{user?.chips?.toLocaleString() || '0'}</span>
              </IonButton>
              <IonButton onClick={() => history.push('/profile')} className="button-primary">
                <IonIcon icon={person} slot="start" />
                <span className="hidden lg:inline">{user?.display_name || 'Profile'}</span>
              </IonButton>
              <IonButton onClick={() => history.push('/markets')} className="button-primary">
                <IonIcon icon={statsChart} slot="start" />
                <span className="hidden lg:inline">Markets</span>
              </IonButton>
              <IonButton onClick={() => history.push('/leaderboard')} className="button-primary">
                <IonIcon icon={trophy} slot="start" />
                <span className="hidden lg:inline">Leaderboard</span>
              </IonButton>
              {user?.is_admin && (
                <IonButton onClick={() => history.push('/admin/markets/create')} className="button-blue">
                  <IonIcon icon={add} slot="start" />
                  <span className="hidden lg:inline">Create Market</span>
                </IonButton>
              )}
              <IonButton onClick={logout} className="button-red">
                <IonIcon icon={logOut} slot="start" />
                <span className="hidden lg:inline">Logout</span>
              </IonButton>
            </>
          ) : (
            <>
              <IonButton onClick={() => history.push('/login')} className="button-primary">
                <IonIcon icon={logIn} slot="start" />
                <span className="hidden lg:inline">Log In</span>
              </IonButton>
              <IonButton onClick={() => history.push('/register')} className="button-secondary">
                <IonIcon icon={personAdd} slot="start" />
                <span className="hidden lg:inline">Sign Up</span>
              </IonButton>
            </>
          )}
        </IonButtons>
      </IonToolbar>

      {/* Mobile Search Bar - Below header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => {
            setSearchQuery(e.detail.value!);
            if (e.detail.value?.trim()) {
              history.push(`/markets?search=${encodeURIComponent(e.detail.value)}`);
            }
          }}
          onIonClear={() => setSearchQuery('')}
          placeholder="Search Pilimarket..."
          className="searchbar-custom"
        />
      </div>

      {/* Mobile Menu Modal */}
      <IonModal isOpen={isMobileMenuOpen} onDidDismiss={() => setIsMobileMenuOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Menu</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsMobileMenuOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="space-y-2">
            <IonButton
              expand="block"
              fill="clear"
              onClick={() => {
                setIsHowItWorksOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="justify-start text-left"
            >
              <IonIcon icon={helpCircle} slot="start" />
              How it Works
            </IonButton>
            {isAuthenticated ? (
              <>
                <IonButton
                  expand="block"
                  onClick={() => {
                    history.push('/purchase');
                    setIsMobileMenuOpen(false);
                  }}
                  className="button-secondary justify-start"
                >
                  <IonIcon icon={wallet} slot="start" />
                  Buy Chips (₱{user?.chips?.toLocaleString() || '0'})
                </IonButton>
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    history.push('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start text-left"
                >
                  <IonIcon icon={person} slot="start" />
                  Profile
                </IonButton>
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    history.push('/markets');
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start text-left"
                >
                  <IonIcon icon={statsChart} slot="start" />
                  Markets
                </IonButton>
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    history.push('/leaderboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start text-left"
                >
                  <IonIcon icon={trophy} slot="start" />
                  Leaderboard
                </IonButton>
                {user?.is_admin && (
                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => {
                      history.push('/admin/markets/create');
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-left"
                  >
                    <IonIcon icon={add} slot="start" />
                    Create Market
                  </IonButton>
                )}
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start text-left text-red-600 dark:text-red-400"
                >
                  <IonIcon icon={logOut} slot="start" />
                  Logout
                </IonButton>
              </>
            ) : (
              <>
                <IonButton
                  expand="block"
                  onClick={() => {
                    history.push('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="button-primary justify-start"
                >
                  <IonIcon icon={logIn} slot="start" />
                  Log In
                </IonButton>
                <IonButton
                  expand="block"
                  onClick={() => {
                    history.push('/register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="button-secondary justify-start"
                >
                  <IonIcon icon={personAdd} slot="start" />
                  Sign Up
                </IonButton>
              </>
            )}
          </div>
        </IonContent>
      </IonModal>

      {/* How it Works Modal */}
      <IonModal isOpen={isHowItWorksOpen} onDidDismiss={() => setIsHowItWorksOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>How It Works</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsHowItWorksOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Pilimarket</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Pilimarket is a Philippine prediction market platform where you can forecast events using virtual chips. 
                Test your prediction skills, compete with others, and climb the leaderboard!
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">1</span>
                Get Started
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Create an account and receive free virtual chips to start forecasting. These chips are non-redeemable 
                and used solely for prediction purposes.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">2</span>
                Browse Markets
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Explore various prediction markets across categories like Elections, Politics, Sports, Entertainment, 
                Economy, Weather, and more. Each market presents a question with Yes/No outcomes.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">3</span>
                Make Forecasts
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Use your chips to forecast outcomes. Allocate chips to "Yes" or "No" based on your prediction. 
                The percentage shown represents the current market consensus.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">4</span>
                Earn Reputation
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                When markets resolve, accurate forecasts earn you reputation points. Build your reputation to unlock 
                badges and climb the leaderboard rankings.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">5</span>
                Compete & Win
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Compete with other forecasters, earn badges for achievements, and see your name on the leaderboard. 
                The most accurate forecasters rise to the top!
              </p>
            </div>

            <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Important Notes</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Chips are virtual and non-redeemable - they cannot be converted to real money.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>This is a forecasting platform for entertainment and educational purposes.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Markets are resolved based on verifiable real-world outcomes.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Your reputation reflects your forecasting accuracy over time.</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <IonButton onClick={() => setIsHowItWorksOpen(false)} className="button-primary">
                Got it!
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonHeader>
  );
};

export default Header;


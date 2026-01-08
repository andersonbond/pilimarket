import React, { useState } from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar, IonIcon, IonModal, IonContent } from '@ionic/react';
import { person, statsChart, trophy, logOut, logIn, personAdd, moon, sunny, helpCircle, close, menu, add, wallet, settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from './NotificationBell';

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
        {/* Mobile: Logo/Title and Menu */}
        <div slot="start" className="flex items-center md:hidden">
          <div onClick={() => history.push('/')} className="cursor-pointer flex items-center gap-2">
            <img src="/logo.png" alt="Pilimarket" className="h-8 w-auto rounded ml-2" />
            <IonTitle className="flex-shrink-0 text-lg pl-0 font-dm-sans font-extrabold">Pilimarket</IonTitle>
          </div>
        </div>

        {/* Desktop: Logo/Title and Search */}
        <div slot="start" className="hidden md:flex items-center">
          <div onClick={() => history.push('/')} className="cursor-pointer flex items-center gap-2 mr-4">
            <img src="/logo.png" alt="Pilimarket" className="h-10 w-auto rounded ml-2" />
            <IonTitle className="flex-shrink-0 pl-0 font-dm-sans font-extrabold">Pilimarket</IonTitle>
          </div>
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

        {/* Mobile: Right side buttons (How it Works, theme, notifications and menu) */}
        <IonButtons slot="end" className="md:hidden">
          <IonButton onClick={() => setIsHowItWorksOpen(true)} fill="clear" className="text-gray-700 dark:text-gray-300 font-dm-sans">
            <IonIcon icon={helpCircle} />
          </IonButton>
          <IonButton onClick={toggleTheme} fill="clear" className="theme-toggle font-dm-sans">
            <IonIcon icon={isDark ? sunny : moon} />
          </IonButton>
          {isAuthenticated && <NotificationBell />}
          <IonButton onClick={() => setIsMobileMenuOpen(true)} fill="clear" className="font-dm-sans">
            <IonIcon icon={menu} />
          </IonButton>
        </IonButtons>

        {/* Desktop: All buttons */}
        <IonButtons slot="end" className="hidden md:flex">
          <IonButton onClick={() => setIsHowItWorksOpen(true)} fill="clear" className="text-gray-700 dark:text-gray-300 font-dm-sans">
            <IonIcon icon={helpCircle} slot="start" />
            <span>How it Works</span>
          </IonButton>
          <IonButton onClick={toggleTheme} fill="clear" className="theme-toggle font-dm-sans">
            <IonIcon icon={isDark ? sunny : moon} />
          </IonButton>
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <IonButton onClick={() => history.push('/purchase')} className="bg-primary-600 text-white rounded-md font-dm-sans">
                <IonIcon icon={wallet} slot="start" />
                <span className="hidden lg:inline">₱{user?.chips?.toLocaleString() || '0'}</span>
                <span className="lg:hidden">₱{user?.chips?.toLocaleString() || '0'}</span>
              </IonButton>
              <IonButton onClick={() => history.push('/profile')} className="button-primary font-dm-sans">
                <IonIcon icon={person} slot="start" />
                <span className="hidden lg:inline">{user?.display_name || 'Profile'}</span>
              </IonButton>
              <IonButton onClick={() => history.push('/markets')} className="button-primary font-dm-sans">
                <IonIcon icon={statsChart} slot="start" />
                <span className="hidden lg:inline">Markets</span>
              </IonButton>
              <IonButton onClick={() => history.push('/leaderboard')} className="button-primary font-dm-sans">
                <IonIcon icon={trophy} slot="start" />
                <span className="hidden lg:inline">Leaderboard</span>
              </IonButton>
              {user?.is_admin && (
                <IonButton onClick={() => history.push('/admin')} className="bg-gray-200 text-black rounded-md font-dm-sans">
                  <IonIcon icon={statsChart} slot="start" />
                  <span className="hidden lg:inline">Admin</span>
                </IonButton>
              )}
              {(user?.is_admin || user?.is_market_moderator) && (
                <>
                  <IonButton onClick={() => history.push('/admin/markets')} className="bg-gray-200 text-black rounded-md font-dm-sans">
                    <IonIcon icon={settingsOutline} slot="start" />
                    <span className="hidden lg:inline">Manage Markets</span>
                  </IonButton>
                  <IonButton onClick={() => history.push('/admin/markets/create')} className="bg-gray-200 text-black rounded-md font-dm-sans">
                    <IonIcon icon={add} slot="start" />
                    <span className="hidden lg:inline">Create Market</span>
                  </IonButton>
                </>
              )}
              <IonButton onClick={logout} className="bg-gray-100 text-black rounded-md font-dm-sans">
                <IonIcon icon={logOut} slot="start" />
                <span className="hidden lg:inline">Logout</span>
              </IonButton>
            </>
          ) : (
            <>
              <IonButton onClick={() => history.push('/login')} className="button-primary font-dm-sans">
                <IonIcon icon={logIn} slot="start" />
                <span className="hidden lg:inline">Log In</span>
              </IonButton>
              <IonButton onClick={() => history.push('/register')} className="bg-primary-600 text-white rounded-md font-dm-sans">
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
              <IonButton onClick={() => setIsMobileMenuOpen(false)} className="font-dm-sans">
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
              className="justify-start text-left font-dm-sans"
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
                  className="bg-primary-600 text-white rounded-md justify-start font-dm-sans"
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
                  className="justify-start text-left font-dm-sans"
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
                  className="justify-start text-left font-dm-sans"
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
                  className="justify-start text-left font-dm-sans"
                >
                  <IonIcon icon={trophy} slot="start" />
                  Leaderboard
                </IonButton>
                {user?.is_admin && (
                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => {
                      history.push('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-left font-dm-sans"
                  >
                    <IonIcon icon={statsChart} slot="start" />
                    Admin Panel
                  </IonButton>
                )}
                {(user?.is_admin || user?.is_market_moderator) && (
                  <>
                    <IonButton
                      expand="block"
                      fill="clear"
                      onClick={() => {
                        history.push('/admin/markets');
                        setIsMobileMenuOpen(false);
                      }}
                      className="justify-start text-left font-dm-sans"
                    >
                      <IonIcon icon={settingsOutline} slot="start" />
                      Manage Markets
                    </IonButton>
                    <IonButton
                      expand="block"
                      fill="clear"
                      onClick={() => {
                        history.push('/admin/markets/create');
                        setIsMobileMenuOpen(false);
                      }}
                      className="justify-start text-left font-dm-sans"
                    >
                      <IonIcon icon={add} slot="start" />
                      Create Market
                    </IonButton>
                  </>
                )}
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start text-left text-red-200 dark:text-red-400 font-dm-sans"
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
                  className="button-primary justify-start font-dm-sans"
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
                  className="button-secondary justify-start font-dm-sans"
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
              <IonButton onClick={() => setIsHowItWorksOpen(false)} className="font-dm-sans">
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
                Create an account to start forecasting. Purchase virtual chips (1 chip = ₱1.00 for reference) to participate in markets. 
                These chips are non-redeemable and used solely for prediction purposes.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">2</span>
                Browse Markets
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Explore various prediction markets across categories like Elections, Politics, Sports, Entertainment, 
                Economy, Weather, and more. Each market presents a question with Yes/No outcomes and has an end date.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">3</span>
                Make Forecasts
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Use your chips to forecast outcomes. Allocate chips to "Yes" or "No" based on your prediction. 
                The percentage shown represents the current market consensus. You can update your forecast (change outcome or amount) 
                before the market ends, but once placed, your chips are committed - you can only get them back if you win!
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">4</span>
                Win Chips & Earn Rewards
              </h3>
              <div className="text-gray-700 dark:text-gray-300 ml-11 space-y-2">
                <p>
                  When markets resolve, <strong className="text-primary">winning users receive chips as rewards!</strong>
                </p>
                <p>
                  <strong>How it works:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You get your original bet back</li>
                  <li>Plus a proportional share of chips from losing forecasts (90% of losing chips are distributed)</li>
                  <li>The more you bet, the larger your share of the rewards</li>
                </ul>
                <p className="mt-2 text-sm italic">
                  Example: If you bet 100 chips and win, you might receive 150-300 chips depending on how many others lost!
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">5</span>
                Build Reputation & Earn Badges
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Accurate forecasts earn you reputation points. Build your reputation to unlock badges (Newbie, Accurate, Veteran, etc.) 
                and maintain winning streaks. Your reputation reflects your forecasting accuracy over time.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold mr-3">6</span>
                Compete on Leaderboards
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-11">
                Compete with other forecasters and see your name on the leaderboard. Rankings are based on reputation, streaks, and activity. 
                Top forecasters may receive monthly certificates and recognition!
              </p>
            </div>

            <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Important Notes</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Chips are virtual and non-redeemable</strong> - they cannot be converted to real money. 1 chip = ₱1.00 is for reference only.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>This is a forecasting platform for entertainment and educational purposes.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Markets are resolved by admins based on verifiable real-world outcomes with evidence.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Winning forecasts earn you chips back plus a share of losing chips (90% distributed, 10% house edge).</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>You can view your forecast history, track your reputation, and see your rankings on leaderboards.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Top forecasters may receive monthly digital certificates and recognition.</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <IonButton onClick={() => setIsHowItWorksOpen(false)} className="button-primary font-dm-sans">
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


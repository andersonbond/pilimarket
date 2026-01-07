import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';
import AdminCreateMarket from './pages/AdminCreateMarket';
import AdminResolveMarket from './pages/AdminResolveMarket';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminMarketManagement from './pages/AdminMarketManagement';
import AdminPurchaseMonitoring from './pages/AdminPurchaseMonitoring';
import AdminFlaggedItems from './pages/AdminFlaggedItems';
import Purchase from './pages/Purchase';
import PurchaseHistory from './pages/PurchaseHistory';
import ForecastHistory from './pages/ForecastHistory';
import Notifications from './pages/Notifications';
import ActivityFeed from './pages/ActivityFeed';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FAQ from './pages/FAQ';
import Disclaimer from './pages/Disclaimer';

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/" component={Home} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/forgot-password" component={ForgotPassword} />
            <Route exact path="/reset-password/:token" component={ResetPassword} />
            <Route exact path="/leaderboard" component={Leaderboard} />
            <Route exact path="/markets" component={Markets} />
            <Route exact path="/markets/:id" component={MarketDetail} />
            <AdminProtectedRoute exact path="/admin" component={AdminDashboard} />
            <AdminProtectedRoute exact path="/admin/users" component={AdminUserManagement} />
            <AdminProtectedRoute exact path="/admin/markets" component={AdminMarketManagement} />
            <AdminProtectedRoute exact path="/admin/purchases" component={AdminPurchaseMonitoring} />
            <AdminProtectedRoute exact path="/admin/flagged" component={AdminFlaggedItems} />
            <AdminProtectedRoute exact path="/admin/markets/create" component={AdminCreateMarket} />
            <AdminProtectedRoute exact path="/admin/markets/:id/resolve" component={AdminResolveMarket} />
            <ProtectedRoute exact path="/purchase" component={Purchase} />
            <ProtectedRoute exact path="/purchase/history" component={PurchaseHistory} />
            <ProtectedRoute exact path="/forecasts" component={ForecastHistory} />
            <ProtectedRoute exact path="/notifications" component={Notifications} />
            <ProtectedRoute exact path="/activity" component={ActivityFeed} />
            <Route exact path="/terms" component={TermsOfService} />
            <Route exact path="/privacy" component={PrivacyPolicy} />
            <Route exact path="/faq" component={FAQ} />
            <Route exact path="/disclaimer" component={Disclaimer} />
            <ProtectedRoute exact path="/profile" component={Profile} />
            <Route render={() => <Redirect to="/" />} />
          </IonRouterOutlet>
        </IonReactRouter>
          </NotificationProvider>
      </AuthProvider>
      </ThemeProvider>
    </IonApp>
  );
};

export default App;


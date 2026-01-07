import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={{ pathname: '/login', state: { from: rest.location } }} />;
  }

  if (!user?.is_admin) {
    return <Redirect to={{ pathname: '/', state: { from: rest.location } }} />;
  }

  return <Route {...rest} render={(props) => <Component {...props} />} />;
};

export default AdminProtectedRoute;


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens, LoginCredentials, RegisterData } from '../types/user';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');

        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Verify token is still valid by fetching user profile
          try {
            const response = await api.get(`/api/v1/users/${userData.id}/profile`);
            if (response.data.success) {
              setUser(response.data.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
          } catch (error) {
            // Token invalid, clear storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Auto-refresh token failed:', error);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (token expires in 15)

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/api/v1/auth/login', credentials);
      
      if (response.data.success) {
        const { tokens, user: userData } = response.data.data;
        const { access_token, refresh_token } = tokens;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      } else {
        throw new Error(response.data.errors?.[0]?.message || 'Login failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.errors?.[0]?.message || error.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/api/v1/auth/register', data);
      
      if (response.data.success) {
        const { tokens, user: userData } = response.data.data;
        const { access_token, refresh_token } = tokens;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      } else {
        throw new Error(response.data.errors?.[0]?.message || 'Registration failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.errors?.[0]?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/v1/auth/refresh', {
        refresh_token: refreshToken,
      });

      if (response.data.success) {
        const { access_token } = response.data.data;
        localStorage.setItem('access_token', access_token);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      logout();
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


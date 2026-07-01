import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { unsubscribePushNotifications } from './usePushNotifications';

const AuthContext = createContext(undefined);
const AUTH_EXPIRED_EVENT = 'auth:expired';

const getAuthExpirationDate = (authData) => {
  if (!authData) {
    return null;
  }

  if (authData.expirationDate) {
    const expirationDate = new Date(authData.expirationDate);
    if (!Number.isNaN(expirationDate.getTime())) {
      return expirationDate;
    }
  }

  if (authData.token && authData.token.split('.').length === 3 && typeof window !== 'undefined') {
    try {
      const payload = authData.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      const decodedPayload = JSON.parse(window.atob(paddedPayload));

      if (typeof decodedPayload.exp === 'number') {
        const expirationDate = new Date(decodedPayload.exp * 1000);
        if (!Number.isNaN(expirationDate.getTime())) {
          return expirationDate;
        }
      }
    } catch (error) {
      console.error('Error parsing token expiration:', error);
    }
  }

  return null;
};

const isExpiredAuthData = (authData) => {
  const expirationDate = getAuthExpirationDate(authData);
  return expirationDate ? expirationDate.getTime() <= Date.now() : false;
};

const isUnauthorizedMessage = (message) => {
  if (!message) {
    return false;
  }

  const normalizedMessage = String(message).toLowerCase();
  return (
    normalizedMessage.includes('sesión expirada') ||
    normalizedMessage.includes('sesion expirada') ||
    normalizedMessage.includes('unauthorized') ||
    normalizedMessage.includes('401')
  );
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chefData, setChefData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al iniciar, verificar si hay token guardado
  const hydrateChefData = useCallback(async (authData) => {
    const chefId = authData?.chefId || authData?.clientId;
    if (!chefId) {
      return authData;
    }

    try {
      const chefResponse = await apiService.getChef(chefId);
      if (chefResponse.success && chefResponse.data) {
        return {
          ...chefResponse.data,
          chefId,
          token: authData.token,
          expirationDate: authData.expirationDate,
        };
      }

      if (isUnauthorizedMessage(chefResponse.errorMessage)) {
        return null;
      }
    } catch (error) {
      console.error('Error hydrating chef data:', error);
    }

    return authData;
  }, []);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('chef_data');

    setToken(null);
    setChefData(null);
    setIsAuthenticated(false);
    apiService.clearToken();
  }, []);

  const logout = useCallback(async () => {
    try {
      await unsubscribePushNotifications();
    } catch (error) {
      console.error('Error unsubscribing push notifications:', error);
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedChefData = localStorage.getItem('chef_data');
      
      if (storedToken && storedChefData) {
        const parsedChefData = JSON.parse(storedChefData);

        if (isExpiredAuthData({ ...parsedChefData, token: storedToken })) {
          clearAuthState();
          return;
        }

        apiService.setToken(storedToken);
        const hydratedChefData = parsedChefData?.firstName
          ? parsedChefData
          : await hydrateChefData({ ...parsedChefData, token: storedToken });

        if (!hydratedChefData) {
          clearAuthState();
          return;
        }

        setToken(storedToken);
        setChefData(hydratedChefData);
        setIsAuthenticated(true);

        localStorage.setItem('chef_data', JSON.stringify(hydratedChefData));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  }, [clearAuthState, hydrateChefData]);

  useEffect(() => {
    void loadStoredAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    const handleAuthExpired = () => {
      void logout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated || !chefData?.expirationDate) {
      return undefined;
    }

    const expirationDate = getAuthExpirationDate(chefData);
    if (!expirationDate) {
      return undefined;
    }

    const remainingTime = expirationDate.getTime() - Date.now();

    if (remainingTime <= 0) {
      void logout();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void logout();
    }, remainingTime);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [chefData, isAuthenticated, logout]);

  const login = async (username, password) => {
    try {
      const result = await apiService.loginChef(username, password);
      
      if (result.success && result.data) {
        const hydratedChefData = await hydrateChefData(result.data);

        // Guardar en localStorage
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('chef_data', JSON.stringify(hydratedChefData));
        
        setToken(result.data.token);
        setChefData(hydratedChefData);
        setIsAuthenticated(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogleToken = async (idToken) => {
    try {
      const result = await apiService.loginGoogleChef(idToken);

      if (result.success && result.data?.token) {
        const hydratedChefData = await hydrateChefData(result.data);

        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('chef_data', JSON.stringify(hydratedChefData));

        setToken(result.data.token);
        setChefData(hydratedChefData);
        setIsAuthenticated(true);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, chefData, token, login, loginWithGoogleToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};


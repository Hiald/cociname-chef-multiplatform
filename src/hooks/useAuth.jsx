import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chefData, setChefData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al iniciar, verificar si hay token guardado
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedChefData = localStorage.getItem('chef_data');
      
      if (storedToken && storedChefData) {
        setToken(storedToken);
        setChefData(JSON.parse(storedChefData));
        setIsAuthenticated(true);
        apiService.setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const result = await apiService.loginChef(username, password);
      
      if (result.success && result.data) {
        // Guardar en localStorage
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('chef_data', JSON.stringify(result.data));
        
        setToken(result.data.token);
        setChefData(result.data);
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
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('chef_data', JSON.stringify(result.data));

        setToken(result.data.token);
        setChefData(result.data);
        setIsAuthenticated(true);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('chef_data');
      
      setToken(null);
      setChefData(null);
      setIsAuthenticated(false);
      apiService.clearToken();
    } catch (error) {
      console.error('Logout error:', error);
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


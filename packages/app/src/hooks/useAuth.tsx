import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { LoginChefResponseDto } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  chefData: LoginChefResponseDto | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chefData, setChefData] = useState<LoginChefResponseDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Al iniciar, verificar si hay token guardado
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedChefData = await AsyncStorage.getItem('chef_data');
      
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await apiService.loginChef(username, password);
      
      if (result.success && result.data) {
        // Guardar en AsyncStorage
        await AsyncStorage.setItem('auth_token', result.data.token);
        await AsyncStorage.setItem('chef_data', JSON.stringify(result.data));
        
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

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('chef_data');
      
      setToken(null);
      setChefData(null);
      setIsAuthenticated(false);
      apiService.clearToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, chefData, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};


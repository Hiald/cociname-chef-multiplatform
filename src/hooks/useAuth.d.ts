import { ReactNode } from 'react';

export interface AuthContextValue {
  isAuthenticated: boolean;
  chefData: any;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

export function useAuth(): AuthContextValue;

export function AuthProvider(props: { children: ReactNode }): JSX.Element;

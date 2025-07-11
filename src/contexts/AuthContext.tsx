
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/sdk';
import sdk from '../lib/sdk-instance';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profile?: Partial<User>) => Promise<void>;
  logout: () => void;
  loading: boolean;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  needsOTP: boolean;
  otpEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOTP, setNeedsOTP] = useState(false);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      const currentUser = sdk.getCurrentUser(savedToken);
      if (currentUser) {
        setUser(currentUser);
        setToken(savedToken);
      } else {
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await sdk.login(email, password);
      
      if (typeof result === 'object' && result.otpRequired) {
        setNeedsOTP(true);
        setOtpEmail(email);
      } else {
        const authToken = result as string;
        const currentUser = sdk.getCurrentUser(authToken);
        
        if (currentUser) {
          setUser(currentUser);
          setToken(authToken);
          localStorage.setItem('authToken', authToken);
          setNeedsOTP(false);
          setOtpEmail(null);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, profile: Partial<User> = {}) => {
    setLoading(true);
    try {
      const newUser = await sdk.register(email, password, profile);
      
      // Auto-login after registration if no OTP required
      const authConfig = sdk.getAuthConfig();
      if (!authConfig?.otpTriggers?.includes('register')) {
        const authToken = sdk.createSession(newUser);
        setUser(newUser);
        setToken(authToken);
        localStorage.setItem('authToken', authToken);
      } else {
        setNeedsOTP(true);
        setOtpEmail(email);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    setLoading(true);
    try {
      sdk.verifyOTP(email, otp);
      
      // Get user and create session
      const users = await sdk.get<User>('users');
      const user = users.find(u => u.email === email);
      
      if (user) {
        const authToken = sdk.createSession(user);
        setUser(user);
        setToken(authToken);
        localStorage.setItem('authToken', authToken);
        setNeedsOTP(false);
        setOtpEmail(null);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (token) {
      sdk.destroySession(token);
    }
    setUser(null);
    setToken(null);
    setNeedsOTP(false);
    setOtpEmail(null);
    localStorage.removeItem('authToken');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    verifyOTP,
    needsOTP,
    otpEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

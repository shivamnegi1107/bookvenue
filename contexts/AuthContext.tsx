import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/api/authApi';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  profileImage?: string;
  isVenueOwner?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (formData: FormData) => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      
      console.log('Loading stored user:', { hasUser: !!storedUser, hasToken: !!storedToken });
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        console.log('Setting user from storage:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      // Clear corrupted data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      console.log('Login called with user data:', userData);
      setLoading(true);
      
      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update state immediately
      setUser(userData);
      console.log('User state updated:', userData);
      
      // Force a brief loading state to ensure UI updates
      setTimeout(() => {
        setLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error storing user data:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logout called');
      setLoading(true);
      
      // Clear storage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      
      // Clear state
      setUser(null);
      console.log('User logged out');
      
      // Force a brief loading state to ensure UI updates
      setTimeout(() => {
        setLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      setLoading(false);
      throw error;
    }
  };

  const updateUserProfile = async (formData: FormData) => {
    try {
      console.log('Updating user profile');
      const updatedUser = await authApi.updateProfile(formData);
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log('Profile updated successfully:', updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const userData = await authApi.getProfile();
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUserProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
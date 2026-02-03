import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../login';
import { useAuth } from '@/features/auth/AuthContext';
import { router } from 'expo-router';

// Mock the auth context
jest.mock('@/features/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  Link: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => children,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}));

// Mock theme
jest.mock('@/features/shared/styles/theme', () => ({
  theme: {
    colors: {
      primary: '#007AFF',
      text: { primary: '#000', secondary: '#666', tertiary: '#999' },
      input: { background: '#f5f5f5', placeholder: '#999' },
      border: '#ddd',
      error: '#ff0000',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    typography: {
      size: { sm: 12, md: 14, lg: 16, xxl: 28 },
      weight: { medium: '500', bold: '700', semibold: '600' },
      letterSpacing: { tight: -0.5 },
    },
    borderRadius: { sm: 8 },
  },
}));

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({ title, onPress, loading, disabled }: any) => {
    const { TouchableOpacity, Text, ActivityIndicator } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} testID="login-button">
        {loading ? <ActivityIndicator testID="loading-indicator" /> : <Text>{title}</Text>}
      </TouchableOpacity>
    );
  },
  Input: ({ label, value, onChangeText, placeholder, ...props }: any) => {
    const { View, Text, TextInput } = require('react-native');
    return (
      <View>
        {label && <Text>{label}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID={`input-${label?.toLowerCase() || 'unknown'}`}
          {...props}
        />
      </View>
    );
  },
  AuthLayout: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View testID="auth-layout">{children}</View>;
  },
}));

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      render(<LoginScreen />);

      expect(screen.getByText('Connexion')).toBeTruthy();
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Mot de passe')).toBeTruthy();
      expect(screen.getByText('CONNEXION')).toBeTruthy();
    });

    it('should render the register link', () => {
      render(<LoginScreen />);

      expect(screen.getByText('Pas encore de compte ?')).toBeTruthy();
      expect(screen.getByText("S'inscrire")).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show alert when email is empty', () => {
      render(<LoginScreen />);

      const passwordInput = screen.getByTestId('input-mot de passe');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show alert when password is empty', () => {
      render(<LoginScreen />);

      const emailInput = screen.getByTestId('input-email');
      fireEvent.changeText(emailInput, 'test@example.com');

      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show alert when both fields are empty', () => {
      render(<LoginScreen />);

      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs');
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Login Flow', () => {
    it('should call login with email and password', async () => {
      mockLogin.mockResolvedValue(undefined);

      render(<LoginScreen />);

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-mot de passe');
      const loginButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123!');
      });
    });

    it('should navigate to tabs on successful login', async () => {
      mockLogin.mockResolvedValue(undefined);

      render(<LoginScreen />);

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-mot de passe');
      const loginButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('should show alert on login failure', async () => {
      const error = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      mockLogin.mockRejectedValue(error);

      render(<LoginScreen />);

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-mot de passe');
      const loginButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur de connexion', 'Invalid credentials');
      });
    });

    it('should show default error message when no response message', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      render(<LoginScreen />);

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-mot de passe');
      const loginButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur de connexion',
          'Email ou mot de passe incorrect'
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should call login when credentials are provided', async () => {
      mockLogin.mockResolvedValue(undefined);

      render(<LoginScreen />);

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-mot de passe');
      const loginButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.press(loginButton);

      // Verify login was called with correct credentials
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123!');
      });
    });
  });
});

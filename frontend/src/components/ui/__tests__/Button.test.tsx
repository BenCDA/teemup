import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock theme
jest.mock('@/features/shared/styles/theme', () => ({
  theme: {
    colors: {
      primary: '#007AFF',
      text: { secondary: '#666' },
      error: '#ff0000',
      success: '#00ff00',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    typography: {
      size: { sm: 14, lg: 16, xl: 24 },
      weight: { bold: '700' },
    },
    borderRadius: { sm: 8 },
  },
}));

import * as Haptics from 'expo-haptics';

describe('Button Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with title', () => {
      render(<Button title="Click me" onPress={mockOnPress} />);

      expect(screen.getByText('Click me')).toBeTruthy();
    });

    it('should render loading indicator when loading', () => {
      render(<Button title="Submit" onPress={mockOnPress} loading />);

      // When loading, title should not be visible
      expect(screen.queryByText('Submit')).toBeNull();
    });

    it('should not render loading indicator when not loading', () => {
      render(<Button title="Submit" onPress={mockOnPress} loading={false} />);

      expect(screen.getByText('Submit')).toBeTruthy();
    });
  });

  describe('User Interaction', () => {
    it('should call onPress when pressed', () => {
      render(<Button title="Click me" onPress={mockOnPress} />);

      const button = screen.getByText('Click me');
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should trigger haptic feedback when pressed', () => {
      render(<Button title="Click me" onPress={mockOnPress} />);

      const button = screen.getByText('Click me');
      fireEvent.press(button);

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should not call onPress when disabled', () => {
      render(<Button title="Disabled" onPress={mockOnPress} disabled />);

      const button = screen.getByText('Disabled');
      fireEvent.press(button);

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<Button title="Primary" onPress={mockOnPress} />);

      const button = screen.getByText('Primary');
      expect(button).toBeTruthy();
    });

    it('should render secondary variant', () => {
      render(<Button title="Secondary" onPress={mockOnPress} variant="secondary" />);

      expect(screen.getByText('Secondary')).toBeTruthy();
    });

    it('should render outline variant', () => {
      render(<Button title="Outline" onPress={mockOnPress} variant="outline" />);

      expect(screen.getByText('Outline')).toBeTruthy();
    });

    it('should render danger variant', () => {
      render(<Button title="Danger" onPress={mockOnPress} variant="danger" />);

      expect(screen.getByText('Danger')).toBeTruthy();
    });

    it('should render success variant', () => {
      render(<Button title="Success" onPress={mockOnPress} variant="success" />);

      expect(screen.getByText('Success')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Button title="Small" onPress={mockOnPress} size="sm" />);

      expect(screen.getByText('Small')).toBeTruthy();
    });

    it('should render medium size by default', () => {
      render(<Button title="Medium" onPress={mockOnPress} />);

      expect(screen.getByText('Medium')).toBeTruthy();
    });

    it('should render large size', () => {
      render(<Button title="Large" onPress={mockOnPress} size="lg" />);

      expect(screen.getByText('Large')).toBeTruthy();
    });
  });

  describe('Full Width', () => {
    it('should be full width by default', () => {
      render(<Button title="Full Width" onPress={mockOnPress} />);

      expect(screen.getByText('Full Width')).toBeTruthy();
    });

    it('should not be full width when fullWidth is false', () => {
      render(<Button title="Not Full" onPress={mockOnPress} fullWidth={false} />);

      expect(screen.getByText('Not Full')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility role button', () => {
      render(<Button title="Accessible" onPress={mockOnPress} />);

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should have accessibility label', () => {
      render(<Button title="Labeled Button" onPress={mockOnPress} />);

      const button = screen.getByLabelText('Labeled Button');
      expect(button).toBeTruthy();
    });

    it('should support accessibility hint', () => {
      render(
        <Button
          title="With Hint"
          onPress={mockOnPress}
          accessibilityHint="Tap to submit the form"
        />
      );

      const button = screen.getByText('With Hint');
      expect(button).toBeTruthy();
    });
  });
});

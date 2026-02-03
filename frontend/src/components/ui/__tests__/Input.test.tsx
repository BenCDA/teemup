import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Input } from '../Input';

// Mock theme
jest.mock('@/features/shared/styles/theme', () => ({
  theme: {
    colors: {
      text: { primary: '#000', secondary: '#666' },
      input: { background: '#f5f5f5', placeholder: '#999' },
      border: '#ddd',
      error: '#ff0000',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    typography: {
      size: { sm: 12, md: 14, lg: 16 },
      weight: { medium: '500' },
    },
    borderRadius: { sm: 8 },
  },
}));

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render without label', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should render with label', () => {
      render(<Input label="Email" placeholder="Enter email" />);

      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter email')).toBeTruthy();
    });

    it('should render error message when provided', () => {
      render(<Input label="Email" error="Invalid email format" />);

      expect(screen.getByText('Invalid email format')).toBeTruthy();
    });

    it('should not render error when not provided', () => {
      render(<Input label="Email" />);

      expect(screen.queryByText('Invalid email format')).toBeNull();
    });
  });

  describe('User Interaction', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      render(<Input onChangeText={onChangeText} placeholder="Type here" />);

      const input = screen.getByPlaceholderText('Type here');
      fireEvent.changeText(input, 'Hello World');

      expect(onChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('should display the value prop', () => {
      render(<Input value="test@example.com" placeholder="Email" />);

      const input = screen.getByPlaceholderText('Email');
      expect(input.props.value).toBe('test@example.com');
    });

    it('should call onSubmitEditing when submitted', () => {
      const onSubmitEditing = jest.fn();
      render(<Input onSubmitEditing={onSubmitEditing} placeholder="Press enter" />);

      const input = screen.getByPlaceholderText('Press enter');
      fireEvent(input, 'submitEditing');

      expect(onSubmitEditing).toHaveBeenCalled();
    });
  });

  describe('Props forwarding', () => {
    it('should forward secureTextEntry prop', () => {
      render(<Input secureTextEntry placeholder="Password" />);

      const input = screen.getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should forward keyboardType prop', () => {
      render(<Input keyboardType="email-address" placeholder="Email" />);

      const input = screen.getByPlaceholderText('Email');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('should forward autoCapitalize prop', () => {
      render(<Input autoCapitalize="none" placeholder="Email" />);

      const input = screen.getByPlaceholderText('Email');
      expect(input.props.autoCapitalize).toBe('none');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with testID', () => {
      render(<Input testID="email-input" placeholder="Email" />);

      expect(screen.getByTestId('email-input')).toBeTruthy();
    });
  });
});

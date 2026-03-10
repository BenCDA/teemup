import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Avatar } from '../Avatar';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: Record<string, unknown>) => <View {...props}>{children}</View>,
  };
});

describe('Avatar Component', () => {
  it('should render with default props', () => {
    render(<Avatar />);
    expect(screen.getByLabelText('Photo de profil de ?')).toBeTruthy();
  });

  it('should show initials when no image', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('should show single initial for single name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('should show ? for empty name', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('should have accessibility label with name', () => {
    render(<Avatar name="Jane Smith" />);
    expect(screen.getByLabelText('Photo de profil de Jane Smith')).toBeTruthy();
  });

  it('should render image when uri is provided', () => {
    render(<Avatar uri="https://example.com/photo.jpg" name="John" />);
    expect(screen.getByLabelText('Photo de profil de John')).toBeTruthy();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Avatar size="sm" name="A" />);
    expect(screen.getByLabelText('Photo de profil de A')).toBeTruthy();

    rerender(<Avatar size="xl" name="B" />);
    expect(screen.getByLabelText('Photo de profil de B')).toBeTruthy();
  });
});

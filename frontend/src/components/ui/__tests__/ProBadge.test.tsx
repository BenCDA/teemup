import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProBadge } from '../ProBadge';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: Record<string, unknown>) => <View {...props}>{children}</View>,
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('ProBadge Component', () => {
  it('should render PRO text by default', () => {
    render(<ProBadge />);
    expect(screen.getByText('PRO')).toBeTruthy();
  });

  it('should hide text when showText is false', () => {
    render(<ProBadge showText={false} />);
    expect(screen.queryByText('PRO')).toBeNull();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<ProBadge size="sm" />);
    expect(screen.getByText('PRO')).toBeTruthy();

    rerender(<ProBadge size="lg" />);
    expect(screen.getByText('PRO')).toBeTruthy();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SportBadge } from '../SportBadge';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock sports config
jest.mock('@/constants/sports', () => ({
  getSportConfig: (sport: string) => {
    const configs: Record<string, { icon: string; color: string; label: string }> = {
      football: { icon: 'football', color: '#4CAF50', label: 'Football' },
      basketball: { icon: 'basketball', color: '#FF9800', label: 'Basketball' },
    };
    return configs[sport] || null;
  },
}));

describe('SportBadge Component', () => {
  it('should render known sport', () => {
    render(<SportBadge sport="football" />);
    // Component renders without crashing
    expect(true).toBe(true);
  });

  it('should render with showLabel', () => {
    render(<SportBadge sport="football" showLabel />);
    expect(screen.getByText('Football')).toBeTruthy();
  });

  it('should handle unknown sport gracefully', () => {
    render(<SportBadge sport="curling" showLabel />);
    expect(screen.getByText('curling')).toBeTruthy();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<SportBadge sport="basketball" size="sm" />);
    expect(true).toBe(true);

    rerender(<SportBadge sport="basketball" size="lg" />);
    expect(true).toBe(true);
  });
});

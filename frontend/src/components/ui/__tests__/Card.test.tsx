import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card Component', () => {
  it('should render children', () => {
    render(
      <Card>
        <Text>Card content</Text>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeTruthy();
  });

  it('should be touchable when onPress is provided', () => {
    const onPress = jest.fn();
    render(
      <Card onPress={onPress}>
        <Text>Touchable card</Text>
      </Card>
    );

    fireEvent.press(screen.getByText('Touchable card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should render as a View when no onPress', () => {
    render(
      <Card>
        <Text>Static card</Text>
      </Card>
    );
    expect(screen.getByText('Static card')).toBeTruthy();
  });

  it('should accept variant prop', () => {
    render(
      <Card variant="elevated">
        <Text>Elevated</Text>
      </Card>
    );
    expect(screen.getByText('Elevated')).toBeTruthy();
  });

  it('should render outlined variant', () => {
    render(
      <Card variant="outlined">
        <Text>Outlined</Text>
      </Card>
    );
    expect(screen.getByText('Outlined')).toBeTruthy();
  });
});

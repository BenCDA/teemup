import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

// Mock expo-haptics (used by Button inside EmptyState)
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('EmptyState Component', () => {
  it('should render title', () => {
    render(<EmptyState title="Aucun resultat" />);
    expect(screen.getByText('Aucun resultat')).toBeTruthy();
  });

  it('should render description when provided', () => {
    render(
      <EmptyState title="Vide" description="Il n'y a rien ici" />
    );
    expect(screen.getByText("Il n'y a rien ici")).toBeTruthy();
  });

  it('should not render description when not provided', () => {
    render(<EmptyState title="Vide" />);
    expect(screen.queryByText("Il n'y a rien ici")).toBeNull();
  });

  it('should render action button when both label and handler provided', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Vide"
        actionLabel="Ajouter"
        onAction={onAction}
      />
    );
    expect(screen.getByText('Ajouter')).toBeTruthy();
  });

  it('should call onAction when button pressed', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Vide"
        actionLabel="Recharger"
        onAction={onAction}
      />
    );

    fireEvent.press(screen.getByText('Recharger'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should not render button when only label is provided', () => {
    render(<EmptyState title="Vide" actionLabel="Ajouter" />);
    expect(screen.queryByText('Ajouter')).toBeNull();
  });
});

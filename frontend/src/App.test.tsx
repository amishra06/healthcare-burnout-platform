import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders healthcare burnout prevention platform', () => {
  render(<App />);
  const linkElement = screen.getByText(/Healthcare Burnout Prevention Platform/i);
  expect(linkElement).toBeInTheDocument();
});
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { FieldError, StatusMessage } from './StatusMessage';

describe('StatusMessage', () => {
  test('renders nothing when there is no message', () => {
    const { container } = render(<StatusMessage type="error">{null}</StatusMessage>);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders an error alert', () => {
    render(<StatusMessage type="error">Something failed</StatusMessage>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something failed');
    expect(alert).toHaveClass('message-error');
  });

  test('renders a success status', () => {
    render(<StatusMessage type="success">Saved</StatusMessage>);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved');
    expect(status).toHaveClass('message-success');
  });
});

describe('FieldError', () => {
  test('renders nothing without a message', () => {
    const { container } = render(<FieldError id="name-error" message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders a field-level alert', () => {
    render(<FieldError id="name-error" message="Name is required." />);
    const alert = document.getElementById('name-error');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('Name is required.');
  });
});

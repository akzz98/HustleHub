import { describe, expect, test } from 'vitest';
import { formatBookingStatus } from './bookingStatus';

describe('formatBookingStatus', () => {
  test('maps confirmed to the demo payment label', () => {
    expect(formatBookingStatus('confirmed')).toBe('Confirmed — demo payment recorded');
  });

  test('passes through other statuses', () => {
    expect(formatBookingStatus('pending')).toBe('pending');
  });
});

const { simulateBookingConfirmation } = require('../src/services/bookingConfirmation');

describe('simulateBookingConfirmation', () => {
  test('returns a confirmed simulated payment result', () => {
    const result = simulateBookingConfirmation();

    expect(result).toEqual({
      status: 'confirmed',
      paymentSimulated: true,
      message: 'Booking confirmed. Payment was simulated — no real charge was made.',
    });
  });
});

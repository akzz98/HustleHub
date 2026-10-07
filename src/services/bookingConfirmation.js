// Simulated payment confirmation — no payment gateway or card data.
// Part 2 requires a simulated confirmation only; real payments are out of scope.

function simulateBookingConfirmation() {
  return {
    status: 'confirmed',
    paymentSimulated: true,
    message: 'Booking confirmed. Payment was simulated — no real charge was made.',
  };
}

module.exports = {
  simulateBookingConfirmation,
};

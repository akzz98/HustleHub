function formatBookingStatus(status) {
  if (status === 'confirmed') {
    return 'Confirmed — demo payment recorded';
  }
  return status ? String(status) : 'Unknown';
}

export { formatBookingStatus };

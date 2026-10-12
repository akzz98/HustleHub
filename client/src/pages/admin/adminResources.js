import {
  getAdminBooking,
  getAdminGig,
  getAdminTransaction,
  getAdminUser,
  listAdminBookings,
  listAdminGigs,
  listAdminTransactions,
  listAdminUsers,
} from '../../api/http';
import { formatBookingStatus } from '../../utils/bookingStatus';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

const adminResources = {
  users: {
    key: 'users',
    title: 'Users',
    singular: 'User',
    listPath: '/admin/users',
    list: listAdminUsers,
    get: getAdminUser,
    emptyMessage: 'No users found.',
    listLabel: (item) => item.name || item.email || item.id,
    listHint: (item) => `${item.email} · ${item.role}`,
    detailFields: (item) => [
      { label: 'Name', value: item.name },
      { label: 'Email', value: item.email },
      { label: 'Role', value: item.role },
      { label: 'Id', value: item.id },
    ],
  },
  gigs: {
    key: 'gigs',
    title: 'Gigs',
    singular: 'Gig',
    listPath: '/admin/gigs',
    list: listAdminGigs,
    get: getAdminGig,
    emptyMessage: 'No gigs found.',
    listLabel: (item) => item.title || item.id,
    listHint: (item) => `${formatPrice(item.price)} · freelancer ${item.freelancerId}`,
    detailFields: (item) => [
      { label: 'Title', value: item.title },
      { label: 'Description', value: item.description },
      { label: 'Price', value: formatPrice(item.price) },
      { label: 'Freelancer id', value: item.freelancerId },
      { label: 'Id', value: item.id },
    ],
  },
  bookings: {
    key: 'bookings',
    title: 'Bookings',
    singular: 'Booking',
    listPath: '/admin/bookings',
    list: listAdminBookings,
    get: getAdminBooking,
    emptyMessage: 'No bookings found.',
    listLabel: (item) => `Booking ${item.id}`,
    listHint: (item) =>
      `${formatBookingStatus(item.status)} · gig ${item.gigId}`,
    detailFields: (item) => [
      { label: 'Status', value: formatBookingStatus(item.status) },
      { label: 'Gig id', value: item.gigId },
      { label: 'Client id', value: item.clientId },
      { label: 'Freelancer id', value: item.freelancerId },
      { label: 'Id', value: item.id },
    ],
  },
  transactions: {
    key: 'transactions',
    title: 'Transactions',
    singular: 'Transaction',
    listPath: '/admin/transactions',
    list: listAdminTransactions,
    get: getAdminTransaction,
    emptyMessage: 'No transactions found.',
    listLabel: (item) => `Transaction ${item.id}`,
    listHint: (item) =>
      `${formatPrice(item.amount)} · booking ${item.bookingId}`,
    detailFields: (item) => [
      { label: 'Amount', value: formatPrice(item.amount) },
      { label: 'Booking id', value: item.bookingId },
      { label: 'Client id', value: item.clientId },
      { label: 'Freelancer id', value: item.freelancerId },
      { label: 'Id', value: item.id },
    ],
  },
};

function getAdminResource(key) {
  return adminResources[key] || null;
}

export { adminResources, getAdminResource };

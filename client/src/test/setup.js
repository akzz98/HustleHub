import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { clearToken } from '../auth/tokenStorage';

afterEach(() => {
  cleanup();
  clearToken();
});

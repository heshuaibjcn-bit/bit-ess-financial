import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for components that use responsive design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage for zustand persist middleware
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

//mock URL.createObjectURL for PDF generation tests
if (typeof URL !== 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
}

/**
 * Jest Test Setup
 * Global configuration and utilities for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

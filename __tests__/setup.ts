/**
 * Jest Test Setup
 * Global configuration and utilities for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Enable automocking for node_modules
jest.mock('conf');

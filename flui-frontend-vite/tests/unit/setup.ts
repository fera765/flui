/**
 * FLUI - Test Setup
 * Configuração global para testes com Vitest
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock global de fetch se necessário
global.fetch = vi.fn();

// Mock de window.alert, confirm, etc
global.alert = vi.fn();
global.confirm = vi.fn(() => true);

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

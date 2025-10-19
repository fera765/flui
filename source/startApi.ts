#!/usr/bin/env node

/**
 * FLUI API Server Starter
 * Inicia apenas o servidor API sem o CLI
 */

import { startApiServer } from './services/apiServer.js';

console.log('🚀 Iniciando FLUI API Server...');

// Start the API server
startApiServer().catch((error) => {
  console.error('❌ Failed to start API server:', error);
  process.exit(1);
});

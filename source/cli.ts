#!/usr/bin/env node
/**
 * FLUI API - Backend Server
 * 
 * Entry point that starts the API server
 * All interactions are done via REST API
 */

import { startApiServer } from './services/apiServer.js';

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                            🚀 FLUI API SERVER 🚀                          ║
║                                                                            ║
║                     Backend API for Intelligent Automation                ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

// Start API server
startApiServer();

console.log('\n✅ API Server started successfully');
console.log('📡 API REST available at http://localhost:3001\n');

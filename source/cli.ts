#!/usr/bin/env node
/**
 * FLUI CLI - Backend API Server
 * 
 * CLI simplificada que apenas inicia o servidor API
 * Toda interação é feita via API REST (frontend ou HTTP clients)
 */

import { startApiServer } from './services/apiServer.js';

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                            🚀 FLUI API SERVER 🚀                          ║
║                                                                            ║
║                     Backend API para Automações Inteligentes              ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

// Iniciar servidor API
startApiServer();

console.log('\n✅ Use o frontend (http://localhost:5173) para interagir com o sistema');
console.log('📡 API REST disponível em http://localhost:3001\n');

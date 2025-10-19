#!/usr/bin/env node
import { startApiServer } from './dist/services/apiServer.js';
import { registerAllTools } from './dist/tools/index.js';
import { initializeMCPs } from './dist/services/mcpLoader.js';

console.log('🔧 Inicializando FLUI Tool Registry System...\n');

// Registrar todas as ferramentas built-in
console.log('📦 Registrando ferramentas built-in...');
registerAllTools();

// Carregar MCPs e registrar suas tools
console.log('\n🔌 Carregando MCPs...');
await initializeMCPs();

console.log('\n✅ Sistema de ferramentas inicializado!\n');

// Iniciar API server
startApiServer();

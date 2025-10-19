#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { StableApp } from './components/StableApp.js';
import { startApiServer } from './services/apiServer.js';
import { registerAllTools } from './tools/index.js';
import { initializeMCPs } from './services/mcpLoader.js';

// Limpar console múltiplas vezes para garantir
console.clear();
process.stdout.write('\x1Bc');
console.clear();

// ============= INICIALIZAR SISTEMA DE FERRAMENTAS =============
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

// Inicializar CLI
const { waitUntilExit } = render(<StableApp />, {
  patchConsole: false,
  exitOnCtrlC: true,
});

waitUntilExit().catch(() => {
  process.exit(0);
});

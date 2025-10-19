#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { StableApp } from './components/StableApp.js';
import { startApiServer } from './services/apiServer.js';
import { registerAllTools } from './tools/index.js';
import { initializeMCPs } from './services/mcpLoader.js';
import { createNode } from './commands/createNode.js';

// ============= PROCESSAR ARGUMENTOS DE LINHA DE COMANDO =============
const args = process.argv.slice(2);

// Verificar se é um comando especial
if (args.length > 0) {
  const command = args[0];
  
  if (command === '--create-node' || command === 'create-node') {
    const nodeName = args[1];
    
    if (!nodeName) {
      console.error('❌ Erro: Nome do node é obrigatório');
      console.log('\n📖 Uso: flui --create-node <nome-do-node>');
      console.log('   Exemplo: flui --create-node meu-node-customizado\n');
      process.exit(1);
    }
    
    // Executar criação do node
    try {
      await createNode({
        name: nodeName,
        displayName: nodeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: `Custom node: ${nodeName}`,
        category: 'custom',
        author: process.env.USER || 'Anonymous',
        license: 'MIT',
      });
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Erro ao criar node:', error.message);
      process.exit(1);
    }
  }
  
  if (command === '--help' || command === '-h') {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    FLUI - Sistema de Automação                ║
╚═══════════════════════════════════════════════════════════════╝

📖 Comandos Disponíveis:

  flui                         Iniciar o CLI interativo
  flui --create-node <nome>    Criar um novo custom node
  flui --help                  Mostrar esta ajuda

📝 Exemplos:

  # Iniciar FLUI
  flui

  # Criar um novo node customizado
  flui --create-node email-sender

  # Criar node com nome composto
  flui --create-node api-integration

🔗 Documentação: https://github.com/flui/flui
    `);
    process.exit(0);
  }
  
  // Se chegou aqui, é um comando desconhecido
  console.error(`❌ Comando desconhecido: ${command}`);
  console.log('💡 Use "flui --help" para ver os comandos disponíveis\n');
  process.exit(1);
}

// ============= MODO CLI INTERATIVO =============

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

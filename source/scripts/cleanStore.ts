#!/usr/bin/env node
/**
 * Script para limpar completamente o store do FLUI
 * Remove: Agentes, MCPs, Automações
 */

import { clearAllAgents, clearAllMCPs } from '../store/storage.js';
import { getAutomations } from '../store/automationStorage.js';
import Conf from 'conf';

console.log('\n🧹 INICIANDO LIMPEZA COMPLETA DO STORE...\n');

// Limpar agentes
clearAllAgents();

// Limpar MCPs
clearAllMCPs();

// Limpar automações
const config = new Conf({ projectName: 'flui' });
const automations = getAutomations();
console.log(`🗑️  Limpando ${automations.length} automações...`);
config.set('automations', []);
console.log('✅ Todas as automações removidas');

// Mostrar resultado
console.log('\n' + '='.repeat(60));
console.log('✅ LIMPEZA COMPLETA FINALIZADA!');
console.log('='.repeat(60));
console.log(`
Removidos:
  - Agentes: ${0}
  - MCPs: ${0}
  - Automações: ${0}
  
O store está completamente limpo e pronto para uso.
`);

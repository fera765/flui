#!/usr/bin/env node

/**
 * Debug MCP Data Structure
 * Verifica como os dados dos MCPs estão estruturados
 */

import { useStore } from './dist/store/store.js';

async function debugMCPData() {
  console.log('🔍 Debugando estrutura de dados dos MCPs\n');
  
  // Inicializar store
  const store = useStore.getState();
  store.initialize();
  
  // Carregar MCPs
  store.loadMCPs();
  const mcps = store.mcps;
  
  console.log(`📦 Total de MCPs: ${mcps.length}\n`);
  
  mcps.forEach((mcp, index) => {
    console.log(`\n🔧 MCP ${index + 1}: ${mcp.name}`);
    console.log(`   ID: ${mcp.id}`);
    console.log(`   Tipo: ${mcp.installType}`);
    console.log(`   Tools: ${mcp.tools?.length || 0}`);
    
    if (mcp.tools && mcp.tools.length > 0) {
      const firstTool = mcp.tools[0];
      console.log(`\n   📋 Primeira Tool: ${firstTool.name}`);
      console.log(`   ID: ${firstTool.id}`);
      console.log(`   Handler: ${firstTool.handler}`);
      
      // Verificar estrutura de parâmetros
      console.log(`   📊 Estrutura de parâmetros:`);
      console.log(`   - parameters: ${JSON.stringify(firstTool.parameters, null, 2)}`);
      
      // Verificar se tem inputSchema (formato JSON-RPC)
      if (firstTool.inputSchema) {
        console.log(`   - inputSchema: ${JSON.stringify(firstTool.inputSchema, null, 2)}`);
      } else {
        console.log(`   - inputSchema: NÃO EXISTE`);
      }
      
      // Verificar se tem properties dentro de inputSchema
      if (firstTool.inputSchema?.properties) {
        console.log(`   - inputSchema.properties: ${JSON.stringify(firstTool.inputSchema.properties, null, 2)}`);
      } else {
        console.log(`   - inputSchema.properties: NÃO EXISTE`);
      }
    }
  });
  
  // Verificar se há MCPs com tools vazias
  const emptyMcps = mcps.filter(mcp => !mcp.tools || mcp.tools.length === 0);
  if (emptyMcps.length > 0) {
    console.log(`\n⚠️  MCPs sem tools: ${emptyMcps.length}`);
    emptyMcps.forEach(mcp => {
      console.log(`   - ${mcp.name} (${mcp.installType})`);
    });
  }
  
  // Verificar se há tools com parâmetros vazios
  const toolsWithoutParams = mcps.flatMap(mcp => 
    (mcp.tools || []).filter(tool => 
      !tool.parameters || Object.keys(tool.parameters).length === 0
    )
  );
  
  if (toolsWithoutParams.length > 0) {
    console.log(`\n⚠️  Tools sem parâmetros: ${toolsWithoutParams.length}`);
    toolsWithoutParams.forEach(tool => {
      console.log(`   - ${tool.name} (parâmetros: ${JSON.stringify(tool.parameters)})`);
    });
  }
  
  console.log('\n✅ Debug concluído');
}

debugMCPData().catch(console.error);
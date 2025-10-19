import { useStore } from '../store/store.js';
import { getDefaultAgents, getDefaultMCPs } from '../services/defaultData.js';
import { getDefaultAutomations } from '../services/defaultAutomations.js';
import { saveAutomation } from '../store/automationStorage.js';

export const initializeDefaults = (): void => {
  const store = useStore.getState();

  // Adicionar agentes padrão se não houver nenhum
  if (store.agents.length === 0) {
    const defaultAgents = getDefaultAgents();
    defaultAgents.forEach((agent) => {
      store.createAgent(agent);
    });
  }

  // Adicionar MCPs padrão se não houver nenhum
  if (store.mcps.length === 0) {
    const defaultMCPs = getDefaultMCPs();
    defaultMCPs.forEach((mcp) => {
      store.createMCP(mcp);
    });
  }

  // Adicionar automações de demonstração
  const { getAutomations } = require('../store/automationStorage.js');
  if (getAutomations().length === 0) {
    const defaultAutomations = getDefaultAutomations();
    defaultAutomations.forEach((automation) => {
      saveAutomation(automation);
    });
  }

  // Adicionar mensagem de boas-vindas
  if (store.messages.length === 0) {
    store.addMessage({
      role: 'system',
      content: `⚡ Bem-vindo ao Flui!

Sistema CLI revolucionário de automação com agentes inteligentes.

🚀 Primeiros passos:
1. Configure seu LLM com /settings
2. Selecione o modelo com /models
3. Escolha um tema com /theme
4. Explore os agentes com /agents
5. Veja os MCPs disponíveis com /mcps
6. Execute automações com /automations
7. Digite /help para ver todos os comandos

💡 Use @ para mencionar agentes e / para comandos.

Comece digitando sua primeira mensagem abaixo!`,
      status: 'completed',
    });
  }
};

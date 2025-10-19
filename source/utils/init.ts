import { useStore } from '../store/store.js';
import { getDefaultAgents, getDefaultMCPs } from '../services/defaultData.js';

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

  // Adicionar mensagem de boas-vindas
  if (store.messages.length === 0) {
    store.addMessage({
      role: 'system',
      content: `⚡ Bem-vindo ao Flui!

Sistema CLI revolucionário de automação com agentes inteligentes.

🚀 Primeiros passos:
1. Configure seu LLM com /settings
2. Explore os agentes com /agents
3. Veja os MCPs disponíveis com /mcps
4. Mude o tema com /theme <nome>
5. Digite /help para ver todos os comandos

💡 Use @ para mencionar agentes e / para comandos.

Comece digitando sua primeira mensagem abaixo!`,
      status: 'completed',
    });
  }
};

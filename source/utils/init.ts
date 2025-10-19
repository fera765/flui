import { useStore } from '../store/store.js';
import { getDefaultAgents, getDefaultMCPs } from '../services/defaultData.js';
import { getDefaultAutomations } from '../services/defaultAutomations.js';
import { saveAutomation, getAutomations } from '../store/automationStorage.js';

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
  if (getAutomations().length === 0) {
    const defaultAutomations = getDefaultAutomations();
    defaultAutomations.forEach((automation) => {
      saveAutomation(automation);
    });
  }
};

import Conf from 'conf';
import { Automation, AutomationExecution } from '../types/automation.js';

const config = new Conf({
  projectName: 'flui',
});

// ============= AUTOMATIONS =============
export const getAutomations = (): Automation[] => {
  return (config.get('automations') as Automation[]) || [];
};

export const getAutomation = (id: string): Automation | null => {
  const automations = getAutomations();
  return automations.find((a) => a.id === id) || null;
};

export const saveAutomation = (automation: Automation): void => {
  const automations = getAutomations();
  const index = automations.findIndex((a) => a.id === automation.id);
  if (index >= 0) {
    automations[index] = automation;
  } else {
    automations.push(automation);
  }
  config.set('automations', automations);
};

export const deleteAutomation = (id: string): void => {
  const automations = getAutomations();
  config.set(
    'automations',
    automations.filter((a) => a.id !== id)
  );
};

// ============= EXECUTIONS =============
export const getExecutions = (): AutomationExecution[] => {
  return (config.get('executions') as AutomationExecution[]) || [];
};

export const getExecution = (id: string): AutomationExecution | null => {
  const executions = getExecutions();
  return executions.find((e) => e.id === id) || null;
};

export const saveExecution = (execution: AutomationExecution): void => {
  const executions = getExecutions();
  const index = executions.findIndex((e) => e.id === execution.id);
  if (index >= 0) {
    executions[index] = execution;
  } else {
    executions.push(execution);
  }
  // Manter apenas últimas 100 execuções
  if (executions.length > 100) {
    executions.splice(0, executions.length - 100);
  }
  config.set('executions', executions);
};

export const getExecutionsByAutomation = (automationId: string): AutomationExecution[] => {
  const executions = getExecutions();
  return executions.filter((e) => e.automationId === automationId);
};

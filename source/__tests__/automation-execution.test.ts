/**
 * Testes de execução de automações
 * 
 * Valida o processamento correto de automações complexas
 */

import { describe, it, expect } from 'vitest';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

describe('Execução de Automações', () => {
  
  describe('Automação simples (1 node)', () => {
    it('deve executar Manual Trigger corretamente', async () => {
      // Criar automação
      const automation = {
        name: 'Simple Manual Trigger',
        nodes: [
          {
            id: 'node-1',
            type: 'manual-trigger',
            position: { x: 0, y: 0 },
            data: {
              label: 'Manual Trigger',
              toolId: 'manual-trigger',
              config: {
                triggerMessage: 'Hello World',
                initialData: { test: true },
              },
            },
          },
        ],
        edges: [],
      };
      
      const createResponse = await axios.post(`${API_URL}/api/automations`, automation);
      const automationId = createResponse.data.id;
      
      // Executar
      const execResponse = await axios.post(
        `${API_URL}/api/automations/${automationId}/execute`
      );
      
      expect(execResponse.status).toBe(200);
      expect(execResponse.data.status).toBe('completed');
      expect(execResponse.data.nodeResults).toBeDefined();
      
      // Limpar
      await axios.delete(`${API_URL}/api/automations/${automationId}`);
    });
  });
  
  describe('Automação com 2 nodes (encadeamento)', () => {
    it('deve executar nodes em sequência', async () => {
      const automation = {
        name: 'Chained Automation',
        nodes: [
          {
            id: 'node-1',
            type: 'manual-trigger',
            position: { x: 0, y: 0 },
            data: {
              label: 'Trigger',
              toolId: 'manual-trigger',
              config: {
                initialData: { message: 'Start' },
              },
            },
          },
          {
            id: 'node-2',
            type: 'manual-trigger',
            position: { x: 200, y: 0 },
            data: {
              label: 'Second Node',
              toolId: 'manual-trigger',
              config: {
                triggerMessage: '{{node-1.triggerMessage}}',
              },
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
          },
        ],
      };
      
      const createResponse = await axios.post(`${API_URL}/api/automations`, automation);
      const automationId = createResponse.data.id;
      
      // Executar
      const execResponse = await axios.post(
        `${API_URL}/api/automations/${automationId}/execute`
      );
      
      expect(execResponse.status).toBe(200);
      expect(execResponse.data.status).toBe('completed');
      expect(Object.keys(execResponse.data.nodeResults || {})).toHaveLength(2);
      
      // Limpar
      await axios.delete(`${API_URL}/api/automations/${automationId}`);
    });
  });
  
  describe('Validação de dados', () => {
    it('deve rejeitar automação sem nodes', async () => {
      const automation = {
        name: 'Invalid Automation',
        nodes: [],
        edges: [],
      };
      
      try {
        await axios.post(`${API_URL}/api/automations`, automation);
        expect.fail('Deveria ter rejeitado automação sem nodes');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
    
    it('deve rejeitar automação com node inválido', async () => {
      const automation = {
        name: 'Invalid Node',
        nodes: [
          {
            id: 'node-1',
            type: 'ferramenta-inexistente',
            position: { x: 0, y: 0 },
            data: { label: 'Invalid' },
          },
        ],
        edges: [],
      };
      
      const createResponse = await axios.post(`${API_URL}/api/automations`, automation);
      const automationId = createResponse.data.id;
      
      try {
        await axios.post(`${API_URL}/api/automations/${automationId}/execute`);
        expect.fail('Deveria ter falhado na execução');
      } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400);
      }
      
      // Limpar
      await axios.delete(`${API_URL}/api/automations/${automationId}`);
    });
  });
  
  describe('Resolução de referências', () => {
    it('deve resolver {{nodeId.key}} corretamente', async () => {
      const automation = {
        name: 'Reference Resolution',
        nodes: [
          {
            id: 'node-source',
            type: 'manual-trigger',
            position: { x: 0, y: 0 },
            data: {
              label: 'Source',
              toolId: 'manual-trigger',
              config: {
                triggerMessage: 'Original Message',
              },
            },
          },
          {
            id: 'node-target',
            type: 'manual-trigger',
            position: { x: 200, y: 0 },
            data: {
              label: 'Target',
              toolId: 'manual-trigger',
              config: {
                triggerMessage: '{{node-source.triggerMessage}}',
              },
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-source',
            target: 'node-target',
          },
        ],
      };
      
      const createResponse = await axios.post(`${API_URL}/api/automations`, automation);
      const automationId = createResponse.data.id;
      
      // Executar
      const execResponse = await axios.post(
        `${API_URL}/api/automations/${automationId}/execute`
      );
      
      expect(execResponse.status).toBe(200);
      
      // Verificar que a referência foi resolvida
      const targetResult = execResponse.data.nodeResults?.['node-target'];
      expect(targetResult).toBeDefined();
      
      // Limpar
      await axios.delete(`${API_URL}/api/automations/${automationId}`);
    });
  });
  
});

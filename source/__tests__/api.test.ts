/**
 * Testes completos da API Backend
 * 
 * Valida todas as rotas e funcionalidades
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

const API_URL = 'http://localhost:3001';
let testAutomationId: string;

// Helper para aguardar API estar pronta
async function waitForApi(maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${API_URL}/api/tools`);
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

describe('FLUI Backend API - Testes Completos', () => {
  
  beforeAll(async () => {
    const apiReady = await waitForApi();
    if (!apiReady) {
      throw new Error('API não iniciou no tempo esperado');
    }
  });
  
  // ============= TOOLS =============
  
  describe('GET /api/tools', () => {
    it('deve retornar lista de ferramentas', async () => {
      const response = await axios.get(`${API_URL}/api/tools`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThanOrEqual(3); // 3 triggers
    });
    
    it('deve retornar triggers válidos', async () => {
      const response = await axios.get(`${API_URL}/api/tools`);
      const tools = response.data;
      
      const triggerIds = tools.map((t: any) => t.id);
      expect(triggerIds).toContain('manual-trigger');
      expect(triggerIds).toContain('cron-trigger');
      expect(triggerIds).toContain('webhook-trigger');
    });
  });
  
  describe('GET /api/tools/:toolId', () => {
    it('deve retornar detalhes de uma ferramenta', async () => {
      const response = await axios.get(`${API_URL}/api/tools/manual-trigger`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe('manual-trigger');
      expect(response.data.name).toBe('Manual Trigger');
      expect(Array.isArray(response.data.params)).toBe(true);
    });
    
    it('deve retornar 404 para ferramenta inexistente', async () => {
      try {
        await axios.get(`${API_URL}/api/tools/nao-existe`);
        expect.fail('Deveria ter lançado erro 404');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });
  });
  
  // ============= AGENTS =============
  
  describe('GET /api/agents', () => {
    it('deve retornar array vazio (store limpo)', async () => {
      const response = await axios.get(`${API_URL}/api/agents`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0); // Limpo no startup
    });
  });
  
  // ============= MCPs =============
  
  describe('GET /api/mcps', () => {
    it('deve retornar array vazio (store limpo)', async () => {
      const response = await axios.get(`${API_URL}/api/mcps`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0); // Limpo no startup
    });
  });
  
  // ============= AUTOMATIONS =============
  
  describe('POST /api/automations', () => {
    it('deve criar uma nova automação', async () => {
      const automation = {
        name: 'Test Automation',
        description: 'Automação de teste',
        nodes: [
          {
            id: 'node-1',
            type: 'manual-trigger',
            position: { x: 0, y: 0 },
            data: {
              label: 'Manual Trigger',
              toolId: 'manual-trigger',
              config: {
                triggerMessage: 'Test',
              },
            },
          },
        ],
        edges: [],
      };
      
      const response = await axios.post(`${API_URL}/api/automations`, automation);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBeDefined();
      expect(response.data.name).toBe('Test Automation');
      
      testAutomationId = response.data.id; // Salvar para próximos testes
    });
  });
  
  describe('GET /api/automations', () => {
    it('deve retornar lista de automações', async () => {
      const response = await axios.get(`${API_URL}/api/automations`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('GET /api/automations/:id', () => {
    it('deve retornar uma automação específica', async () => {
      const response = await axios.get(`${API_URL}/api/automations/${testAutomationId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testAutomationId);
      expect(response.data.name).toBe('Test Automation');
    });
    
    it('deve retornar 404 para automação inexistente', async () => {
      try {
        await axios.get(`${API_URL}/api/automations/id-invalido`);
        expect.fail('Deveria ter lançado erro 404');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });
  });
  
  describe('PUT /api/automations/:id', () => {
    it('deve atualizar uma automação', async () => {
      const updates = {
        name: 'Test Automation Updated',
        description: 'Descrição atualizada',
      };
      
      const response = await axios.put(
        `${API_URL}/api/automations/${testAutomationId}`,
        updates
      );
      
      expect(response.status).toBe(200);
      expect(response.data.name).toBe('Test Automation Updated');
    });
  });
  
  describe('POST /api/automations/:id/execute', () => {
    it('deve executar uma automação', async () => {
      const response = await axios.post(
        `${API_URL}/api/automations/${testAutomationId}/execute`
      );
      
      expect(response.status).toBe(200);
      expect(response.data.executionId).toBeDefined();
      expect(response.data.status).toBeDefined();
    });
  });
  
  describe('DELETE /api/automations/:id', () => {
    it('deve deletar uma automação', async () => {
      const response = await axios.delete(
        `${API_URL}/api/automations/${testAutomationId}`
      );
      
      expect(response.status).toBe(200);
      
      // Verificar que foi deletada
      try {
        await axios.get(`${API_URL}/api/automations/${testAutomationId}`);
        expect.fail('Automação deveria ter sido deletada');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });
  });
  
  // ============= HEALTH CHECK =============
  
  describe('GET /', () => {
    it('deve retornar status da API', async () => {
      const response = await axios.get(`${API_URL}/`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
      expect(response.data.service).toBe('FLUI API');
    });
  });
  
});

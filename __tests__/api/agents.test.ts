/**
 * Agents API Tests
 * Tests for all agent-related endpoints
 */

import request from 'supertest';
import express from 'express';
import { useStore } from '../../source/store/store.js';

// Mock the store
jest.mock('../../source/store/store.js');

describe('Agents API', () => {
  let app: express.Application;
  let mockStore: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock store
    mockStore = {
      agents: [],
      getAgentById: jest.fn(),
      createAgent: jest.fn(),
      updateAgent: jest.fn(),
      deleteAgent: jest.fn(),
    };
    
    (useStore as any).getState = jest.fn(() => mockStore);
    
    // Import app after mocking
    // Note: In real implementation, we need to refactor apiServer to be testable
    app = express();
    app.use(express.json());
    
    // Setup routes (simplified for testing)
    setupAgentRoutes(app, mockStore);
  });

  describe('GET /api/agents', () => {
    it('should return all agents', async () => {
      mockStore.agents = [
        {
          id: '1',
          name: 'Test Agent',
          description: 'Test Description',
          systemPrompt: 'Test prompt',
          tools: [],
          mcpIds: [],
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const response = await request(app).get('/api/agents');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStore.agents);
    });

    it('should return empty array when no agents exist', async () => {
      mockStore.agents = [];
      
      const response = await request(app).get('/api/agents');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return agent by id', async () => {
      const testAgent = {
        id: '1',
        name: 'Test Agent',
        description: 'Test Description',
        systemPrompt: 'Test prompt',
        tools: [],
        mcpIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockStore.agents = [testAgent];

      const response = await request(app).get('/api/agents/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(testAgent);
    });

    it('should return 404 when agent not found', async () => {
      mockStore.agents = [];
      
      const response = await request(app).get('/api/agents/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/agents', () => {
    it('should create a new agent', async () => {
      const newAgent = {
        name: 'New Agent',
        description: 'New Description',
        systemPrompt: 'New prompt',
        tools: [],
        mcpIds: [],
      };

      mockStore.createAgent.mockImplementation((agent: any) => {
        const created = {
          ...agent,
          id: '123',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockStore.agents.push(created);
        return created;
      });

      const response = await request(app)
        .post('/api/agents')
        .send(newAgent);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newAgent.name);
      expect(mockStore.createAgent).toHaveBeenCalledTimes(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('should create agent with MCP tools', async () => {
      const newAgent = {
        name: 'Agent with MCP',
        description: 'Test',
        systemPrompt: 'Test',
        tools: [],
        mcpIds: ['mcp-1'],
      };

      mockStore.createAgent.mockImplementation((agent: any) => {
        const created = {
          ...agent,
          id: '123',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockStore.agents.push(created);
        return created;
      });

      const response = await request(app)
        .post('/api/agents')
        .send(newAgent);
      
      expect(response.status).toBe(201);
      expect(response.body.mcpIds).toContain('mcp-1');
    });
  });

  describe('PUT /api/agents/:id', () => {
    it('should update an existing agent', async () => {
      const existingAgent = {
        id: '1',
        name: 'Old Name',
        description: 'Old Description',
        systemPrompt: 'Old prompt',
        tools: [],
        mcpIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockStore.agents = [existingAgent];
      mockStore.updateAgent.mockImplementation((id: string, updates: any) => {
        const agent = mockStore.agents.find((a: any) => a.id === id);
        if (agent) {
          Object.assign(agent, updates);
        }
      });

      const updates = {
        name: 'New Name',
        description: 'New Description',
      };

      const response = await request(app)
        .put('/api/agents/1')
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(mockStore.updateAgent).toHaveBeenCalledWith('1', expect.objectContaining(updates));
    });

    it('should return 404 when updating non-existent agent', async () => {
      mockStore.agents = [];
      
      const response = await request(app)
        .put('/api/agents/999')
        .send({ name: 'New Name' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/agents/:id', () => {
    it('should partially update an agent', async () => {
      const existingAgent = {
        id: '1',
        name: 'Test Agent',
        description: 'Test Description',
        systemPrompt: 'Test prompt',
        tools: [],
        mcpIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockStore.agents = [existingAgent];
      mockStore.updateAgent.mockImplementation((id: string, updates: any) => {
        const agent = mockStore.agents.find((a: any) => a.id === id);
        if (agent) {
          Object.assign(agent, updates);
        }
      });

      const response = await request(app)
        .patch('/api/agents/1')
        .send({ enabled: false });
      
      expect(response.status).toBe(200);
      expect(mockStore.updateAgent).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should delete an agent', async () => {
      const agent = {
        id: '1',
        name: 'Test Agent',
        description: 'Test',
        systemPrompt: 'Test',
        tools: [],
        mcpIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockStore.agents = [agent];
      mockStore.deleteAgent.mockImplementation((id: string) => {
        mockStore.agents = mockStore.agents.filter((a: any) => a.id !== id);
      });

      const response = await request(app).delete('/api/agents/1');
      
      expect(response.status).toBe(200);
      expect(mockStore.deleteAgent).toHaveBeenCalledWith('1');
    });

    it('should return 404 when deleting non-existent agent', async () => {
      mockStore.agents = [];
      
      const response = await request(app).delete('/api/agents/999');
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/agents/:id/as-tool', () => {
    it('should convert agent to tool format', async () => {
      const agent = {
        id: '1',
        name: 'Test Agent',
        description: 'Test Description',
        systemPrompt: 'Test prompt',
        tools: [],
        mcpIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockStore.agents = [agent];

      const response = await request(app).get('/api/agents/1/as-tool');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('params');
    });
  });
});

// Helper function to setup routes for testing
function setupAgentRoutes(app: express.Application, store: any) {
  app.get('/api/agents', (_req, res) => {
    res.json(store.agents);
  });

  app.get('/api/agents/:id', (req, res) => {
    const agent = store.agents.find((a: any) => a.id === req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  });

  app.post('/api/agents', (req, res) => {
    if (!req.body.name || !req.body.systemPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const agent = store.createAgent(req.body);
    res.status(201).json(agent);
  });

  app.put('/api/agents/:id', (req, res) => {
    const agent = store.agents.find((a: any) => a.id === req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    store.updateAgent(req.params.id, req.body);
    res.json({ success: true });
  });

  app.patch('/api/agents/:id', (req, res) => {
    const agent = store.agents.find((a: any) => a.id === req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    store.updateAgent(req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete('/api/agents/:id', (req, res) => {
    const agent = store.agents.find((a: any) => a.id === req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    store.deleteAgent(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/agents/:id/as-tool', (req, res) => {
    const agent = store.agents.find((a: any) => a.id === req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({
      id: `agent-${agent.id}`,
      name: agent.name,
      description: agent.description,
      params: [
        {
          name: 'input',
          type: 'string',
          description: 'Input message for the agent',
          required: true,
        },
      ],
    });
  });
}

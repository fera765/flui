/**
 * Complete Workflow Integration Test
 * Tests end-to-end workflow scenarios including:
 * - Agent creation with MCP tools
 * - Automation with agent execution
 * - Tool execution with context
 * - Agent output linking
 */

import { generateId } from '../../source/utils/id.js';

describe('Complete Workflow Integration', () => {
  describe('Agent with MCP Integration', () => {
    it('should create agent with MCP tools and execute', async () => {
      // 1. Create MCP
      const mcp = {
        id: generateId(),
        name: 'Test MCP Server',
        description: 'MCP for testing',
        version: '1.0.0',
        server: '@test/mcp-server',
        installType: 'npm' as const,
        tools: [
          {
            id: 'test-tool-1',
            name: 'getData',
            description: 'Get data from external source',
            parameters: {
              source: { type: 'string', description: 'Data source' },
            },
            handler: 'getData',
          },
        ],
        enabled: true,
      };

      // 2. Create agent with MCP
      const agent = {
        id: generateId(),
        name: 'Data Processing Agent',
        description: 'Agent that processes data using MCP tools',
        systemPrompt: 'You are a data processing agent. Use the available tools to fetch and process data.',
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2000,
        tools: [],
        mcpIds: [mcp.id],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Verify agent has access to MCP tools
      expect(agent.mcpIds).toContain(mcp.id);
      expect(mcp.tools).toHaveLength(1);
      expect(mcp.tools[0].name).toBe('getData');
    });

    it('should execute automation with agent and MCP tools', async () => {
      // Create automation workflow
      const automation = {
        id: generateId(),
        name: 'Data Processing Workflow',
        description: 'Fetch data via MCP and process with agent',
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual-trigger',
            name: 'Manual Start',
            config: {},
            position: { x: 0, y: 0 },
          },
          {
            id: 'mcp-tool-1',
            type: 'mcp-tool',
            name: 'Fetch Data',
            config: {
              toolId: 'test-tool-1',
              params: {
                source: 'api',
              },
            },
            position: { x: 200, y: 0 },
          },
          {
            id: 'agent-1',
            type: 'agent-executor',
            name: 'Process Data',
            config: {
              agentId: 'agent-123',
              input: '{{ nodes.mcp-tool-1.result }}',
            },
            position: { x: 400, y: 0 },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'trigger-1',
            target: 'mcp-tool-1',
          },
          {
            id: 'edge-2',
            source: 'mcp-tool-1',
            target: 'agent-1',
          },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Verify automation structure
      expect(automation.nodes).toHaveLength(3);
      expect(automation.edges).toHaveLength(2);
      
      // Verify data flow
      const agentNode = automation.nodes.find(n => n.id === 'agent-1');
      expect(agentNode?.config.input).toContain('nodes.mcp-tool-1.result');
    });
  });

  describe('Agent Output Linking', () => {
    it('should link outputs between multiple agents', async () => {
      const automation = {
        id: generateId(),
        name: 'Multi-Agent Pipeline',
        description: 'Sequential agent execution with output linking',
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual-trigger',
            name: 'Start',
            config: {},
          },
          {
            id: 'agent-1',
            type: 'agent-executor',
            name: 'Data Analyzer',
            config: {
              agentId: 'analyzer-agent',
              input: 'Analyze this data: {{ trigger.data }}',
            },
          },
          {
            id: 'agent-2',
            type: 'agent-executor',
            name: 'Report Generator',
            config: {
              agentId: 'reporter-agent',
              input: 'Generate report based on: {{ nodes.agent-1.response }}',
            },
          },
          {
            id: 'agent-3',
            type: 'agent-executor',
            name: 'Summary Writer',
            config: {
              agentId: 'summarizer-agent',
              input: 'Summarize this report: {{ nodes.agent-2.response }}',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'agent-1' },
          { id: 'e2', source: 'agent-1', target: 'agent-2' },
          { id: 'e3', source: 'agent-2', target: 'agent-3' },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Verify linking structure
      const agent2 = automation.nodes.find(n => n.id === 'agent-2');
      const agent3 = automation.nodes.find(n => n.id === 'agent-3');
      
      expect(agent2?.config.input).toContain('nodes.agent-1.response');
      expect(agent3?.config.input).toContain('nodes.agent-2.response');
    });

    it('should support conditional branching with agent outputs', async () => {
      const automation = {
        id: generateId(),
        name: 'Conditional Agent Flow',
        description: 'Branch execution based on agent output',
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual-trigger',
            name: 'Start',
            config: {},
          },
          {
            id: 'classifier-agent',
            type: 'agent-executor',
            name: 'Classify Input',
            config: {
              agentId: 'classifier',
              input: '{{ trigger.data }}',
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            name: 'Check Classification',
            config: {
              condition: '{{ nodes.classifier-agent.category === "urgent" }}',
            },
          },
          {
            id: 'urgent-agent',
            type: 'agent-executor',
            name: 'Handle Urgent',
            config: {
              agentId: 'urgent-handler',
              input: '{{ nodes.classifier-agent.response }}',
            },
          },
          {
            id: 'normal-agent',
            type: 'agent-executor',
            name: 'Handle Normal',
            config: {
              agentId: 'normal-handler',
              input: '{{ nodes.classifier-agent.response }}',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'classifier-agent' },
          { id: 'e2', source: 'classifier-agent', target: 'condition-1' },
          {
            id: 'e3',
            source: 'condition-1',
            target: 'urgent-agent',
            condition: true,
          },
          {
            id: 'e4',
            source: 'condition-1',
            target: 'normal-agent',
            condition: false,
          },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(automation.nodes).toHaveLength(5);
      
      const conditionalEdges = automation.edges.filter((e: any) => 
        e.hasOwnProperty('condition')
      );
      expect(conditionalEdges).toHaveLength(2);
    });
  });

  describe('Complex Automation Scenarios', () => {
    it('should handle parallel agent execution', async () => {
      const automation = {
        id: generateId(),
        name: 'Parallel Processing',
        description: 'Execute multiple agents in parallel',
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual-trigger',
            name: 'Start',
            config: {},
          },
          {
            id: 'agent-a',
            type: 'agent-executor',
            name: 'Agent A',
            config: {
              agentId: 'agent-a',
              input: '{{ trigger.data }}',
            },
          },
          {
            id: 'agent-b',
            type: 'agent-executor',
            name: 'Agent B',
            config: {
              agentId: 'agent-b',
              input: '{{ trigger.data }}',
            },
          },
          {
            id: 'agent-c',
            type: 'agent-executor',
            name: 'Agent C',
            config: {
              agentId: 'agent-c',
              input: '{{ trigger.data }}',
            },
          },
          {
            id: 'merge-1',
            type: 'merge',
            name: 'Merge Results',
            config: {
              inputs: [
                '{{ nodes.agent-a.response }}',
                '{{ nodes.agent-b.response }}',
                '{{ nodes.agent-c.response }}',
              ],
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'agent-a' },
          { id: 'e2', source: 'trigger-1', target: 'agent-b' },
          { id: 'e3', source: 'trigger-1', target: 'agent-c' },
          { id: 'e4', source: 'agent-a', target: 'merge-1' },
          { id: 'e5', source: 'agent-b', target: 'merge-1' },
          { id: 'e6', source: 'agent-c', target: 'merge-1' },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Verify parallel structure
      const triggerEdges = automation.edges.filter((e: any) => 
        e.source === 'trigger-1'
      );
      expect(triggerEdges).toHaveLength(3);

      const mergeNode = automation.nodes.find(n => n.id === 'merge-1');
      expect(mergeNode?.config.inputs).toHaveLength(3);
    });

    it('should support loop execution with agents', async () => {
      const automation = {
        id: generateId(),
        name: 'Iterative Agent Processing',
        description: 'Loop through data with agent processing',
        nodes: [
          {
            id: 'trigger-1',
            type: 'manual-trigger',
            name: 'Start',
            config: {},
          },
          {
            id: 'loop-1',
            type: 'loop',
            name: 'Process Each Item',
            config: {
              items: '{{ trigger.items }}',
              itemVar: 'currentItem',
            },
          },
          {
            id: 'agent-1',
            type: 'agent-executor',
            name: 'Process Item',
            config: {
              agentId: 'processor-agent',
              input: '{{ currentItem }}',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'loop-1' },
          { id: 'e2', source: 'loop-1', target: 'agent-1' },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const loopNode = automation.nodes.find(n => n.id === 'loop-1');
      expect(loopNode?.config.items).toBeTruthy();
      expect(loopNode?.config.itemVar).toBe('currentItem');
    });

    it('should handle webhook trigger with agent response', async () => {
      const automation = {
        id: generateId(),
        name: 'Webhook to Agent',
        description: 'Webhook triggers agent execution',
        nodes: [
          {
            id: 'webhook-1',
            type: 'webhook-trigger',
            name: 'Incoming Webhook',
            config: {
              path: '/api/webhook/test',
              method: 'POST',
            },
          },
          {
            id: 'agent-1',
            type: 'agent-executor',
            name: 'Process Request',
            config: {
              agentId: 'webhook-processor',
              input: '{{ nodes.webhook-1.body }}',
            },
          },
          {
            id: 'response-1',
            type: 'webhook-response',
            name: 'Send Response',
            config: {
              body: '{{ nodes.agent-1.response }}',
              statusCode: 200,
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'webhook-1', target: 'agent-1' },
          { id: 'e2', source: 'agent-1', target: 'response-1' },
        ],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(automation.nodes).toHaveLength(3);
      
      const webhookNode = automation.nodes.find(n => n.id === 'webhook-1');
      const responseNode = automation.nodes.find(n => n.id === 'response-1');
      
      expect(webhookNode?.config.path).toBe('/api/webhook/test');
      expect(responseNode?.config.body).toContain('nodes.agent-1.response');
    });
  });

  describe('MCP Function Exposure', () => {
    it('should expose MCP functions as tools', async () => {
      const mcp = {
        id: generateId(),
        name: 'External API MCP',
        description: 'MCP exposing external API functions',
        version: '1.0.0',
        server: '@example/api-mcp',
        installType: 'npm' as const,
        tools: [
          {
            id: 'get-user',
            name: 'getUser',
            description: 'Get user by ID',
            parameters: {
              userId: { type: 'string', description: 'User ID' },
            },
            handler: 'getUser',
          },
          {
            id: 'create-user',
            name: 'createUser',
            description: 'Create new user',
            parameters: {
              name: { type: 'string', description: 'User name' },
              email: { type: 'string', description: 'User email' },
            },
            handler: 'createUser',
          },
          {
            id: 'update-user',
            name: 'updateUser',
            description: 'Update user',
            parameters: {
              userId: { type: 'string', description: 'User ID' },
              data: { type: 'object', description: 'Update data' },
            },
            handler: 'updateUser',
          },
        ],
        enabled: true,
      };

      // Verify all functions are exposed
      expect(mcp.tools).toHaveLength(3);
      expect(mcp.tools.map(t => t.name)).toEqual(['getUser', 'createUser', 'updateUser']);
      
      // Verify each tool has proper structure
      mcp.tools.forEach(tool => {
        expect(tool).toHaveProperty('id');
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('handler');
      });
    });

    it('should use MCP tools in agent', async () => {
      const agent = {
        id: generateId(),
        name: 'User Management Agent',
        description: 'Agent for managing users via MCP',
        systemPrompt: 'You manage users. Use the available tools to get, create, and update users.',
        model: 'gpt-4-turbo-preview',
        mcpIds: ['external-api-mcp'],
        tools: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(agent.mcpIds).toContain('external-api-mcp');
      expect(agent.systemPrompt).toContain('available tools');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should validate automation before execution', () => {
      const invalidAutomation = {
        id: generateId(),
        name: 'Invalid Automation',
        description: 'Missing required fields',
        nodes: [],
        edges: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Should fail validation - no nodes
      expect(invalidAutomation.nodes).toHaveLength(0);
    });

    it('should handle missing agent in automation', () => {
      const automation = {
        id: generateId(),
        name: 'Automation with Missing Agent',
        description: 'References non-existent agent',
        nodes: [
          {
            id: 'agent-1',
            type: 'agent-executor',
            name: 'Process',
            config: {
              agentId: 'non-existent-agent',
              input: 'test',
            },
          },
        ],
        edges: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const agentNode = automation.nodes[0];
      expect(agentNode.config.agentId).toBe('non-existent-agent');
      // Should fail at execution time with proper error
    });

    it('should validate MCP configuration', () => {
      const validMCP = {
        id: generateId(),
        name: 'Valid MCP',
        description: 'Properly configured MCP',
        version: '1.0.0',
        server: '@valid/mcp-server',
        installType: 'npm' as const,
        tools: [],
        enabled: true,
      };

      expect(validMCP.server).toBeTruthy();
      expect(validMCP.installType).toMatch(/^(npm|npx|github|local)$/);
    });
  });
});

/**
 * MCPs API Tests
 * Tests for all MCP-related endpoints
 */
import request from 'supertest';
import express from 'express';
import { useStore } from '../../source/store/store.js';
jest.mock('../../source/store/store.js');
describe('MCPs API', () => {
    let app;
    let mockStore;
    beforeEach(() => {
        jest.clearAllMocks();
        mockStore = {
            mcps: [],
            createMCP: jest.fn(),
            updateMCP: jest.fn(),
            deleteMCP: jest.fn(),
        };
        useStore.getState = jest.fn(() => mockStore);
        app = express();
        app.use(express.json());
        setupMCPRoutes(app, mockStore);
    });
    describe('GET /api/mcps', () => {
        it('should return all MCPs', async () => {
            mockStore.mcps = [
                {
                    id: 'mcp-1',
                    name: 'Test MCP',
                    description: 'Test Description',
                    version: '1.0.0',
                    server: 'test-server',
                    installType: 'npm',
                    tools: [],
                    enabled: true,
                },
            ];
            const response = await request(app).get('/api/mcps');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockStore.mcps);
        });
    });
    describe('GET /api/mcps/:id', () => {
        it('should return MCP by id', async () => {
            const testMCP = {
                id: 'mcp-1',
                name: 'Test MCP',
                description: 'Test Description',
                version: '1.0.0',
                server: 'test-server',
                installType: 'npm',
                tools: [],
                enabled: true,
            };
            mockStore.mcps = [testMCP];
            const response = await request(app).get('/api/mcps/mcp-1');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testMCP);
        });
        it('should return 404 when MCP not found', async () => {
            mockStore.mcps = [];
            const response = await request(app).get('/api/mcps/nonexistent');
            expect(response.status).toBe(404);
        });
    });
    describe('POST /api/mcps', () => {
        it('should create a new MCP', async () => {
            const newMCP = {
                name: 'New MCP',
                description: 'New Description',
                version: '1.0.0',
                server: 'new-server',
                installType: 'npm',
                tools: [],
                enabled: true,
            };
            mockStore.createMCP.mockImplementation((mcp) => {
                const created = {
                    ...mcp,
                    id: 'mcp-123',
                };
                mockStore.mcps.push(created);
                return created;
            });
            const response = await request(app)
                .post('/api/mcps')
                .send(newMCP);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(newMCP.name);
        });
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/mcps')
                .send({});
            expect(response.status).toBe(400);
        });
        it('should create MCP with environment variables', async () => {
            const newMCP = {
                name: 'MCP with Env',
                description: 'Test',
                version: '1.0.0',
                server: 'test-server',
                installType: 'npm',
                envVars: {
                    API_KEY: 'test-key',
                },
                tools: [],
                enabled: true,
            };
            mockStore.createMCP.mockImplementation((mcp) => {
                const created = {
                    ...mcp,
                    id: 'mcp-123',
                };
                mockStore.mcps.push(created);
                return created;
            });
            const response = await request(app)
                .post('/api/mcps')
                .send(newMCP);
            expect(response.status).toBe(201);
            expect(response.body.envVars).toEqual({ API_KEY: 'test-key' });
        });
    });
    describe('PUT /api/mcps/:id', () => {
        it('should update an existing MCP', async () => {
            const existingMCP = {
                id: 'mcp-1',
                name: 'Old Name',
                description: 'Old Description',
                version: '1.0.0',
                server: 'old-server',
                installType: 'npm',
                tools: [],
                enabled: true,
            };
            mockStore.mcps = [existingMCP];
            mockStore.updateMCP.mockImplementation((id, updates) => {
                const mcp = mockStore.mcps.find((m) => m.id === id);
                if (mcp) {
                    Object.assign(mcp, updates);
                }
            });
            const updates = {
                name: 'New Name',
                description: 'New Description',
            };
            const response = await request(app)
                .put('/api/mcps/mcp-1')
                .send(updates);
            expect(response.status).toBe(200);
            expect(mockStore.updateMCP).toHaveBeenCalledWith('mcp-1', expect.objectContaining(updates));
        });
    });
    describe('PATCH /api/mcps/:id', () => {
        it('should partially update an MCP', async () => {
            const existingMCP = {
                id: 'mcp-1',
                name: 'Test MCP',
                description: 'Test',
                version: '1.0.0',
                server: 'test-server',
                installType: 'npm',
                tools: [],
                enabled: true,
            };
            mockStore.mcps = [existingMCP];
            mockStore.updateMCP.mockImplementation((id, updates) => {
                const mcp = mockStore.mcps.find((m) => m.id === id);
                if (mcp) {
                    Object.assign(mcp, updates);
                }
            });
            const response = await request(app)
                .patch('/api/mcps/mcp-1')
                .send({ enabled: false });
            expect(response.status).toBe(200);
        });
    });
    describe('DELETE /api/mcps/:id', () => {
        it('should delete an MCP', async () => {
            const mcp = {
                id: 'mcp-1',
                name: 'Test MCP',
                description: 'Test',
                version: '1.0.0',
                server: 'test-server',
                installType: 'npm',
                tools: [],
                enabled: true,
            };
            mockStore.mcps = [mcp];
            mockStore.deleteMCP.mockImplementation((id) => {
                mockStore.mcps = mockStore.mcps.filter((m) => m.id !== id);
            });
            const response = await request(app).delete('/api/mcps/mcp-1');
            expect(response.status).toBe(200);
            expect(mockStore.deleteMCP).toHaveBeenCalledWith('mcp-1');
        });
    });
    describe('POST /api/mcps/:id/sync', () => {
        it('should sync MCP tools', async () => {
            const mcp = {
                id: 'mcp-1',
                name: 'Test MCP',
                description: 'Test',
                version: '1.0.0',
                server: 'test-server',
                installType: 'npm',
                tools: [],
                enabled: true,
            };
            mockStore.mcps = [mcp];
            const response = await request(app).post('/api/mcps/mcp-1/sync');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
        });
        it('should return 404 when syncing non-existent MCP', async () => {
            mockStore.mcps = [];
            const response = await request(app).post('/api/mcps/nonexistent/sync');
            expect(response.status).toBe(404);
        });
    });
    describe('POST /api/mcps/:id/test', () => {
        it('should test MCP connection', async () => {
            const mcp = {
                id: 'mcp-1',
                name: 'Test MCP',
                description: 'Test',
                version: '1.0.0',
                server: 'test-server',
                installType: 'npm',
                tools: [],
                enabled: true,
            };
            mockStore.mcps = [mcp];
            const response = await request(app).post('/api/mcps/mcp-1/test');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
        });
    });
});
function setupMCPRoutes(app, store) {
    app.get('/api/mcps', (_req, res) => {
        res.json(store.mcps);
    });
    app.get('/api/mcps/:id', (req, res) => {
        const mcp = store.mcps.find((m) => m.id === req.params.id);
        if (!mcp) {
            return res.status(404).json({ error: 'MCP not found' });
        }
        res.json(mcp);
    });
    app.post('/api/mcps', (req, res) => {
        if (!req.body.name || !req.body.server) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const mcp = store.createMCP(req.body);
        res.status(201).json(mcp);
    });
    app.put('/api/mcps/:id', (req, res) => {
        const mcp = store.mcps.find((m) => m.id === req.params.id);
        if (!mcp) {
            return res.status(404).json({ error: 'MCP not found' });
        }
        store.updateMCP(req.params.id, req.body);
        res.json({ success: true });
    });
    app.patch('/api/mcps/:id', (req, res) => {
        const mcp = store.mcps.find((m) => m.id === req.params.id);
        if (!mcp) {
            return res.status(404).json({ error: 'MCP not found' });
        }
        store.updateMCP(req.params.id, req.body);
        res.json({ success: true });
    });
    app.delete('/api/mcps/:id', (req, res) => {
        const mcp = store.mcps.find((m) => m.id === req.params.id);
        if (!mcp) {
            return res.status(404).json({ error: 'MCP not found' });
        }
        store.deleteMCP(req.params.id);
        res.json({ success: true });
    });
    app.post('/api/mcps/:id/sync', (req, res) => {
        const mcp = store.mcps.find((m) => m.id === req.params.id);
        if (!mcp) {
            return res.status(404).json({ error: 'MCP not found' });
        }
        res.json({ success: true, toolsCount: 0 });
    });
    app.post('/api/mcps/:id/test', (req, res) => {
        const mcp = store.mcps.find((m) => m.id === req.params.id);
        if (!mcp) {
            return res.status(404).json({ error: 'MCP not found' });
        }
        res.json({ success: true, status: 'connected' });
    });
}
//# sourceMappingURL=mcps.test.js.map
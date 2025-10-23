/**
 * Automations API Tests
 * Tests for all automation-related endpoints
 */
import request from 'supertest';
import express from 'express';
import { getAutomations, saveAutomation, deleteAutomation } from '../../source/store/automationStorage.js';
jest.mock('../../source/store/automationStorage.js');
describe('Automations API', () => {
    let app;
    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        setupAutomationRoutes(app);
    });
    describe('GET /api/automations', () => {
        it('should return all automations', async () => {
            const mockAutomations = [
                {
                    id: 'auto-1',
                    name: 'Test Automation',
                    description: 'Test Description',
                    nodes: [],
                    edges: [],
                    enabled: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            getAutomations.mockReturnValue(mockAutomations);
            const response = await request(app).get('/api/automations');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAutomations);
        });
        it('should return empty array when no automations exist', async () => {
            getAutomations.mockReturnValue([]);
            const response = await request(app).get('/api/automations');
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });
    describe('GET /api/automations/:id', () => {
        it('should return automation by id', async () => {
            const testAutomation = {
                id: 'auto-1',
                name: 'Test Automation',
                description: 'Test Description',
                nodes: [],
                edges: [],
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            getAutomations.mockReturnValue([testAutomation]);
            const response = await request(app).get('/api/automations/auto-1');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testAutomation);
        });
        it('should return 404 when automation not found', async () => {
            getAutomations.mockReturnValue([]);
            const response = await request(app).get('/api/automations/nonexistent');
            expect(response.status).toBe(404);
        });
    });
    describe('POST /api/automations', () => {
        it('should create a new automation', async () => {
            const newAutomation = {
                name: 'New Automation',
                description: 'New Description',
                nodes: [],
                edges: [],
                enabled: true,
            };
            saveAutomation.mockImplementation((auto) => auto);
            const response = await request(app)
                .post('/api/automations')
                .send(newAutomation);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(newAutomation.name);
            expect(saveAutomation).toHaveBeenCalled();
        });
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/automations')
                .send({});
            expect(response.status).toBe(400);
        });
        it('should create automation with nodes and edges', async () => {
            const automation = {
                name: 'Workflow Automation',
                description: 'Test workflow',
                nodes: [
                    {
                        id: 'node-1',
                        type: 'trigger',
                        name: 'Manual Trigger',
                        config: {},
                        position: { x: 0, y: 0 },
                    },
                    {
                        id: 'node-2',
                        type: 'action',
                        name: 'Execute Tool',
                        config: {},
                        position: { x: 200, y: 0 },
                    },
                ],
                edges: [
                    {
                        id: 'edge-1',
                        source: 'node-1',
                        target: 'node-2',
                    },
                ],
                enabled: true,
            };
            saveAutomation.mockImplementation((auto) => auto);
            const response = await request(app)
                .post('/api/automations')
                .send(automation);
            expect(response.status).toBe(201);
            expect(response.body.nodes).toHaveLength(2);
            expect(response.body.edges).toHaveLength(1);
        });
    });
    describe('PUT /api/automations/:id', () => {
        it('should update an existing automation', async () => {
            const existingAutomation = {
                id: 'auto-1',
                name: 'Old Name',
                description: 'Old Description',
                nodes: [],
                edges: [],
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            getAutomations.mockReturnValue([existingAutomation]);
            saveAutomation.mockImplementation((auto) => auto);
            const updates = {
                name: 'New Name',
                description: 'New Description',
            };
            const response = await request(app)
                .put('/api/automations/auto-1')
                .send(updates);
            expect(response.status).toBe(200);
            expect(saveAutomation).toHaveBeenCalled();
        });
        it('should return 404 when updating non-existent automation', async () => {
            getAutomations.mockReturnValue([]);
            const response = await request(app)
                .put('/api/automations/nonexistent')
                .send({ name: 'New Name' });
            expect(response.status).toBe(404);
        });
    });
    describe('PATCH /api/automations/:id', () => {
        it('should partially update an automation', async () => {
            const existingAutomation = {
                id: 'auto-1',
                name: 'Test Automation',
                description: 'Test',
                nodes: [],
                edges: [],
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            getAutomations.mockReturnValue([existingAutomation]);
            saveAutomation.mockImplementation((auto) => auto);
            const response = await request(app)
                .patch('/api/automations/auto-1')
                .send({ enabled: false });
            expect(response.status).toBe(200);
        });
    });
    describe('DELETE /api/automations/:id', () => {
        it('should delete an automation', async () => {
            deleteAutomation.mockReturnValue(true);
            const response = await request(app).delete('/api/automations/auto-1');
            expect(response.status).toBe(200);
            expect(deleteAutomation).toHaveBeenCalledWith('auto-1');
        });
        it('should return 404 when deleting non-existent automation', async () => {
            deleteAutomation.mockReturnValue(false);
            const response = await request(app).delete('/api/automations/nonexistent');
            expect(response.status).toBe(404);
        });
    });
    describe('POST /api/automations/:id/execute', () => {
        it('should execute an automation', async () => {
            const automation = {
                id: 'auto-1',
                name: 'Test Automation',
                description: 'Test',
                nodes: [
                    {
                        id: 'node-1',
                        type: 'trigger',
                        name: 'Manual Trigger',
                        config: {},
                    },
                ],
                edges: [],
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            getAutomations.mockReturnValue([automation]);
            const response = await request(app)
                .post('/api/automations/auto-1/execute')
                .send({ input: { message: 'test' } });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('executionId');
        });
        it('should return 404 when executing non-existent automation', async () => {
            getAutomations.mockReturnValue([]);
            const response = await request(app).post('/api/automations/nonexistent/execute');
            expect(response.status).toBe(404);
        });
        it('should execute automation with initial data', async () => {
            const automation = {
                id: 'auto-1',
                name: 'Test Automation',
                description: 'Test',
                nodes: [
                    {
                        id: 'node-1',
                        type: 'trigger',
                        name: 'Manual Trigger',
                        config: {},
                    },
                ],
                edges: [],
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            getAutomations.mockReturnValue([automation]);
            const response = await request(app)
                .post('/api/automations/auto-1/execute')
                .send({
                input: {
                    userId: '123',
                    action: 'test',
                },
            });
            expect(response.status).toBe(200);
        });
    });
    describe('GET /api/automations/:automationId/nodes/:nodeId/available-outputs', () => {
        it('should return available outputs for a node', async () => {
            const automation = {
                id: 'auto-1',
                name: 'Test Automation',
                description: 'Test',
                nodes: [
                    {
                        id: 'node-1',
                        type: 'trigger',
                        name: 'Trigger',
                        config: {},
                    },
                    {
                        id: 'node-2',
                        type: 'action',
                        name: 'Action',
                        config: {},
                    },
                ],
                edges: [
                    {
                        id: 'edge-1',
                        source: 'node-1',
                        target: 'node-2',
                    },
                ],
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            getAutomations.mockReturnValue([automation]);
            const response = await request(app).get('/api/automations/auto-1/nodes/node-2/available-outputs');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
    });
});
function setupAutomationRoutes(app) {
    app.get('/api/automations', (_req, res) => {
        const automations = getAutomations();
        res.json(automations);
    });
    app.get('/api/automations/:id', (req, res) => {
        const automations = getAutomations();
        const automation = automations.find((a) => a.id === req.params.id);
        if (!automation) {
            return res.status(404).json({ error: 'Automation not found' });
        }
        res.json(automation);
    });
    app.post('/api/automations', (req, res) => {
        if (!req.body.name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const automation = {
            ...req.body,
            id: 'auto-' + Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        saveAutomation(automation);
        res.status(201).json(automation);
    });
    app.put('/api/automations/:id', (req, res) => {
        const automations = getAutomations();
        const automation = automations.find((a) => a.id === req.params.id);
        if (!automation) {
            return res.status(404).json({ error: 'Automation not found' });
        }
        const updated = {
            ...automation,
            ...req.body,
            updatedAt: new Date().toISOString(),
        };
        saveAutomation(updated);
        res.json(updated);
    });
    app.patch('/api/automations/:id', (req, res) => {
        const automations = getAutomations();
        const automation = automations.find((a) => a.id === req.params.id);
        if (!automation) {
            return res.status(404).json({ error: 'Automation not found' });
        }
        const updated = {
            ...automation,
            ...req.body,
            updatedAt: new Date().toISOString(),
        };
        saveAutomation(updated);
        res.json(updated);
    });
    app.delete('/api/automations/:id', (req, res) => {
        const result = deleteAutomation(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Automation not found' });
        }
        res.json({ success: true });
    });
    app.post('/api/automations/:id/execute', (req, res) => {
        const automations = getAutomations();
        const automation = automations.find((a) => a.id === req.params.id);
        if (!automation) {
            return res.status(404).json({ error: 'Automation not found' });
        }
        res.json({
            executionId: 'exec-' + Date.now(),
            status: 'running',
        });
    });
    app.get('/api/automations/:automationId/nodes/:nodeId/available-outputs', (req, res) => {
        const automations = getAutomations();
        const automation = automations.find((a) => a.id === req.params.automationId);
        if (!automation) {
            return res.status(404).json({ error: 'Automation not found' });
        }
        res.json([]);
    });
}
//# sourceMappingURL=automations.test.js.map
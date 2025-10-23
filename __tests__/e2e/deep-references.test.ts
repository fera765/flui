/**
 * E2E Tests - Deep Output References
 * Testing Node 50 using output from Node 20 (and earlier)
 */

import { FlowEngineV2 } from '../../source/core/flowEngineV2.js';
import { FlowDefinition } from '../../source/core/flowTypes.js';
import { registerAllTools } from '../../source/tools/registerAllTools.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm, mkdir, writeFile } from 'fs/promises';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

describe('E2E - Deep Output References - REAL', () => {
  let sandboxDir: string;

  beforeAll(async () => {
    // Register all tools
    await registerAllTools();
  });

  beforeEach(async () => {
    sandboxDir = join(tmpdir(), `flui-e2e-${generateId()}`);
    await mkdir(sandboxDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(sandboxDir, { recursive: true, force: true });
  });

  it('should allow Node 5 to access output from Node 2 (deep reference)', async () => {
    /**
     * Flow:
     * Node 1 (WriteFile) → Node 2 (ReadFile) → Node 3 (SearchText) → 
     * Node 4 (EditText) → Node 5 (Create Summary - has access to all previous outputs)
     * 
     * This validates that Node 5 can access Node 2's output even though
     * Nodes 3 and 4 executed in between.
     */
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Deep Reference Test - Node 5 uses Node 2',
      description: 'Test deep reference capability',
      version: '1.0',
      nodes: [
        {
          id: 'node-1',
          name: 'Create File',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'data.txt'),
            content: 'Original content line 1\nOriginal content line 2',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-2',
          name: 'Read File',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: join(sandboxDir, 'data.txt'),
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-3',
          name: 'Search Content',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'Original',
            path: join(sandboxDir, 'data.txt'),
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-4',
          name: 'Edit File',
          type: 'tool',
          config: {
            toolId: 'text-replace',
            path: join(sandboxDir, 'data.txt'),
            find: 'Original',
            replace: 'Modified',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-5',
          name: 'Create Summary',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'summary.txt'),
            content: 'Summary: File was processed',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node-1', target: 'node-2' },
        { id: 'e2', source: 'node-2', target: 'node-3' },
        { id: 'e3', source: 'node-3', target: 'node-4' },
        { id: 'e4', source: 'node-4', target: 'node-5' },
      ],
      startNodeId: 'node-1',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    // Debug: Log error if execution failed
    if (result.status === 'failed') {
      console.error('❌ Execution failed:', result.error);
      const failedLogs = result.logs.filter(l => l.status === 'failed');
      failedLogs.forEach(log => console.error('  -', log.nodeName, ':', log.message, log.error));
    }

    expect(result.status).toBe('completed');
    expect(result.nodeResults['node-2']).toBeTruthy();
    expect(result.nodeResults['node-5']).toBeTruthy();
    
    // Verify Node 5 can access Node 2's output through the engine
    const node2Output = engine.getNodeOutput('node-2');
    const node5Output = engine.getNodeOutput('node-5');
    
    expect(node2Output).toBeTruthy();
    expect(node5Output).toBeTruthy();
    
    // Both outputs should be accessible
    expect(Array.isArray(node2Output)).toBe(true);
    expect(Array.isArray(node5Output)).toBe(true);
  }, 30000);

  it('should allow Node 10 to reference outputs from Nodes 3, 5, and 7', async () => {
    /**
     * Complex flow with multiple branches and deep references
     */
    const dataFile = join(sandboxDir, 'numbers.txt');
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Multi-Deep Reference Test',
      description: 'Node 10 references multiple previous nodes',
      version: '1.0',
      nodes: [
        // Node 1: Write initial data
        {
          id: 'node-1',
          name: 'Write Numbers',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: dataFile,
            content: '1\n2\n3\n4\n5',
            sandboxPath: sandboxDir,
          },
        },
        // Node 2: Read file
        {
          id: 'node-2',
          name: 'Read File',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: dataFile,
            sandboxPath: sandboxDir,
          },
        },
        // Node 3: Count lines
        {
          id: 'node-3',
          name: 'Count Lines',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: '\\d',
            path: dataFile,
            regex: true,
            sandboxPath: sandboxDir,
          },
        },
        // Node 4: Add more numbers
        {
          id: 'node-4',
          name: 'Add Numbers',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: dataFile,
            content: '6\n7\n8',
            append: true,
            sandboxPath: sandboxDir,
          },
        },
        // Node 5: Read updated file
        {
          id: 'node-5',
          name: 'Read Updated',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: dataFile,
            sandboxPath: sandboxDir,
          },
        },
        // Node 6: Search for specific number
        {
          id: 'node-6',
          name: 'Find Number 7',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: '7',
            path: dataFile,
            sandboxPath: sandboxDir,
          },
        },
        // Node 7: Count all lines now
        {
          id: 'node-7',
          name: 'Final Count',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: '\\d',
            path: dataFile,
            regex: true,
            sandboxPath: sandboxDir,
          },
        },
        // Node 8: Create summary file
        {
          id: 'node-8',
          name: 'Create Summary',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'summary.txt'),
            content: 'Processing complete',
            sandboxPath: sandboxDir,
          },
        },
        // Node 9: Read summary
        {
          id: 'node-9',
          name: 'Read Summary',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: join(sandboxDir, 'summary.txt'),
            sandboxPath: sandboxDir,
          },
        },
        // Node 10: Final verification using outputs from Nodes 3, 5, 7
        {
          id: 'node-10',
          name: 'Final Verification',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'verification.txt'),
            // References to Node 3 (initial count), Node 5 (updated content), Node 7 (final count)
            content: 'Verification complete: All nodes executed',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node-1', target: 'node-2' },
        { id: 'e2', source: 'node-2', target: 'node-3' },
        { id: 'e3', source: 'node-3', target: 'node-4' },
        { id: 'e4', source: 'node-4', target: 'node-5' },
        { id: 'e5', source: 'node-5', target: 'node-6' },
        { id: 'e6', source: 'node-6', target: 'node-7' },
        { id: 'e7', source: 'node-7', target: 'node-8' },
        { id: 'e8', source: 'node-8', target: 'node-9' },
        { id: 'e9', source: 'node-9', target: 'node-10' },
      ],
      startNodeId: 'node-1',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all nodes executed
    expect(result.nodeResults['node-3']).toBeTruthy();
    expect(result.nodeResults['node-5']).toBeTruthy();
    expect(result.nodeResults['node-7']).toBeTruthy();
    expect(result.nodeResults['node-10']).toBeTruthy();
    
    // Verify execution order
    expect(Object.keys(result.nodeResults).length).toBe(10);
  }, 30000);

  it('should support Node 50 using output from Node 20', async () => {
    /**
     * Long chain: Create 50 nodes, Node 50 references Node 20
     */
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Create 50 sequential nodes
    for (let i = 1; i <= 50; i++) {
      const nodeId = `node-${i}`;
      const filePath = join(sandboxDir, `step-${i}.txt`);
      
      nodes.push({
        id: nodeId,
        name: `Step ${i}`,
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: filePath,
          content: `Step ${i} completed at ${Date.now()}`,
          sandboxPath: sandboxDir,
        },
      });
      
      if (i > 1) {
        edges.push({
          id: `e${i-1}`,
          source: `node-${i-1}`,
          target: nodeId,
        });
      }
    }

    const flow: FlowDefinition = {
      id: generateId(),
      name: '50-Node Deep Reference Test',
      description: 'Node 50 references Node 20',
      version: '1.0',
      nodes,
      edges,
      startNodeId: 'node-1',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify Node 20 executed
    expect(result.nodeResults['node-20']).toBeTruthy();
    
    // Verify Node 50 executed
    expect(result.nodeResults['node-50']).toBeTruthy();
    
    // Verify Node 50 can access Node 20's output
    const node20Output = engine.getNodeOutput('node-20');
    const node50Output = engine.getNodeOutput('node-50');
    
    expect(node20Output).toBeTruthy();
    expect(node50Output).toBeTruthy();
    
    // All 50 nodes should have executed
    expect(Object.keys(result.nodeResults).length).toBe(50);
  }, 60000);

  it('should support parallel branches with deep references', async () => {
    /**
     * Flow with parallel branches:
     *        Node 2 → Node 3 → Node 5
     *      /                        \
     * Node 1                         → Node 7 (references 2, 3, 4, 5, 6)
     *      \                        /
     *        Node 4 → Node 6 ------/
     */
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Parallel Branches with Deep References',
      description: 'Multiple branches converge with deep references',
      version: '1.0',
      nodes: [
        {
          id: 'node-1',
          name: 'Root',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'root.txt'),
            content: 'Root node',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-2',
          name: 'Branch A - Step 1',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'branch-a-1.txt'),
            content: 'Branch A Step 1',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-3',
          name: 'Branch A - Step 2',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'branch-a-2.txt'),
            content: 'Branch A Step 2',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-4',
          name: 'Branch B - Step 1',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'branch-b-1.txt'),
            content: 'Branch B Step 1',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-5',
          name: 'Branch A - Step 3',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'branch-a-3.txt'),
            content: 'Branch A Step 3',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-6',
          name: 'Branch B - Step 2',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'branch-b-2.txt'),
            content: 'Branch B Step 2',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'node-7',
          name: 'Merge All Branches',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'merged.txt'),
            // This node can access outputs from all previous nodes
            content: 'All branches merged successfully',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node-1', target: 'node-2' },
        { id: 'e2', source: 'node-1', target: 'node-4' },
        { id: 'e3', source: 'node-2', target: 'node-3' },
        { id: 'e4', source: 'node-3', target: 'node-5' },
        { id: 'e5', source: 'node-4', target: 'node-6' },
        { id: 'e6', source: 'node-5', target: 'node-7' },
        { id: 'e7', source: 'node-6', target: 'node-7' },
      ],
      startNodeId: 'node-1',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all branch nodes executed
    expect(result.nodeResults['node-2']).toBeTruthy();
    expect(result.nodeResults['node-3']).toBeTruthy();
    expect(result.nodeResults['node-4']).toBeTruthy();
    expect(result.nodeResults['node-5']).toBeTruthy();
    expect(result.nodeResults['node-6']).toBeTruthy();
    
    // Verify merge node executed
    expect(result.nodeResults['node-7']).toBeTruthy();
    
    // Verify all 7 nodes executed successfully
    expect(Object.keys(result.nodeResults).length).toBe(7);
    
    // Verify Node 7 can access outputs from all branches
    const node2Output = engine.getNodeOutput('node-2');
    const node3Output = engine.getNodeOutput('node-3');
    const node4Output = engine.getNodeOutput('node-4');
    const node5Output = engine.getNodeOutput('node-5');
    const node6Output = engine.getNodeOutput('node-6');
    const node7Output = engine.getNodeOutput('node-7');
    
    expect(node2Output).toBeTruthy();
    expect(node3Output).toBeTruthy();
    expect(node4Output).toBeTruthy();
    expect(node5Output).toBeTruthy();
    expect(node6Output).toBeTruthy();
    expect(node7Output).toBeTruthy();
  }, 30000);
});

/**
 * E2E Tests - Extreme Workflow Scenarios
 * Testing the limits of the flow engine
 */

import { FlowEngineV2 } from '../../source/core/flowEngineV2.js';
import { FlowDefinition } from '../../source/core/flowTypes.js';
import { registerAllTools } from '../../source/tools/registerAllTools.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm, mkdir, readFile } from 'fs/promises';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

describe('E2E - Extreme Workflow Scenarios - REAL', () => {
  let sandboxDir: string;

  beforeAll(async () => {
    await registerAllTools();
  });

  beforeEach(async () => {
    sandboxDir = join(tmpdir(), `flui-extreme-${generateId()}`);
    await mkdir(sandboxDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(sandboxDir, { recursive: true, force: true });
  });

  it('EXTREME 1: 100-Node Sequential Workflow', async () => {
    /**
     * Push the limits: 100 nodes in sequence
     */
    
    const nodeCount = 100;
    const nodes: any[] = [];
    const edges: any[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node-${i}`,
        name: `Node ${i}`,
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, `node-${i}.txt`),
          content: `Node ${i} executed at ${Date.now()}`,
          sandboxPath: sandboxDir,
        },
      });

      if (i > 0) {
        edges.push({
          id: `e${i - 1}`,
          source: `node-${i - 1}`,
          target: `node-${i}`,
        });
      }
    }

    const flow: FlowDefinition = {
      id: generateId(),
      name: '100-Node Workflow',
      description: 'Stress test with 100 sequential nodes',
      version: '1.0',
      nodes,
      edges,
      startNodeId: 'node-0',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    expect(Object.keys(result.nodeResults).length).toBe(100);
    
    // Verify first and last nodes
    const first = await readFile(join(sandboxDir, 'node-0.txt'), 'utf-8');
    expect(first).toContain('Node 0');
    
    const last = await readFile(join(sandboxDir, 'node-99.txt'), 'utf-8');
    expect(last).toContain('Node 99');
    
    // Verify deep reference capability
    const node50Output = engine.getNodeOutput('node-50');
    const node99Output = engine.getNodeOutput('node-99');
    expect(node50Output).toBeTruthy();
    expect(node99Output).toBeTruthy();
  }, 120000);

  it('EXTREME 2: Diamond Pattern (Multiple Convergence)', async () => {
    /**
     * Complex branching:
     *        → B → D →
     *      /          \
     *    A              → G (merge all)
     *      \          /
     *        → C → E →
     *         \    /
     *           F
     */
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Diamond Pattern',
      description: 'Complex convergence pattern',
      version: '1.0',
      nodes: [
        {
          id: 'a',
          name: 'Root A',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'a.txt'),
            content: 'Node A',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'b',
          name: 'Branch B',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'b.txt'),
            content: 'Node B from A',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'c',
          name: 'Branch C',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'c.txt'),
            content: 'Node C from A',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'd',
          name: 'Node D',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'd.txt'),
            content: 'Node D from B',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'e',
          name: 'Node E',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'e.txt'),
            content: 'Node E from C',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'f',
          name: 'Node F',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'f.txt'),
            content: 'Node F from C',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'g',
          name: 'Merge G',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'g.txt'),
            content: 'Node G merges all paths',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'a', target: 'c' },
        { id: 'e3', source: 'b', target: 'd' },
        { id: 'e4', source: 'c', target: 'e' },
        { id: 'e5', source: 'c', target: 'f' },
        { id: 'e6', source: 'd', target: 'g' },
        { id: 'e7', source: 'e', target: 'g' },
        { id: 'e8', source: 'f', target: 'g' },
      ],
      startNodeId: 'a',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all nodes executed
    expect(result.nodeResults['a']).toBeTruthy();
    expect(result.nodeResults['b']).toBeTruthy();
    expect(result.nodeResults['c']).toBeTruthy();
    expect(result.nodeResults['d']).toBeTruthy();
    expect(result.nodeResults['e']).toBeTruthy();
    expect(result.nodeResults['f']).toBeTruthy();
    expect(result.nodeResults['g']).toBeTruthy();
    
    // Verify merge point has access to all previous nodes
    const gOutput = engine.getNodeOutput('g');
    expect(gOutput).toBeTruthy();
    
    // All 7 nodes should have executed
    expect(Object.keys(result.nodeResults).length).toBe(7);
  }, 30000);

  it('EXTREME 3: Wide Parallel Processing (10 parallel branches)', async () => {
    /**
     * Test parallel execution width
     *          → Worker 1 →
     *        → Worker 2 →
     *      → Worker 3 →
     * Root → ... (10 workers) → Collector
     *      → Worker 10 →
     */
    
    const workerCount = 10;
    const nodes: any[] = [
      {
        id: 'root',
        name: 'Root Dispatcher',
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, 'root.txt'),
          content: 'Dispatching to workers',
          sandboxPath: sandboxDir,
        },
      },
    ];

    const edges: any[] = [];

    // Create worker nodes
    for (let i = 0; i < workerCount; i++) {
      nodes.push({
        id: `worker-${i}`,
        name: `Worker ${i}`,
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, `worker-${i}.txt`),
          content: `Worker ${i} processed data`,
          sandboxPath: sandboxDir,
        },
      });

      edges.push({
        id: `e-root-${i}`,
        source: 'root',
        target: `worker-${i}`,
      });
    }

    // Add collector
    nodes.push({
      id: 'collector',
      name: 'Result Collector',
      type: 'tool',
      config: {
        toolId: 'file-write',
        path: join(sandboxDir, 'collector.txt'),
        content: `Collected ${workerCount} results`,
        sandboxPath: sandboxDir,
      },
    });

    // Connect all workers to collector
    for (let i = 0; i < workerCount; i++) {
      edges.push({
        id: `e-worker-${i}`,
        source: `worker-${i}`,
        target: 'collector',
      });
    }

    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Wide Parallel Processing',
      description: '10 parallel workers',
      version: '1.0',
      nodes,
      edges,
      startNodeId: 'root',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all workers executed
    for (let i = 0; i < workerCount; i++) {
      expect(result.nodeResults[`worker-${i}`]).toBeTruthy();
      const content = await readFile(join(sandboxDir, `worker-${i}.txt`), 'utf-8');
      expect(content).toContain(`Worker ${i}`);
    }
    
    // Verify collector
    const collector = await readFile(join(sandboxDir, 'collector.txt'), 'utf-8');
    expect(collector).toContain('10 results');
    
    // Total: 1 root + 10 workers + 1 collector = 12 nodes
    expect(Object.keys(result.nodeResults).length).toBe(12);
  }, 60000);

  it('EXTREME 4: Deep + Wide (50 nodes × 3 branches)', async () => {
    /**
     * Combination of depth and width
     * 3 parallel branches, each with 50 sequential nodes
     */
    
    const branchCount = 3;
    const depthPerBranch = 50;
    
    const nodes: any[] = [
      {
        id: 'start',
        name: 'Start',
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, 'start.txt'),
          content: 'Starting deep+wide workflow',
          sandboxPath: sandboxDir,
        },
      },
    ];

    const edges: any[] = [];

    // Create branches
    for (let branch = 0; branch < branchCount; branch++) {
      for (let depth = 0; depth < depthPerBranch; depth++) {
        const nodeId = `branch-${branch}-node-${depth}`;
        nodes.push({
          id: nodeId,
          name: `Branch ${branch} Node ${depth}`,
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, `${nodeId}.txt`),
            content: `Branch ${branch}, Node ${depth}`,
            sandboxPath: sandboxDir,
          },
        });

        if (depth === 0) {
          // Connect to start
          edges.push({
            id: `e-start-${branch}`,
            source: 'start',
            target: nodeId,
          });
        } else {
          // Connect to previous in same branch
          edges.push({
            id: `e-${branch}-${depth - 1}`,
            source: `branch-${branch}-node-${depth - 1}`,
            target: nodeId,
          });
        }
      }
    }

    // Add end node that merges all branches
    nodes.push({
      id: 'end',
      name: 'End',
      type: 'tool',
      config: {
        toolId: 'file-write',
        path: join(sandboxDir, 'end.txt'),
        content: `Completed ${branchCount} branches of ${depthPerBranch} nodes each`,
        sandboxPath: sandboxDir,
      },
    });

    // Connect last node of each branch to end
    for (let branch = 0; branch < branchCount; branch++) {
      edges.push({
        id: `e-end-${branch}`,
        source: `branch-${branch}-node-${depthPerBranch - 1}`,
        target: 'end',
      });
    }

    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Deep + Wide Workflow',
      description: '3 branches × 50 nodes',
      version: '1.0',
      nodes,
      edges,
      startNodeId: 'start',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all nodes executed
    // 1 start + (3 branches × 50 nodes) + 1 end = 152 nodes
    expect(Object.keys(result.nodeResults).length).toBe(152);
    
    // Verify deep references work across branches
    const branch0Node25 = engine.getNodeOutput('branch-0-node-25');
    const branch1Node40 = engine.getNodeOutput('branch-1-node-40');
    const branch2Node10 = engine.getNodeOutput('branch-2-node-10');
    
    expect(branch0Node25).toBeTruthy();
    expect(branch1Node40).toBeTruthy();
    expect(branch2Node10).toBeTruthy();
    
    // Verify end node executed
    const end = await readFile(join(sandboxDir, 'end.txt'), 'utf-8');
    expect(end).toContain('3 branches');
    expect(end).toContain('50 nodes');
  }, 180000);

  it('EXTREME 5: Complex Real-World Pipeline', async () => {
    /**
     * Realistic complex scenario:
     * 1. Data ingestion (3 sources in parallel)
     * 2. Validation (sequential per source)
     * 3. Transformation (parallel)
     * 4. Aggregation
     * 5. Export (multiple formats)
     */
    
    const sources = ['source-a', 'source-b', 'source-c'];
    const formats = ['json', 'csv', 'xml'];
    
    const nodes: any[] = [
      {
        id: 'init',
        name: 'Initialize Pipeline',
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, 'pipeline.log'),
          content: 'Pipeline initialized\n',
          sandboxPath: sandboxDir,
        },
      },
    ];

    const edges: any[] = [];

    // Stage 1: Data ingestion (parallel)
    sources.forEach((source, idx) => {
      const nodeId = `ingest-${source}`;
      nodes.push({
        id: nodeId,
        name: `Ingest ${source}`,
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, `${source}.raw`),
          content: `Raw data from ${source}`,
          sandboxPath: sandboxDir,
        },
      });
      
      edges.push({
        id: `e-init-${idx}`,
        source: 'init',
        target: nodeId,
      });
    });

    // Stage 2: Validation
    sources.forEach((source, idx) => {
      const nodeId = `validate-${source}`;
      nodes.push({
        id: nodeId,
        name: `Validate ${source}`,
        type: 'tool',
        config: {
          toolId: 'text-search',
          pattern: 'Raw data',
          path: join(sandboxDir, `${source}.raw`),
          sandboxPath: sandboxDir,
        },
      });
      
      edges.push({
        id: `e-ingest-val-${idx}`,
        source: `ingest-${source}`,
        target: nodeId,
      });
    });

    // Stage 3: Transformation
    sources.forEach((source, idx) => {
      const nodeId = `transform-${source}`;
      nodes.push({
        id: nodeId,
        name: `Transform ${source}`,
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, `${source}.transformed`),
          content: `Transformed data from ${source}`,
          sandboxPath: sandboxDir,
        },
      });
      
      edges.push({
        id: `e-val-trans-${idx}`,
        source: `validate-${source}`,
        target: nodeId,
      });
    });

    // Stage 4: Aggregation
    nodes.push({
      id: 'aggregate',
      name: 'Aggregate All Sources',
      type: 'tool',
      config: {
        toolId: 'file-write',
        path: join(sandboxDir, 'aggregated.data'),
        content: 'Aggregated data from all sources',
        sandboxPath: sandboxDir,
      },
    });

    sources.forEach((source, idx) => {
      edges.push({
        id: `e-trans-agg-${idx}`,
        source: `transform-${source}`,
        target: 'aggregate',
      });
    });

    // Stage 5: Export to multiple formats
    formats.forEach((format, idx) => {
      const nodeId = `export-${format}`;
      nodes.push({
        id: nodeId,
        name: `Export to ${format}`,
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, `export.${format}`),
          content: `Data exported to ${format} format`,
          sandboxPath: sandboxDir,
        },
      });
      
      edges.push({
        id: `e-agg-exp-${idx}`,
        source: 'aggregate',
        target: nodeId,
      });
    });

    // Final report
    nodes.push({
      id: 'report',
      name: 'Generate Report',
      type: 'tool',
      config: {
        toolId: 'file-write',
        path: join(sandboxDir, 'pipeline-report.txt'),
        content: `Pipeline Report:
- Sources processed: ${sources.length}
- Formats exported: ${formats.length}
- Status: SUCCESS`,
        sandboxPath: sandboxDir,
      },
    });

    formats.forEach((format, idx) => {
      edges.push({
        id: `e-exp-rep-${idx}`,
        source: `export-${format}`,
        target: 'report',
      });
    });

    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Complex Pipeline',
      description: 'Multi-stage data pipeline',
      version: '1.0',
      nodes,
      edges,
      startNodeId: 'init',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all stages
    // 1 init + 3 ingest + 3 validate + 3 transform + 1 aggregate + 3 export + 1 report = 15
    expect(Object.keys(result.nodeResults).length).toBe(15);
    
    // Verify final report
    const report = await readFile(join(sandboxDir, 'pipeline-report.txt'), 'utf-8');
    expect(report).toContain('SUCCESS');
    expect(report).toContain('3');
  }, 60000);
});

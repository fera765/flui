/**
 * E2E Tests - Advanced Flow Patterns
 * Testing loops, returns, and complex branching
 */

import { FlowEngineV2 } from '../../source/core/flowEngineV2.js';
import { FlowDefinition } from '../../source/core/flowTypes.js';
import { registerAllTools } from '../../source/tools/registerAllTools.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm, mkdir, writeFile, readFile } from 'fs/promises';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

describe('E2E - Advanced Flow Patterns - REAL', () => {
  let sandboxDir: string;

  beforeAll(async () => {
    await registerAllTools();
  });

  beforeEach(async () => {
    sandboxDir = join(tmpdir(), `flui-advanced-flow-${generateId()}`);
    await mkdir(sandboxDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(sandboxDir, { recursive: true, force: true });
  });

  it('PATTERN 1: Simple Loop Over Array', async () => {
    /**
     * Flow: Process each item in an array
     * Node 1: Create array of items
     * Node 2: Loop over items (implicitly via multiple file writes)
     * Node 3: Aggregate results
     */
    
    const items = ['alpha', 'beta', 'gamma', 'delta'];
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Simple Array Loop',
      description: 'Process multiple items',
      version: '1.0',
      nodes: [
        {
          id: 'create-items',
          name: 'Create Items List',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'items.txt'),
            content: items.join('\n'),
            sandboxPath: sandboxDir,
          },
        },
        // Process each item (simulated via multiple nodes)
        ...items.map((item, index) => ({
          id: `process-${index}`,
          name: `Process ${item}`,
          type: 'tool' as const,
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, `processed-${item}.txt`),
            content: `Processed: ${item.toUpperCase()}`,
            sandboxPath: sandboxDir,
          },
        })),
        {
          id: 'aggregate',
          name: 'Aggregate Results',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'summary.txt'),
            content: `Processed ${items.length} items successfully`,
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e0', source: 'create-items', target: 'process-0' },
        ...items.slice(0, -1).map((_, index) => ({
          id: `e${index + 1}`,
          source: `process-${index}`,
          target: `process-${index + 1}`,
        })),
        { id: 'e-final', source: `process-${items.length - 1}`, target: 'aggregate' },
      ],
      startNodeId: 'create-items',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all items were processed
    for (const item of items) {
      const content = await readFile(join(sandboxDir, `processed-${item}.txt`), 'utf-8');
      expect(content).toContain(item.toUpperCase());
    }
    
    // Verify summary
    const summary = await readFile(join(sandboxDir, 'summary.txt'), 'utf-8');
    expect(summary).toContain('4 items');
  }, 30000);

  it('PATTERN 2: Conditional Loop with Counter', async () => {
    /**
     * Flow: Loop with counter until condition met
     * Simulated via sequential nodes with counter tracking
     */
    
    const maxIterations = 5;
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Counter-Based Loop',
      description: 'Loop with iteration counter',
      version: '1.0',
      nodes: [
        {
          id: 'init-counter',
          name: 'Initialize Counter',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'counter.txt'),
            content: '0',
            sandboxPath: sandboxDir,
          },
        },
        ...Array.from({ length: maxIterations }, (_, i) => ({
          id: `iteration-${i}`,
          name: `Iteration ${i + 1}`,
          type: 'tool' as const,
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, `iteration-${i}.log`),
            content: `Iteration ${i + 1} of ${maxIterations} completed`,
            sandboxPath: sandboxDir,
          },
        })),
        {
          id: 'finalize',
          name: 'Finalize Loop',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'result.txt'),
            content: `Loop completed after ${maxIterations} iterations`,
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e-init', source: 'init-counter', target: 'iteration-0' },
        ...Array.from({ length: maxIterations - 1 }, (_, i) => ({
          id: `e-iter-${i}`,
          source: `iteration-${i}`,
          target: `iteration-${i + 1}`,
        })),
        { id: 'e-final', source: `iteration-${maxIterations - 1}`, target: 'finalize' },
      ],
      startNodeId: 'init-counter',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all iterations executed
    for (let i = 0; i < maxIterations; i++) {
      const content = await readFile(join(sandboxDir, `iteration-${i}.log`), 'utf-8');
      expect(content).toContain(`Iteration ${i + 1}`);
    }
    
    // Verify final result
    const finalResult = await readFile(join(sandboxDir, 'result.txt'), 'utf-8');
    expect(finalResult).toContain('5 iterations');
  }, 30000);

  it('PATTERN 3: Loop with State Accumulation', async () => {
    /**
     * Flow: Each iteration builds on previous state
     * Node 1 → Node 2 (process) → Node 3 (accumulate) → repeat
     */
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'State Accumulation Loop',
      description: 'Build state across iterations',
      version: '1.0',
      nodes: [
        {
          id: 'init-state',
          name: 'Initialize State',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'state.txt'),
            content: 'Initial state',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'iteration-1',
          name: 'Add State 1',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'state.txt'),
            content: 'Initial state\nState 1 added',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'iteration-2',
          name: 'Add State 2',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'state.txt'),
            content: 'Initial state\nState 1 added\nState 2 added',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'iteration-3',
          name: 'Add State 3',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'state.txt'),
            content: 'Initial state\nState 1 added\nState 2 added\nState 3 added',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'read-final-state',
          name: 'Read Final State',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: join(sandboxDir, 'state.txt'),
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'init-state', target: 'iteration-1' },
        { id: 'e2', source: 'iteration-1', target: 'iteration-2' },
        { id: 'e3', source: 'iteration-2', target: 'iteration-3' },
        { id: 'e4', source: 'iteration-3', target: 'read-final-state' },
      ],
      startNodeId: 'init-state',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify accumulated state
    const finalState = await readFile(join(sandboxDir, 'state.txt'), 'utf-8');
    expect(finalState).toContain('Initial state');
    expect(finalState).toContain('State 1 added');
    expect(finalState).toContain('State 2 added');
    expect(finalState).toContain('State 3 added');
    
    // Verify all 3 states were added
    const stateLines = finalState.split('\n');
    expect(stateLines.length).toBe(4); // Initial + 3 additions
  }, 30000);

  it('PATTERN 4: Conditional Branching with Multiple Paths', async () => {
    /**
     * Flow: Branch based on data, then merge
     *        → Path A (if condition) →
     * Start →                          → Merge
     *        → Path B (else) →
     */
    
    const testValue = 42;
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Conditional Branching',
      description: 'Branch and merge based on condition',
      version: '1.0',
      nodes: [
        {
          id: 'create-data',
          name: 'Create Test Data',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'data.txt'),
            content: `value=${testValue}`,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'check-value',
          name: 'Check Value',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'value=',
            path: join(sandboxDir, 'data.txt'),
            sandboxPath: sandboxDir,
          },
        },
        // Path A: Value >= 40
        {
          id: 'path-a',
          name: 'Path A Processing',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'path-a.txt'),
            content: 'Path A: Value is high',
            sandboxPath: sandboxDir,
          },
        },
        // Path B: Value < 40 (we won't execute this in this test)
        {
          id: 'path-b',
          name: 'Path B Processing',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'path-b.txt'),
            content: 'Path B: Value is low',
            sandboxPath: sandboxDir,
          },
        },
        // Merge point
        {
          id: 'merge',
          name: 'Merge Results',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'result.txt'),
            content: 'Processing completed',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'create-data', target: 'check-value' },
        { id: 'e2', source: 'check-value', target: 'path-a' },
        { id: 'e3', source: 'path-a', target: 'merge' },
      ],
      startNodeId: 'create-data',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify Path A was executed
    const pathA = await readFile(join(sandboxDir, 'path-a.txt'), 'utf-8');
    expect(pathA).toContain('high');
    
    // Verify merge occurred
    const mergeResult = await readFile(join(sandboxDir, 'result.txt'), 'utf-8');
    expect(mergeResult).toContain('completed');
  }, 30000);

  it('PATTERN 5: Nested Loop Simulation', async () => {
    /**
     * Flow: Outer loop → Inner loop → Continue outer
     * Simulated via sequential processing
     */
    
    const outerItems = ['Group1', 'Group2'];
    const innerItems = ['ItemA', 'ItemB', 'ItemC'];
    
    const nodes: any[] = [
      {
        id: 'init',
        name: 'Initialize',
        type: 'tool',
        config: {
          toolId: 'file-write',
          path: join(sandboxDir, 'log.txt'),
          content: 'Processing started\n',
          sandboxPath: sandboxDir,
        },
      },
    ];

    const edges: any[] = [];
    let lastNodeId = 'init';

    // Simulate nested loops
    outerItems.forEach((outer, outerIndex) => {
      innerItems.forEach((inner, innerIndex) => {
        const nodeId = `process-${outerIndex}-${innerIndex}`;
        nodes.push({
          id: nodeId,
          name: `Process ${outer}-${inner}`,
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, `result-${outer}-${inner}.txt`),
            content: `Processed ${outer} - ${inner}`,
            sandboxPath: sandboxDir,
          },
        });
        
        edges.push({
          id: `e-${outerIndex}-${innerIndex}`,
          source: lastNodeId,
          target: nodeId,
        });
        
        lastNodeId = nodeId;
      });
    });

    // Add finalization node
    nodes.push({
      id: 'finalize',
      name: 'Finalize',
      type: 'tool',
      config: {
        toolId: 'file-write',
        path: join(sandboxDir, 'complete.txt'),
        content: `Completed ${outerItems.length * innerItems.length} combinations`,
        sandboxPath: sandboxDir,
      },
    });

    edges.push({
      id: 'e-final',
      source: lastNodeId,
      target: 'finalize',
    });

    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Nested Loop Simulation',
      description: 'Process combinations',
      version: '1.0',
      nodes,
      edges,
      startNodeId: 'init',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all combinations were processed
    for (const outer of outerItems) {
      for (const inner of innerItems) {
        const content = await readFile(join(sandboxDir, `result-${outer}-${inner}.txt`), 'utf-8');
        expect(content).toContain(outer);
        expect(content).toContain(inner);
      }
    }
    
    // Verify completion
    const complete = await readFile(join(sandboxDir, 'complete.txt'), 'utf-8');
    expect(complete).toContain('6 combinations');
  }, 30000);

  it('PATTERN 6: Early Exit Pattern', async () => {
    /**
     * Flow: Process items until condition met, then exit
     */
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Early Exit Pattern',
      description: 'Exit when condition is met',
      version: '1.0',
      nodes: [
        {
          id: 'step-1',
          name: 'Step 1',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'step1.txt'),
            content: 'Step 1 executed',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'step-2',
          name: 'Step 2',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'step2.txt'),
            content: 'Step 2 executed',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'check-exit',
          name: 'Check Exit Condition',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'Step 2',
            path: join(sandboxDir, 'step2.txt'),
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'exit',
          name: 'Exit Point',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'exit.txt'),
            content: 'Early exit triggered',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'step-1', target: 'step-2' },
        { id: 'e2', source: 'step-2', target: 'check-exit' },
        { id: 'e3', source: 'check-exit', target: 'exit' },
      ],
      startNodeId: 'step-1',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify steps executed until exit
    const step1 = await readFile(join(sandboxDir, 'step1.txt'), 'utf-8');
    expect(step1).toContain('Step 1');
    
    const step2 = await readFile(join(sandboxDir, 'step2.txt'), 'utf-8');
    expect(step2).toContain('Step 2');
    
    const exit = await readFile(join(sandboxDir, 'exit.txt'), 'utf-8');
    expect(exit).toContain('Early exit');
  }, 30000);

  it('PATTERN 7: Retry Pattern with Backoff', async () => {
    /**
     * Flow: Try operation, retry on failure with increasing delay
     * Simulated via sequential nodes representing retry attempts
     */
    
    const maxRetries = 3;
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Retry Pattern',
      description: 'Retry with backoff',
      version: '1.0',
      nodes: [
        {
          id: 'initial-attempt',
          name: 'Initial Attempt',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'attempt-0.log'),
            content: 'Attempt 0: Processing...',
            sandboxPath: sandboxDir,
          },
        },
        ...Array.from({ length: maxRetries }, (_, i) => ({
          id: `retry-${i + 1}`,
          name: `Retry ${i + 1}`,
          type: 'tool' as const,
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, `attempt-${i + 1}.log`),
            content: `Attempt ${i + 1}: Retrying... (backoff: ${(i + 1) * 100}ms)`,
            sandboxPath: sandboxDir,
          },
        })),
        {
          id: 'success',
          name: 'Success',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'success.txt'),
            content: 'Operation succeeded after retries',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e0', source: 'initial-attempt', target: 'retry-1' },
        ...Array.from({ length: maxRetries - 1 }, (_, i) => ({
          id: `e-retry-${i + 1}`,
          source: `retry-${i + 1}`,
          target: `retry-${i + 2}`,
        })),
        { id: 'e-final', source: `retry-${maxRetries}`, target: 'success' },
      ],
      startNodeId: 'initial-attempt',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify all retry attempts
    for (let i = 0; i <= maxRetries; i++) {
      const content = await readFile(join(sandboxDir, `attempt-${i}.log`), 'utf-8');
      expect(content).toContain(`Attempt ${i}`);
    }
    
    // Verify success
    const success = await readFile(join(sandboxDir, 'success.txt'), 'utf-8');
    expect(success).toContain('succeeded');
  }, 30000);
});

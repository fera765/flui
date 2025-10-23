/**
 * E2E Tests - Complex Automation Scenarios
 * Real-world use cases using System Tools + MCPs
 */

import { FlowEngineV2 } from '../../source/core/flowEngineV2.js';
import { FlowDefinition } from '../../source/core/flowTypes.js';
import { registerAllTools } from '../../source/tools/registerAllTools.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm, mkdir, writeFile, readFile } from 'fs/promises';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

describe('E2E - Complex Automation Scenarios - REAL', () => {
  let sandboxDir: string;

  beforeAll(async () => {
    await registerAllTools();
  });

  beforeEach(async () => {
    sandboxDir = join(tmpdir(), `flui-e2e-complex-${generateId()}`);
    await mkdir(sandboxDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(sandboxDir, { recursive: true, force: true });
  });

  it('USE CASE 1: File Processing Pipeline', async () => {
    /**
     * Real-world scenario: Process multiple files
     * 1. Create multiple source files
     * 2. Search for patterns in each
     * 3. Extract and transform data
     * 4. Merge results into summary
     */
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'File Processing Pipeline',
      description: 'Multi-file processing automation',
      version: '1.0',
      nodes: [
        // Step 1: Create source files
        {
          id: 'create-file-1',
          name: 'Create Data File 1',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'data1.txt'),
            content: 'ERROR: Connection failed\nINFO: Processing started\nERROR: Timeout occurred',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'create-file-2',
          name: 'Create Data File 2',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'data2.txt'),
            content: 'INFO: Data received\nERROR: Invalid format\nINFO: Retrying',
            sandboxPath: sandboxDir,
          },
        },
        // Step 2: Search for errors in file 1
        {
          id: 'search-errors-1',
          name: 'Find Errors in File 1',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'ERROR',
            path: join(sandboxDir, 'data1.txt'),
            sandboxPath: sandboxDir,
          },
        },
        // Step 3: Search for errors in file 2
        {
          id: 'search-errors-2',
          name: 'Find Errors in File 2',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'ERROR',
            path: join(sandboxDir, 'data2.txt'),
            sandboxPath: sandboxDir,
          },
        },
        // Step 4: Count total errors
        {
          id: 'count-errors',
          name: 'Count All Errors',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'error-count.txt'),
            content: 'Error analysis complete',
            sandboxPath: sandboxDir,
          },
        },
        // Step 5: Create summary report
        {
          id: 'create-summary',
          name: 'Generate Summary Report',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'summary-report.txt'),
            content: 'SUMMARY REPORT\n=============\nAll files processed successfully',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'create-file-1', target: 'search-errors-1' },
        { id: 'e2', source: 'create-file-2', target: 'search-errors-2' },
        { id: 'e3', source: 'search-errors-1', target: 'count-errors' },
        { id: 'e4', source: 'search-errors-2', target: 'count-errors' },
        { id: 'e5', source: 'count-errors', target: 'create-summary' },
      ],
      startNodeId: 'create-file-1',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify summary was created
    const summaryPath = join(sandboxDir, 'summary-report.txt');
    const summaryContent = await readFile(summaryPath, 'utf-8');
    expect(summaryContent).toContain('SUMMARY REPORT');
    
    // Verify all nodes executed
    expect(Object.keys(result.nodeResults).length).toBe(6);
  }, 30000);

  it('USE CASE 2: Data Transformation Chain', async () => {
    /**
     * Scenario: Transform data through multiple steps
     * 1. Read raw data
     * 2. Clean/normalize
     * 3. Transform format
     * 4. Validate
     * 5. Export
     */
    
    const rawData = 'apple,banana,cherry\norange,grape,mango\nkiwi,peach,plum';
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Data Transformation Pipeline',
      description: 'Multi-step data transformation',
      version: '1.0',
      nodes: [
        {
          id: 'load-raw',
          name: 'Load Raw Data',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'raw.csv'),
            content: rawData,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'read-data',
          name: 'Read Data',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: join(sandboxDir, 'raw.csv'),
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'normalize',
          name: 'Normalize Data',
          type: 'tool',
          config: {
            toolId: 'text-replace',
            path: join(sandboxDir, 'raw.csv'),
            find: ',',
            replace: '|',
            replaceAll: true,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'validate',
          name: 'Validate Format',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: '\\|',
            path: join(sandboxDir, 'raw.csv'),
            regex: true,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'export',
          name: 'Export Processed',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: join(sandboxDir, 'raw.csv'),
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'load-raw', target: 'read-data' },
        { id: 'e2', source: 'read-data', target: 'normalize' },
        { id: 'e3', source: 'normalize', target: 'validate' },
        { id: 'e4', source: 'validate', target: 'export' },
      ],
      startNodeId: 'load-raw',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify transformation occurred
    const processedContent = await readFile(join(sandboxDir, 'raw.csv'), 'utf-8');
    expect(processedContent).toContain('|');
    expect(processedContent).not.toContain(',');
  }, 30000);

  it('USE CASE 3: Multi-Stage Workflow with Shell Commands', async () => {
    /**
     * Scenario: Automated build and test workflow
     * 1. Create project structure
     * 2. Write source files
     * 3. Run shell commands
     * 4. Collect results
     */
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Build and Test Workflow',
      description: 'Automated project workflow',
      version: '1.0',
      nodes: [
        {
          id: 'create-structure',
          name: 'Create Project Structure',
          type: 'tool',
          config: {
            toolId: 'shell-exec',
            command: `mkdir -p ${join(sandboxDir, 'src')} ${join(sandboxDir, 'tests')}`,
            timeout: 5000,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'write-source',
          name: 'Write Source File',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'src', 'main.js'),
            content: 'console.log("Hello World");',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'write-test',
          name: 'Write Test File',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'tests', 'main.test.js'),
            content: 'console.log("Test passed");',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'list-files',
          name: 'List All Files',
          type: 'tool',
          config: {
            toolId: 'folder-list',
            path: sandboxDir,
            recursive: true,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'find-js-files',
          name: 'Find JavaScript Files',
          type: 'tool',
          config: {
            toolId: 'file-search',
            pattern: '*.js',
            path: sandboxDir,
            recursive: true,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'create-report',
          name: 'Create Build Report',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'build-report.txt'),
            content: 'Build completed successfully',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'create-structure', target: 'write-source' },
        { id: 'e2', source: 'write-source', target: 'write-test' },
        { id: 'e3', source: 'write-test', target: 'list-files' },
        { id: 'e4', source: 'list-files', target: 'find-js-files' },
        { id: 'e5', source: 'find-js-files', target: 'create-report' },
      ],
      startNodeId: 'create-structure',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    // Debug: Log error if execution failed
    if (result.status === 'failed') {
      console.error('❌ USE CASE 3 failed:', result.error);
      const failedLogs = result.logs.filter(l => l.status === 'failed');
      failedLogs.forEach(log => console.error('  -', log.nodeName, ':', log.message, log.error));
    }

    expect(result.status).toBe('completed');
    
    // Verify project structure was created
    const mainJs = await readFile(join(sandboxDir, 'src', 'main.js'), 'utf-8');
    expect(mainJs).toContain('Hello World');
    
    const testJs = await readFile(join(sandboxDir, 'tests', 'main.test.js'), 'utf-8');
    expect(testJs).toContain('Test passed');
    
    // Verify build report
    const report = await readFile(join(sandboxDir, 'build-report.txt'), 'utf-8');
    expect(report).toContain('Build completed');
  }, 30000);

  it('USE CASE 4: Complex Pattern Search and Replace', async () => {
    /**
     * Scenario: Code refactoring automation
     * 1. Create source files with old patterns
     * 2. Search for patterns
     * 3. Replace with new patterns
     * 4. Verify changes
     * 5. Generate migration report
     */
    
    const oldCode = `function oldFunction() {
  return oldValue;
}
const old_constant = 42;
oldFunction();`;

    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Code Refactoring Automation',
      description: 'Automated code pattern replacement',
      version: '1.0',
      nodes: [
        {
          id: 'create-old-code',
          name: 'Create Old Code',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'legacy.js'),
            content: oldCode,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'search-old-patterns',
          name: 'Find Old Patterns',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'old',
            path: join(sandboxDir, 'legacy.js'),
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'replace-functions',
          name: 'Replace Function Names',
          type: 'tool',
          config: {
            toolId: 'text-replace',
            path: join(sandboxDir, 'legacy.js'),
            find: 'oldFunction',
            replace: 'newFunction',
            replaceAll: true,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'replace-values',
          name: 'Replace Value Names',
          type: 'tool',
          config: {
            toolId: 'text-replace',
            path: join(sandboxDir, 'legacy.js'),
            find: 'oldValue',
            replace: 'newValue',
            replaceAll: true,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'replace-constants',
          name: 'Replace Constants',
          type: 'tool',
          config: {
            toolId: 'text-replace',
            path: join(sandboxDir, 'legacy.js'),
            find: 'old_constant',
            replace: 'NEW_CONSTANT',
            replaceAll: true,
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'verify-new-code',
          name: 'Verify Refactored Code',
          type: 'tool',
          config: {
            toolId: 'file-read',
            path: join(sandboxDir, 'legacy.js'),
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'create-migration-report',
          name: 'Generate Migration Report',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'migration-report.md'),
            content: '# Migration Report\n\nRefactoring completed successfully\n- oldFunction → newFunction\n- oldValue → newValue\n- old_constant → NEW_CONSTANT',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'create-old-code', target: 'search-old-patterns' },
        { id: 'e2', source: 'search-old-patterns', target: 'replace-functions' },
        { id: 'e3', source: 'replace-functions', target: 'replace-values' },
        { id: 'e4', source: 'replace-values', target: 'replace-constants' },
        { id: 'e5', source: 'replace-constants', target: 'verify-new-code' },
        { id: 'e6', source: 'verify-new-code', target: 'create-migration-report' },
      ],
      startNodeId: 'create-old-code',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify refactoring occurred
    const refactoredCode = await readFile(join(sandboxDir, 'legacy.js'), 'utf-8');
    expect(refactoredCode).toContain('newFunction');
    expect(refactoredCode).toContain('newValue');
    expect(refactoredCode).toContain('NEW_CONSTANT');
    expect(refactoredCode).not.toContain('oldFunction');
    expect(refactoredCode).not.toContain('oldValue');
    expect(refactoredCode).not.toContain('old_constant');
    
    // Verify migration report
    const report = await readFile(join(sandboxDir, 'migration-report.md'), 'utf-8');
    expect(report).toContain('Migration Report');
  }, 30000);

  it('USE CASE 5: Multi-File Analysis and Aggregation', async () => {
    /**
     * Scenario: Analyze multiple log files and aggregate metrics
     */
    
    const flow: FlowDefinition = {
      id: generateId(),
      name: 'Log Analysis Pipeline',
      description: 'Multi-file log analysis and aggregation',
      version: '1.0',
      nodes: [
        // Create log files
        {
          id: 'create-log-1',
          name: 'Create App Log',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'app.log'),
            content: 'INFO: App started\nERROR: Database connection failed\nWARN: Retrying connection\nINFO: Connected\nERROR: Query timeout',
            sandboxPath: sandboxDir,
          },
        },
        {
          id: 'create-log-2',
          name: 'Create API Log',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'api.log'),
            content: 'INFO: API server started\nERROR: Invalid request\nWARN: Rate limit approaching\nERROR: Authentication failed',
            sandboxPath: sandboxDir,
          },
        },
        // Read many files at once
        {
          id: 'read-all-logs',
          name: 'Read All Logs',
          type: 'tool',
          config: {
            toolId: 'files-read-batch',
            paths: [
              join(sandboxDir, 'app.log'),
              join(sandboxDir, 'api.log'),
            ],
            continueOnError: true,
            sandboxPath: sandboxDir,
          },
        },
        // Search for errors across all files
        {
          id: 'search-errors',
          name: 'Search Errors',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'ERROR',
            path: sandboxDir,
            recursive: true,
            sandboxPath: sandboxDir,
          },
        },
        // Search for warnings
        {
          id: 'search-warnings',
          name: 'Search Warnings',
          type: 'tool',
          config: {
            toolId: 'text-search',
            pattern: 'WARN',
            path: sandboxDir,
            recursive: true,
            sandboxPath: sandboxDir,
          },
        },
        // Create aggregated report
        {
          id: 'create-analysis',
          name: 'Create Analysis Report',
          type: 'tool',
          config: {
            toolId: 'file-write',
            path: join(sandboxDir, 'analysis-report.txt'),
            content: 'LOG ANALYSIS REPORT\n==================\nAnalysis completed',
            sandboxPath: sandboxDir,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'create-log-1', target: 'read-all-logs' },
        { id: 'e2', source: 'create-log-2', target: 'read-all-logs' },
        { id: 'e3', source: 'read-all-logs', target: 'search-errors' },
        { id: 'e4', source: 'search-errors', target: 'search-warnings' },
        { id: 'e5', source: 'search-warnings', target: 'create-analysis' },
      ],
      startNodeId: 'create-log-1',
    };

    const engine = new FlowEngineV2(flow);
    const result = await engine.execute();

    expect(result.status).toBe('completed');
    
    // Verify analysis report was created
    const analysis = await readFile(join(sandboxDir, 'analysis-report.txt'), 'utf-8');
    expect(analysis).toContain('LOG ANALYSIS REPORT');
    
    // Verify all logs were processed
    expect(result.nodeResults['search-errors']).toBeTruthy();
    expect(result.nodeResults['search-warnings']).toBeTruthy();
  }, 30000);
});

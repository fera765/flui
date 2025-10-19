/**
 * FLUI Custom Nodes System Tests
 * 
 * Testes completos para o sistema de custom nodes:
 * - Criação de nodes
 * - Validação de pacotes
 * - Upload e instalação
 * - Versionamento
 * - Registry management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CustomNodeManager } from '../services/customNodeManager.js';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

describe('Custom Nodes System', () => {
  const testDir = join(process.cwd(), '.test-custom-nodes');
  let manager: CustomNodeManager;

  beforeAll(async () => {
    // Criar diretório de teste
    await mkdir(testDir, { recursive: true });
    
    // Inicializar manager
    manager = new CustomNodeManager(testDir);
    await manager.initialize();
  });

  afterAll(async () => {
    // Limpar
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Node Creation and Packaging', () => {
    it('deve criar um pacote válido de custom node', async () => {
      const nodeDir = join(testDir, 'test-node');
      const fingerprint = uuidv4();
      
      // Criar estrutura do node
      await mkdir(join(nodeDir, 'dist'), { recursive: true });
      
      // package.json
      const packageJson = {
        name: '@flui/node-test',
        version: '1.0.0',
        description: 'Test node',
        flui: {
          fingerprint,
        },
      };
      await writeFile(
        join(nodeDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // dist/index.js
      const nodeCode = `
export default {
  fingerprint: '${fingerprint}',
  id: 'test-node',
  name: 'Test Node',
  description: 'A test node',
  category: 'custom',
  version: '1.0.0',
  params: [
    {
      name: 'input',
      key: 'input',
      type: 'string',
      description: 'Input data',
      required: true,
      ui: {
        widgetType: 'textInput',
        placeholder: 'Enter input',
      },
    },
  ],
  output: {
    type: 'object',
    description: 'Output data',
  },
  execute: async (args) => {
    return { success: true, output: args.input.toUpperCase() };
  },
  ui: {
    icon: 'Box',
    color: '#3b82f6',
    tags: ['test'],
  },
  config: {
    timeout: 30000,
  },
};
`;
      await writeFile(join(nodeDir, 'dist', 'index.js'), nodeCode);
      
      // README.md
      await writeFile(
        join(nodeDir, 'README.md'),
        '# Test Node\n\nA test custom node.'
      );
      
      // Criar zip
      const zipPath = join(testDir, 'test-node.zip');
      await createZip(nodeDir, zipPath);
      
      // Validar
      const validation = await manager.validatePackage(zipPath);
      
      expect(validation.valid).toBe(true);
      expect(validation.metadata).toBeDefined();
      expect(validation.metadata?.fingerprint.uuid).toBe(fingerprint);
    }, 30000);

    it('deve rejeitar pacote sem fingerprint', async () => {
      const nodeDir = join(testDir, 'invalid-node');
      await mkdir(join(nodeDir, 'dist'), { recursive: true });
      
      const packageJson = {
        name: '@flui/node-invalid',
        version: '1.0.0',
        // sem flui.fingerprint
      };
      await writeFile(
        join(nodeDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      const nodeCode = `export default { id: 'test' };`;
      await writeFile(join(nodeDir, 'dist', 'index.js'), nodeCode);
      
      const zipPath = join(testDir, 'invalid-node.zip');
      await createZip(nodeDir, zipPath);
      
      const validation = await manager.validatePackage(zipPath);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors?.some(e => e.includes('fingerprint'))).toBe(true);
    }, 30000);
  });

  describe('Node Installation', () => {
    it('deve instalar um custom node com sucesso', async () => {
      const fingerprint = uuidv4();
      const zipPath = await createTestNode(testDir, fingerprint, '1.0.0');
      const checksum = await CustomNodeManager.calculateChecksum(zipPath);
      
      const result = await manager.installNode(zipPath, checksum);
      
      expect(result.success).toBe(true);
      expect(result.fingerprint).toBe(fingerprint);
      expect(result.isUpdate).toBe(false);
      expect(result.newVersion).toBe('1.0.0');
      
      // Verificar se está no registry
      const node = manager.getNode(fingerprint);
      expect(node).toBeDefined();
      expect(node?.metadata.version).toBe('1.0.0');
    }, 30000);

    it('deve atualizar um custom node existente', async () => {
      const fingerprint = uuidv4();
      
      // Instalar v1.0.0
      const zip1 = await createTestNode(testDir, fingerprint, '1.0.0');
      const checksum1 = await CustomNodeManager.calculateChecksum(zip1);
      await manager.installNode(zip1, checksum1);
      
      // Instalar v1.1.0
      const zip2 = await createTestNode(testDir, fingerprint, '1.1.0');
      const checksum2 = await CustomNodeManager.calculateChecksum(zip2);
      const result = await manager.installNode(zip2, checksum2);
      
      expect(result.success).toBe(true);
      expect(result.isUpdate).toBe(true);
      expect(result.previousVersion).toBe('1.0.0');
      expect(result.newVersion).toBe('1.1.0');
      
      // Verificar versões no registry
      const node = manager.getNode(fingerprint);
      expect(node?.versions).toHaveLength(2);
      expect(node?.metadata.version).toBe('1.1.0');
    }, 30000);

    it('deve rejeitar versão mais antiga', async () => {
      const fingerprint = uuidv4();
      
      // Instalar v2.0.0
      const zip1 = await createTestNode(testDir, fingerprint, '2.0.0');
      const checksum1 = await CustomNodeManager.calculateChecksum(zip1);
      await manager.installNode(zip1, checksum1);
      
      // Tentar instalar v1.0.0
      const zip2 = await createTestNode(testDir, fingerprint, '1.0.0');
      const checksum2 = await CustomNodeManager.calculateChecksum(zip2);
      const result = await manager.installNode(zip2, checksum2);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    }, 30000);
  });

  describe('Node Registry', () => {
    it('deve listar todos os nodes instalados', async () => {
      const nodes = manager.listNodes();
      expect(Array.isArray(nodes)).toBe(true);
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('deve obter node por fingerprint', async () => {
      const nodes = manager.listNodes();
      const firstNode = nodes[0];
      
      const node = manager.getNode(firstNode.fingerprint);
      expect(node).toBeDefined();
      expect(node?.fingerprint).toBe(firstNode.fingerprint);
    });

    it('deve remover node do registry', async () => {
      const fingerprint = uuidv4();
      const zipPath = await createTestNode(testDir, fingerprint, '1.0.0');
      const checksum = await CustomNodeManager.calculateChecksum(zipPath);
      
      await manager.installNode(zipPath, checksum);
      
      const removed = await manager.removeNode(fingerprint);
      expect(removed).toBe(true);
      
      const node = manager.getNode(fingerprint);
      expect(node).toBeUndefined();
    }, 30000);
  });

  describe('Versioning', () => {
    it('deve manter histórico de versões', async () => {
      const fingerprint = uuidv4();
      
      // Instalar v1.0.0, v1.1.0, v2.0.0
      for (const version of ['1.0.0', '1.1.0', '2.0.0']) {
        const zipPath = await createTestNode(testDir, fingerprint, version);
        const checksum = await CustomNodeManager.calculateChecksum(zipPath);
        await manager.installNode(zipPath, checksum);
      }
      
      const node = manager.getNode(fingerprint);
      expect(node?.versions).toHaveLength(3);
      
      const versions = node!.versions.map(v => v.version);
      expect(versions).toEqual(['1.0.0', '1.1.0', '2.0.0']);
    }, 30000);
  });

  describe('Checksum Validation', () => {
    it('deve calcular checksum corretamente', async () => {
      const fingerprint = uuidv4();
      const zipPath = await createTestNode(testDir, fingerprint, '1.0.0');
      
      const checksum1 = await CustomNodeManager.calculateChecksum(zipPath);
      const checksum2 = await CustomNodeManager.calculateChecksum(zipPath);
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    }, 30000);
  });
});

// Helper functions

async function createTestNode(
  baseDir: string,
  fingerprint: string,
  version: string
): Promise<string> {
  const nodeDir = join(baseDir, `node-${fingerprint}-${version}`);
  await mkdir(join(nodeDir, 'dist'), { recursive: true });
  
  const packageJson = {
    name: `@flui/node-${fingerprint.slice(0, 8)}`,
    version,
    description: `Test node ${version}`,
    flui: { fingerprint },
  };
  await writeFile(
    join(nodeDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  const nodeCode = `
export default {
  fingerprint: '${fingerprint}',
  id: 'test-node-${fingerprint.slice(0, 8)}',
  name: 'Test Node ${version}',
  description: 'A test node version ${version}',
  category: 'custom',
  version: '${version}',
  params: [
    {
      name: 'input',
      key: 'input',
      type: 'string',
      description: 'Input data',
      required: true,
      ui: {
        widgetType: 'textInput',
        placeholder: 'Enter input',
      },
    },
  ],
  output: {
    type: 'object',
    description: 'Output data',
  },
  execute: async (args) => {
    return { success: true, output: args.input.toUpperCase(), version: '${version}' };
  },
  ui: {
    icon: 'Box',
    color: '#3b82f6',
    tags: ['test', 'v${version}'],
  },
  config: {
    timeout: 30000,
  },
};
`;
  await writeFile(join(nodeDir, 'dist', 'index.js'), nodeCode);
  
  await writeFile(
    join(nodeDir, 'README.md'),
    `# Test Node\n\nVersion ${version}`
  );
  
  const zipPath = join(baseDir, `node-${fingerprint}-${version}.zip`);
  await createZip(nodeDir, zipPath);
  
  return zipPath;
}

function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', resolve);
    archive.on('error', reject);
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

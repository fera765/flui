/**
 * FLUI Custom Node Manager
 * 
 * Gerencia o ciclo de vida de nodes customizados:
 * - Validação de pacotes
 * - Instalação
 * - Atualização
 * - Registro no sistema
 * - Versionamento
 */

import { createHash } from 'crypto';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';
// import { Extract } from 'unzipper'; // TODO: Add unzipper dependency
import {
  CustomNodeMetadata,
  CustomNodeMetadataSchema,
  CustomNodeRegistryEntry,
  NodeValidationResult,
  NodeUploadResponse,
  NodeInstallResponse,
} from '../types/customNode.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { Tool } from '../core/types.js';

export class CustomNodeManager {
  private nodesDir: string;
  private registryPath: string;
  private registry: Map<string, CustomNodeRegistryEntry>;

  constructor(baseDir: string = join(process.cwd(), '.flui', 'custom-nodes')) {
    this.nodesDir = baseDir;
    this.registryPath = join(baseDir, 'registry.json');
    this.registry = new Map();
  }

  /**
   * Inicializa o gerenciador
   */
  async initialize(): Promise<void> {
    // Criar diretório se não existir
    await mkdir(this.nodesDir, { recursive: true });

    // Carregar registry existente
    try {
      const data = await readFile(this.registryPath, 'utf-8');
      const entries = JSON.parse(data);
      for (const entry of entries) {
        this.registry.set(entry.fingerprint, entry);
      }
      console.log(`📦 Loaded ${this.registry.size} custom nodes from registry`);
    } catch {
      // Registry não existe ainda
      await this.saveRegistry();
    }

    // Carregar nodes instalados no tool registry
    await this.loadInstalledNodes();
  }

  /**
   * Valida um pacote de node
   */
  async validatePackage(zipPath: string): Promise<NodeValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Extrair para diretório temporário
      const tempDir = join(this.nodesDir, 'temp', Date.now().toString());
      await mkdir(tempDir, { recursive: true });

      // TODO: Implement zip extraction
      // await new Promise<void>((resolve, reject) => {
      //   createReadStream(zipPath)
      //     .pipe(Extract({ path: tempDir }))
      //     .on('close', resolve)
      //     .on('error', reject);
      // });
      
      // Placeholder - extraction not implemented yet
      throw new Error('Zip extraction not implemented yet');

      // Verificar arquivos obrigatórios
      const requiredFiles = ['package.json', 'dist/index.js'];
      for (const file of requiredFiles) {
        try {
          await readFile(join(tempDir, file));
        } catch {
          errors.push(`Arquivo obrigatório ausente: ${file}`);
        }
      }

      if (errors.length > 0) {
        await rm(tempDir, { recursive: true, force: true });
        return { valid: false, errors };
      }

      // Validar package.json
      const packageJson = JSON.parse(
        await readFile(join(tempDir, 'package.json'), 'utf-8')
      );

      if (!packageJson.flui?.fingerprint) {
        errors.push('package.json deve conter flui.fingerprint');
      }

      if (!packageJson.version) {
        errors.push('package.json deve conter version');
      }

      // Carregar e validar node
      const nodeModule = await import(join(tempDir, 'dist/index.js'));
      const node = nodeModule.default || nodeModule;

      if (!node.fingerprint) {
        errors.push('Node deve exportar fingerprint');
      }

      if (node.fingerprint !== packageJson.flui.fingerprint) {
        errors.push('Fingerprint do node não corresponde ao package.json');
      }

      // Validar estrutura do node
      const requiredProps = ['id', 'name', 'description', 'execute'];
      for (const prop of requiredProps) {
        if (!node[prop]) {
          errors.push(`Node deve ter propriedade: ${prop}`);
        }
      }

      if (typeof node.execute !== 'function') {
        errors.push('Node.execute deve ser uma função');
      }

      // Criar metadata
      const metadata: CustomNodeMetadata = {
        fingerprint: {
          uuid: node.fingerprint,
          createdAt: new Date().toISOString(),
          author: packageJson.author?.email,
          repository: packageJson.repository?.url,
        },
        name: node.id,
        displayName: node.name,
        description: node.description,
        version: packageJson.version,
        category: node.category || 'custom',
        tags: node.ui?.tags || ['custom'],
        author: {
          name: typeof packageJson.author === 'string' 
            ? packageJson.author 
            : packageJson.author?.name || 'Anonymous',
          email: packageJson.author?.email,
          url: packageJson.author?.url,
        },
        license: packageJson.license || 'MIT',
        repository: packageJson.repository ? {
          type: 'git',
          url: packageJson.repository.url || packageJson.repository,
        } : undefined,
        dependencies: packageJson.dependencies,
        peerDependencies: packageJson.peerDependencies,
        requirements: {
          fluiVersion: packageJson.flui?.requiredVersion,
          nodeVersion: packageJson.engines?.node,
        },
        icon: node.ui?.icon,
        color: node.ui?.color || '#3b82f6',
        documentation: {
          readme: 'README.md',
          changelog: 'CHANGELOG.md',
        },
        published: false,
        deprecated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validar metadata com Zod
      const validation = CustomNodeMetadataSchema.safeParse(metadata);
      if (!validation.success) {
        // Zod validation errors
        try {
          validation.error?.errors.forEach((err: any) => {
            errors.push(`${err.path.join('.')}: ${err.message}`);
          });
        } catch {
          errors.push('Validation error occurred');
        }
      }

      // Limpar temp
      await rm(tempDir, { recursive: true, force: true });

      if (errors.length > 0) {
        return { valid: false, errors, warnings };
      }

      return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: validation.data,
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [`Erro ao validar pacote: ${error.message}`],
      };
    }
  }

  /**
   * Instala ou atualiza um node
   */
  async installNode(
    zipPath: string,
    checksum: string
  ): Promise<NodeUploadResponse> {
    // Validar pacote
    const validation = await this.validatePackage(zipPath);
    if (!validation.valid || !validation.metadata) {
      return {
        success: false,
        message: 'Validação do pacote falhou',
        isUpdate: false,
        errors: validation.errors,
      };
    }

    const metadata = validation.metadata;
    const fingerprint = metadata.fingerprint.uuid;

    // Verificar se é atualização
    const existing = this.registry.get(fingerprint);
    const isUpdate = !!existing;

    let previousVersion: string | undefined;
    if (isUpdate && existing) {
      previousVersion = existing.metadata.version;
      
      // Verificar se versão é maior
      if (!this.isVersionNewer(metadata.version, previousVersion)) {
        return {
          success: false,
          message: `Versão ${metadata.version} não é mais recente que ${previousVersion}`,
          isUpdate: true,
          previousVersion,
          errors: ['Nova versão deve ser maior que a anterior'],
        };
      }
    }

    try {
      // Extrair para diretório final
      const nodeDir = join(this.nodesDir, fingerprint, metadata.version);
      await mkdir(nodeDir, { recursive: true });

      // TODO: Implement zip extraction
      // await new Promise<void>((resolve, reject) => {
      //   createReadStream(zipPath)
      //     .pipe(Extract({ path: nodeDir }))
      //     .on('close', resolve)
      //     .on('error', reject);
      // });
      
      // Placeholder
      throw new Error('Installation not fully implemented yet');

      // Calcular tamanho
      const zipBuffer = await readFile(zipPath);
      const size = zipBuffer.length;

      // Atualizar ou criar entrada no registry
      const registryEntry: CustomNodeRegistryEntry = {
        fingerprint,
        metadata,
        versions: [
          ...(existing?.versions || []),
          {
            version: metadata.version,
            publishedAt: new Date().toISOString(),
            downloadUrl: nodeDir,
            checksum,
            size,
          },
        ],
        stats: existing?.stats || {
          downloads: 0,
          stars: 0,
          rating: 0,
          reviews: 0,
        },
        status: 'active',
        installedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      this.registry.set(fingerprint, registryEntry);
      await this.saveRegistry();

      // Registrar node no tool registry
      await this.registerNodeInToolRegistry(nodeDir, metadata);

      return {
        success: true,
        fingerprint,
        message: isUpdate
          ? `Node atualizado com sucesso: ${previousVersion} → ${metadata.version}`
          : 'Node instalado com sucesso',
        isUpdate,
        previousVersion,
        newVersion: metadata.version,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao instalar node: ${error.message}`,
        isUpdate,
        errors: [error.message],
      };
    }
  }

  /**
   * Registra node no tool registry do FLUI
   */
  private async registerNodeInToolRegistry(
    nodeDir: string,
    metadata: CustomNodeMetadata
  ): Promise<void> {
    try {
      // Carregar módulo do node
      const nodeModule = await import(join(nodeDir, 'dist/index.js'));
      const node = nodeModule.default || nodeModule;

      // Converter para Tool do FLUI
      const tool: Tool = {
        id: node.id,
        name: node.name,
        description: node.description,
        category: node.category,
        version: metadata.version,
        params: node.params,
        output: node.output,
        execute: node.execute.bind(node),
        validate: node.validate?.bind(node),
        ui: node.ui,
        config: node.config,
        capabilities: node.capabilities,
        hooks: node.hooks,
      };

      // Registrar no registry global
      const registry = getToolRegistry();
      
      // Se já existe, remover versão antiga
      if (registry.has(node.id)) {
        registry.unregister(node.id);
      }
      
      registry.register(tool);
      
      console.log(`✅ Custom node registered: ${node.name} (${metadata.version})`);
    } catch (error: any) {
      console.error(`❌ Failed to register node in tool registry: ${error.message}`);
      throw error;
    }
  }

  /**
   * Carrega nodes instalados no tool registry
   */
  private async loadInstalledNodes(): Promise<void> {
    for (const [fingerprint, entry] of this.registry.entries()) {
      if (entry.status !== 'active') continue;

      // Pegar última versão
      const latestVersion = entry.versions[entry.versions.length - 1];
      const nodeDir = latestVersion.downloadUrl;

      try {
        await this.registerNodeInToolRegistry(nodeDir, entry.metadata);
      } catch (error: any) {
        console.error(`Failed to load custom node ${fingerprint}:`, error.message);
      }
    }
  }

  /**
   * Lista nodes instalados
   */
  listNodes(): CustomNodeRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Obtém node por fingerprint
   */
  getNode(fingerprint: string): CustomNodeRegistryEntry | undefined {
    return this.registry.get(fingerprint);
  }

  /**
   * Remove node
   */
  async removeNode(fingerprint: string): Promise<boolean> {
    const entry = this.registry.get(fingerprint);
    if (!entry) return false;

    try {
      // Remover do tool registry
      const registry = getToolRegistry();
      registry.unregister(entry.metadata.name);

      // Remover diretório
      const nodeDir = join(this.nodesDir, fingerprint);
      await rm(nodeDir, { recursive: true, force: true });

      // Remover do registry
      this.registry.delete(fingerprint);
      await this.saveRegistry();

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Salva registry em disco
   */
  private async saveRegistry(): Promise<void> {
    const data = JSON.stringify(Array.from(this.registry.values()), null, 2);
    await writeFile(this.registryPath, data, 'utf-8');
  }

  /**
   * Verifica se versão é mais recente (semver simplificado)
   */
  private isVersionNewer(newVersion: string, oldVersion: string): boolean {
    const parseVersion = (v: string) => v.split('.').map(Number);
    const [newMajor, newMinor, newPatch] = parseVersion(newVersion);
    const [oldMajor, oldMinor, oldPatch] = parseVersion(oldVersion);

    if (newMajor > oldMajor) return true;
    if (newMajor < oldMajor) return false;

    if (newMinor > oldMinor) return true;
    if (newMinor < oldMinor) return false;

    return newPatch > oldPatch;
  }

  /**
   * Calcula checksum de arquivo
   */
  static async calculateChecksum(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }
}

// Singleton instance
let customNodeManager: CustomNodeManager | null = null;

export function getCustomNodeManager(): CustomNodeManager {
  if (!customNodeManager) {
    customNodeManager = new CustomNodeManager();
  }
  return customNodeManager;
}

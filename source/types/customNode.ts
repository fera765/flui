/**
 * FLUI Custom Node System
 * 
 * Sistema superior ao n8n para criação de nodes customizados
 * Permite que desenvolvedores criem, publiquem e atualizem nodes facilmente
 */

import { z } from 'zod';

// ============= NODE FINGERPRINT =============

export const NodeFingerprintSchema = z.object({
  uuid: z.string().uuid(),
  createdAt: z.string().datetime(),
  author: z.string().email().optional(),
  repository: z.string().url().optional(),
});

export type NodeFingerprint = z.infer<typeof NodeFingerprintSchema>;

// ============= NODE METADATA =============

export const CustomNodeMetadataSchema = z.object({
  // Identificação
  fingerprint: NodeFingerprintSchema,
  name: z.string().min(3).max(50),
  displayName: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // semver
  
  // Categorização
  category: z.enum(['ai', 'data', 'communication', 'productivity', 'analytics', 'integration', 'utility', 'custom']),
  tags: z.array(z.string()).min(1).max(10),
  
  // Autor
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),
  
  // Licença
  license: z.enum(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Proprietary']),
  
  // Repositório
  repository: z.object({
    type: z.enum(['git', 'svn', 'mercurial']).optional(),
    url: z.string().url().optional(),
  }).optional(),
  
  // Dependências (para validação de compatibilidade)
  dependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  
  // Requisitos mínimos
  requirements: z.object({
    fluiVersion: z.string().optional(), // versão mínima do FLUI
    nodeVersion: z.string().optional(), // versão mínima do Node.js
  }).optional(),
  
  // UI
  icon: z.string().optional(), // Nome do ícone Lucide ou URL
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  
  // Documentação
  documentation: z.object({
    readme: z.string().optional(), // Caminho para README.md
    examples: z.array(z.object({
      title: z.string(),
      description: z.string(),
      config: z.record(z.any()),
    })).optional(),
    changelog: z.string().optional(), // CHANGELOG.md
  }).optional(),
  
  // Status
  published: z.boolean().default(false),
  deprecated: z.boolean().default(false),
  
  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
});

export type CustomNodeMetadata = z.infer<typeof CustomNodeMetadataSchema>;

// ============= NODE PACKAGE =============

export interface CustomNodePackage {
  metadata: CustomNodeMetadata;
  tool: any; // Tool interface do core
  assets?: {
    icon?: string;
    screenshots?: string[];
  };
  documentation?: {
    readme?: string;
    changelog?: string;
  };
}

// ============= NODE BUILD CONFIG =============

export const NodeBuildConfigSchema = z.object({
  entry: z.string().default('src/index.ts'),
  outDir: z.string().default('dist'),
  target: z.enum(['node18', 'node20', 'node22']).default('node18'),
  minify: z.boolean().default(true),
  sourcemap: z.boolean().default(false),
  externals: z.array(z.string()).default([]),
});

export type NodeBuildConfig = z.infer<typeof NodeBuildConfigSchema>;

// ============= NODE VALIDATION =============

export interface NodeValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: CustomNodeMetadata;
}

// ============= NODE REGISTRY ENTRY =============

export interface CustomNodeRegistryEntry {
  fingerprint: string; // UUID
  metadata: CustomNodeMetadata;
  versions: Array<{
    version: string;
    publishedAt: string;
    downloadUrl: string;
    checksum: string;
    size: number;
  }>;
  stats: {
    downloads: number;
    stars: number;
    rating: number;
    reviews: number;
  };
  status: 'active' | 'deprecated' | 'archived';
  installedAt?: string;
  lastUpdated: string;
}

// ============= NODE UPLOAD =============

export interface NodeUploadRequest {
  zipBuffer: Buffer;
  checksum: string;
  metadata?: Partial<CustomNodeMetadata>;
}

export interface NodeUploadResponse {
  success: boolean;
  fingerprint?: string;
  message: string;
  isUpdate: boolean;
  previousVersion?: string;
  newVersion?: string;
  errors?: string[];
}

// ============= NODE INSTALL =============

export interface NodeInstallRequest {
  fingerprint: string;
  version?: string; // se não especificado, instala a última
}

export interface NodeInstallResponse {
  success: boolean;
  fingerprint: string;
  version: string;
  installedAt: string;
  message: string;
}

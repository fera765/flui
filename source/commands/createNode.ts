/**
 * FLUI Create Node Command
 * 
 * CLI command to scaffold a new custom node project
 * Usage: flui --create-node <node-name>
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface CreateNodeOptions {
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
  author?: string;
  email?: string;
  license?: string;
}

export async function createNode(options: CreateNodeOptions): Promise<void> {
  const {
    name,
    displayName = name,
    description = `Custom node: ${name}`,
    category = 'custom',
    author = 'Anonymous',
    email,
    license = 'MIT',
  } = options;

  // Validar nome
  if (!/^[a-z0-9-_]+$/.test(name)) {
    throw new Error('Nome do node deve conter apenas letras minúsculas, números, hífens e underscores');
  }

  const projectDir = join(process.cwd(), `flui-node-${name}`);
  const srcDir = join(projectDir, 'src');
  const testsDir = join(projectDir, '__tests__');

  console.log(`\n🚀 Criando novo node FLUI: ${name}\n`);

  // Criar estrutura de diretórios
  await mkdir(projectDir, { recursive: true });
  await mkdir(srcDir, { recursive: true });
  await mkdir(testsDir, { recursive: true });

  const fingerprint = randomUUID();
  const now = new Date().toISOString();

  // ============= PACKAGE.JSON =============
  const packageJson = {
    name: `@flui/node-${name}`,
    version: '1.0.0',
    description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc && node scripts/build.js',
      test: 'vitest run',
      'test:watch': 'vitest',
      dev: 'tsc --watch',
      lint: 'eslint src/**/*.ts',
      package: 'npm run build && node scripts/package.js',
    },
    keywords: ['flui', 'node', 'automation', category],
    author: email ? `${author} <${email}>` : author,
    license,
    flui: {
      fingerprint,
      category,
      version: '1.0.0',
    },
    dependencies: {
      zod: '^3.22.4',
    },
    devDependencies: {
      '@types/node': '^20.10.6',
      typescript: '^5.3.3',
      vitest: '^1.1.0',
      eslint: '^8.56.0',
      archiver: '^6.0.1',
    },
    peerDependencies: {
      '@flui/core': '>=1.0.0',
    },
  };

  await writeFile(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // ============= TSCONFIG.JSON =============
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      lib: ['ES2022'],
      outDir: './dist',
      rootDir: './src',
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '__tests__'],
  };

  await writeFile(
    join(projectDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // ============= SRC/INDEX.TS =============
  const indexTs = `/**
 * ${displayName} - Custom FLUI Node
 * ${description}
 * 
 * Fingerprint: ${fingerprint}
 * Version: 1.0.0
 * Author: ${author}
 */

import { z } from 'zod';

// ============= TYPES =============

export interface ${toPascalCase(name)}Config {
  // Defina aqui a configuração do seu node
  input: string;
  options?: Record<string, any>;
}

export interface ${toPascalCase(name)}Result {
  success: boolean;
  output?: any;
  error?: string;
}

// ============= VALIDATION SCHEMA =============

const ConfigSchema = z.object({
  input: z.string().min(1, 'Input é obrigatório'),
  options: z.record(z.any()).optional(),
});

// ============= NODE IMPLEMENTATION =============

export const ${toPascalCase(name)}Node = {
  // Identificação única (fingerprint)
  fingerprint: '${fingerprint}',
  
  // Metadados
  id: '${name}',
  name: '${displayName}',
  description: '${description}',
  category: '${category}' as const,
  version: '1.0.0',
  
  // Parâmetros de entrada
  params: [
    {
      name: 'Input',
      key: 'input',
      type: 'string' as const,
      description: 'Dados de entrada',
      required: true,
      ui: {
        widgetType: 'textInput' as const,
        placeholder: 'Digite algo...',
        helperText: 'Dados que serão processados pelo node',
      },
    },
    {
      name: 'Options',
      key: 'options',
      type: 'object' as const,
      description: 'Opções adicionais',
      required: false,
      ui: {
        widgetType: 'jsonEditor' as const,
        advanced: true,
      },
    },
  ],
  
  // Definição de saída
  output: {
    type: 'object' as const,
    description: 'Resultado do processamento',
    schema: {
      success: 'boolean',
      output: 'any',
      error: 'string',
    },
  },
  
  // Função de execução principal
  async execute(
    args: ${toPascalCase(name)}Config,
    context: any
  ): Promise<${toPascalCase(name)}Result> {
    try {
      // Validar entrada
      const validated = ConfigSchema.parse(args);
      
      // ============= SUA LÓGICA AQUI =============
      // TODO: Implementar a lógica do node
      
      const result = {
        processed: validated.input.toUpperCase(),
        timestamp: new Date().toISOString(),
      };
      
      return {
        success: true,
        output: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // Validação de parâmetros
  validate(args: any) {
    try {
      ConfigSchema.parse(args);
      return { valid: true, errors: [] };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.errors.map((e: any) => e.message),
      };
    }
  },
  
  // UI Configuration
  ui: {
    icon: 'Box',
    color: '#3b82f6',
    tags: ['${category}', 'custom'],
    examples: [
      {
        title: 'Exemplo básico',
        description: 'Uso simples do ${displayName}',
        params: {
          input: 'hello world',
        },
        expectedOutput: {
          success: true,
          output: {
            processed: 'HELLO WORLD',
          },
        },
      },
    ],
  },
  
  // Configurações avançadas
  config: {
    timeout: 30000,
    retries: 1,
    sandbox: false,
    concurrent: true,
  },
};

// Export default para facilitar importação
export default ${toPascalCase(name)}Node;
`;

  await writeFile(join(srcDir, 'index.ts'), indexTs);

  // ============= TESTS =============
  const testFile = `import { describe, it, expect } from 'vitest';
import { ${toPascalCase(name)}Node } from '../src/index';

describe('${displayName}', () => {
  it('deve executar com sucesso', async () => {
    const result = await ${toPascalCase(name)}Node.execute(
      {
        input: 'test',
      },
      {}
    );
    
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });
  
  it('deve validar parâmetros', () => {
    const validation = ${toPascalCase(name)}Node.validate({
      input: 'test',
    });
    
    expect(validation.valid).toBe(true);
  });
  
  it('deve retornar erro para entrada inválida', () => {
    const validation = ${toPascalCase(name)}Node.validate({});
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
`;

  await writeFile(join(testsDir, `${name}.test.ts`), testFile);

  // ============= BUILD SCRIPT =============
  const buildScript = `const { build } = require('esbuild');
const { join } = require('path');

async function buildNode() {
  console.log('🏗️  Building node...');
  
  try {
    await build({
      entryPoints: [join(__dirname, '../src/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: join(__dirname, '../dist/index.js'),
      format: 'esm',
      external: ['zod'],
      sourcemap: true,
      minify: true,
    });
    
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildNode();
`;

  await mkdir(join(projectDir, 'scripts'), { recursive: true });
  await writeFile(join(projectDir, 'scripts', 'build.js'), buildScript);

  // ============= PACKAGE SCRIPT =============
  const packageScript = `const archiver = require('archiver');
const { createWriteStream } = require('fs');
const { readFile } = require('fs/promises');
const { join } = require('path');
const crypto = require('crypto');

async function packageNode() {
  console.log('📦 Packaging node...');
  
  const packageJson = JSON.parse(
    await readFile(join(__dirname, '../package.json'), 'utf-8')
  );
  
  const outputPath = join(__dirname, \`../\${packageJson.name}-v\${packageJson.version}.zip\`);
  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  
  // Adicionar arquivos essenciais
  archive.directory('dist/', 'dist');
  archive.file('package.json', { name: 'package.json' });
  archive.file('README.md', { name: 'README.md' });
  
  if (require('fs').existsSync('CHANGELOG.md')) {
    archive.file('CHANGELOG.md', { name: 'CHANGELOG.md' });
  }
  
  await archive.finalize();
  
  // Calcular checksum
  const fileBuffer = await readFile(outputPath);
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  console.log('✅ Package created successfully!');
  console.log(\`📍 Location: \${outputPath}\`);
  console.log(\`🔐 Checksum: \${checksum}\`);
  console.log(\`📊 Size: \${(fileBuffer.length / 1024).toFixed(2)} KB\`);
  console.log(\`\\n📤 Upload with: flui --upload-node \${outputPath}\`);
}

packageNode().catch(console.error);
`;

  await writeFile(join(projectDir, 'scripts', 'package.js'), packageScript);

  // ============= README.MD =============
  const readme = `# ${displayName}

${description}

## 📋 Information

- **Fingerprint**: \`${fingerprint}\`
- **Version**: 1.0.0
- **Category**: ${category}
- **Author**: ${author}
- **License**: ${license}

## 🚀 Installation

\`\`\`bash
# Via FLUI CLI
flui --install-node ${fingerprint}

# Or upload the package
npm run package
flui --upload-node ./${packageJson.name}-v1.0.0.zip
\`\`\`

## 📖 Usage

### Basic Example

\`\`\`typescript
{
  "nodeId": "${name}",
  "config": {
    "input": "your data here"
  }
}
\`\`\`

### Advanced Example

\`\`\`typescript
{
  "nodeId": "${name}",
  "config": {
    "input": "your data here",
    "options": {
      "customOption": "value"
    }
  }
}
\`\`\`

## 🔧 Development

\`\`\`bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Package for distribution
npm run package
\`\`\`

## 📝 Parameters

### Input
- **Type**: string
- **Required**: Yes
- **Description**: Main input data to process

### Options
- **Type**: object
- **Required**: No
- **Description**: Additional configuration options

## 📤 Output

\`\`\`typescript
{
  success: boolean;
  output?: any;
  error?: string;
}
\`\`\`

## 🧪 Testing

\`\`\`bash
npm test
\`\`\`

## 📦 Publishing

1. Build the node: \`npm run build\`
2. Run tests: \`npm test\`
3. Package: \`npm run package\`
4. Upload: \`flui --upload-node ./package.zip\`

## 🔄 Updates

To update an existing node:

1. Increment version in \`package.json\`
2. Update \`CHANGELOG.md\`
3. Build and package: \`npm run build && npm run package\`
4. Upload: \`flui --upload-node ./package.zip\`

The fingerprint (\`${fingerprint}\`) will identify this as an update.

## 📄 License

${license}

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Contact

${email ? `- Email: ${email}` : ''}
${email ? `- Author: ${author}` : ''}
`;

  await writeFile(join(projectDir, 'README.md'), readme);

  // ============= CHANGELOG.MD =============
  const changelog = `# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - ${now.split('T')[0]}

### Added
- Initial release
- Basic functionality implementation
- Tests and documentation
`;

  await writeFile(join(projectDir, 'CHANGELOG.md'), changelog);

  // ============= .GITIGNORE =============
  const gitignore = `node_modules/
dist/
*.zip
*.log
.env
.DS_Store
coverage/
.vscode/
.idea/
`;

  await writeFile(join(projectDir, '.gitignore'), gitignore);

  // ============= DOC.MD =============
  const docMd = `# ${displayName} - Technical Documentation

## Overview

This document provides technical details about the ${displayName} custom node for FLUI.

## Architecture

### Node Structure

\`\`\`
flui-node-${name}/
├── src/
│   └── index.ts          # Main node implementation
├── __tests__/
│   └── ${name}.test.ts   # Unit tests
├── scripts/
│   ├── build.js          # Build script
│   └── package.js        # Packaging script
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
└── DOC.md               # This file
\`\`\`

### Fingerprint System

This node uses a UUID-based fingerprint system for identification:
- **Fingerprint**: \`${fingerprint}\`
- Used for: Version tracking, updates, and deduplication
- Never changes across versions of the same node

### Build Process

1. **TypeScript Compilation**: \`tsc\`
2. **Bundling**: \`esbuild\` with minification
3. **Packaging**: Creates optimized .zip file
4. **Checksum**: SHA-256 hash for integrity verification

## Implementation Details

### Entry Point

The main export is \`${toPascalCase(name)}Node\` which implements the FLUI Tool interface:

\`\`\`typescript
{
  fingerprint: string;
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  params: ToolParam[];
  output: ToolOutput;
  execute: (args, context) => Promise<Result>;
  validate: (args) => ValidationResult;
  ui: UIConfig;
  config: NodeConfig;
}
\`\`\`

### Execution Context

The node receives a context object with:
- \`automationId\`: Current automation ID
- \`nodeId\`: Current node instance ID
- \`previousResults\`: Results from previous nodes
- \`globalContext\`: Shared context across automation

### Error Handling

All errors should be caught and returned in the result:

\`\`\`typescript
{
  success: false,
  error: "Error message here"
}
\`\`\`

## Testing

### Unit Tests

Located in \`__tests__/${name}.test.ts\`

Run with:
\`\`\`bash
npm test
\`\`\`

### Integration Tests

Test the node in a real FLUI automation:

1. Upload the node to FLUI
2. Create a test automation
3. Add the node to the workflow
4. Execute and verify results

## Deployment

### Building

\`\`\`bash
npm run build
\`\`\`

Output: \`dist/index.js\` (minified, bundled)

### Packaging

\`\`\`bash
npm run package
\`\`\`

Creates: \`@flui-node-${name}-v1.0.0.zip\`

Contents:
- \`dist/\` - Compiled code
- \`package.json\` - Metadata
- \`README.md\` - Documentation
- \`CHANGELOG.md\` - Version history

### Upload

\`\`\`bash
flui --upload-node ./@flui-node-${name}-v1.0.0.zip
\`\`\`

### Update Process

1. Make changes to \`src/index.ts\`
2. Update version in \`package.json\`
3. Document changes in \`CHANGELOG.md\`
4. Build: \`npm run build\`
5. Test: \`npm test\`
6. Package: \`npm run package\`
7. Upload: \`flui --upload-node ./package.zip\`

The fingerprint ensures FLUI recognizes this as an update to the same node.

## Best Practices

### 1. Validation
- Always validate input parameters
- Use Zod schemas for type safety
- Return clear error messages

### 2. Error Handling
- Wrap execute() in try-catch
- Never throw errors, return them in result
- Log errors for debugging

### 3. Performance
- Implement timeout handling
- Support concurrent execution if possible
- Clean up resources properly

### 4. Documentation
- Keep README.md up to date
- Document all parameters clearly
- Provide usage examples
- Update CHANGELOG.md

### 5. Testing
- Write unit tests for all paths
- Test error cases
- Validate parameter validation
- Test with various inputs

## Versioning

Follow Semantic Versioning (semver):
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

## Support

For issues or questions:
1. Check FLUI documentation
2. Review this DOC.md
3. Contact: ${email || 'support@flui.dev'}

## License

${license}
`;

  await writeFile(join(projectDir, 'DOC.md'), docMd);

  console.log('✅ Node project created successfully!\n');
  console.log('📁 Project location:', projectDir);
  console.log('🔑 Fingerprint:', fingerprint);
  console.log('\n📋 Next steps:');
  console.log(`   cd flui-node-${name}`);
  console.log('   npm install');
  console.log('   npm test');
  console.log('   npm run build');
  console.log('   npm run package');
  console.log('\n📚 Documentation:');
  console.log('   - README.md: User documentation');
  console.log('   - DOC.md: Technical documentation');
  console.log('   - CHANGELOG.md: Version history');
  console.log('\n🚀 Happy coding!\n');
}

// Helper function
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

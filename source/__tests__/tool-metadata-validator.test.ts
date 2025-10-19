/**
 * Testes para validação de metadados de ferramentas
 */

import { describe, it, expect } from 'vitest';
import { validateToolMetadata, prepareToolMetadata } from '../core/toolMetadataValidator.js';

describe('Tool Metadata Validator', () => {
  describe('validateToolMetadata', () => {
    it('deve validar metadados corretos', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test Tool',
        description: 'Uma ferramenta de teste completa',
        category: 'system',
        version: '1.0.0',
        params: [
          {
            name: 'Teste',
            key: 'test',
            type: 'string',
            description: 'Parâmetro de teste',
            required: true,
            ui: {
              widgetType: 'textInput',
              placeholder: 'Digite algo',
            },
          },
        ],
        output: {
          type: 'string',
          description: 'Resultado do teste',
        },
        ui: {
          icon: 'Test',
          color: '#ff0000',
          tags: ['test'],
        },
      };

      const result = validateToolMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('deve rejeitar ID inválido', () => {
      const metadata = {
        id: 'Test Tool!', // Caracteres inválidos
        name: 'Test',
        description: 'Test description long enough',
        category: 'system',
        version: '1.0.0',
        params: [],
        output: { type: 'string', description: 'test' },
        ui: {},
      };

      const result = validateToolMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.includes('ID'))).toBe(true);
    });

    it('deve rejeitar versão inválida', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test',
        description: 'Test description long enough',
        category: 'system',
        version: 'v1.0', // Formato inválido
        params: [],
        output: { type: 'string', description: 'test' },
        ui: {},
      };

      const result = validateToolMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('semver'))).toBe(true);
    });

    it('deve rejeitar descrição curta', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test',
        description: 'Short', // Muito curta
        category: 'system',
        version: '1.0.0',
        params: [],
        output: { type: 'string', description: 'test' },
        ui: {},
      };

      const result = validateToolMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('10 caracteres'))).toBe(true);
    });

    it('deve rejeitar cor inválida', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test',
        description: 'Test description long enough',
        category: 'system',
        version: '1.0.0',
        params: [],
        output: { type: 'string', description: 'test' },
        ui: {
          color: 'red', // Deve ser hex
        },
      };

      const result = validateToolMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('hex'))).toBe(true);
    });

    it('deve gerar warnings para metadados incompletos', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test',
        description: 'Test description long enough',
        category: 'system',
        version: '1.0.0',
        params: [
          {
            name: 'Test Param',
            key: 'test',
            type: 'string',
            description: 'A test parameter',
            required: true,
            ui: {
              widgetType: 'textInput',
            },
          },
        ],
        output: { type: 'string', description: 'test' },
        ui: {}, // Sem exemplos
        capabilities: {
          isAsync: true,
        },
        // Sem config.timeout
      };

      const result = validateToolMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('prepareToolMetadata', () => {
    it('deve adicionar valores padrão', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test',
        description: 'Test description',
        category: 'system',
        version: '1.0.0',
        params: [],
        output: { type: 'string', description: 'test' },
        ui: {},
      };

      const prepared = prepareToolMetadata(metadata);
      
      expect(prepared.inputs).toBeDefined();
      expect(prepared.outputs).toBeDefined();
      expect(prepared.capabilities).toBeDefined();
      expect(prepared.config).toBeDefined();
      expect(prepared.config.timeout).toBe(30000);
      expect(prepared.config.concurrent).toBe(true);
    });

    it('deve inferir UI config para params sem ui', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test',
        description: 'Test description',
        category: 'system',
        version: '1.0.0',
        params: [
          {
            name: 'String Param',
            key: 'str',
            type: 'string',
            description: 'A string',
            required: false,
          },
          {
            name: 'Number Param',
            key: 'num',
            type: 'number',
            description: 'A number',
            required: false,
          },
        ],
        output: { type: 'string', description: 'test' },
        ui: {},
      };

      const prepared = prepareToolMetadata(metadata) as any;
      
      expect(prepared.params[0].ui.widgetType).toBe('textInput');
      expect(prepared.params[1].ui.widgetType).toBe('number');
    });

    it('deve preservar config existente', () => {
      const metadata = {
        id: 'test-tool',
        name: 'Test',
        description: 'Test description',
        category: 'system',
        version: '1.0.0',
        params: [],
        output: { type: 'string', description: 'test' },
        ui: {},
        config: {
          timeout: 60000,
          retries: 3,
        },
      };

      const prepared = prepareToolMetadata(metadata);
      
      expect(prepared.config.timeout).toBe(60000);
      expect(prepared.config.retries).toBe(3);
      expect(prepared.config.concurrent).toBe(true);
    });
  });
});

/**
 * FLUI - Reference Resolver Tests
 * 
 * Testa o sistema de resolução de referências {{nodeId.key}}
 */

import { describe, it, expect } from 'vitest';
import { resolveReferences, hasReferences, extractReferences, validateReferences } from '../core/referenceResolver.js';
import { createNodeDataItem } from '../core/nodeDataTypes.js';

describe('Reference Resolver', () => {
  const mockContext = {
    nodeOutputs: new Map([
      [
        'node-1',
        [createNodeDataItem({ nome: 'João Silva', email: 'joao@email.com', idade: 30 }, 'node-1')],
      ],
      [
        'node-2',
        [createNodeDataItem({ copy: 'Texto gerado pelo AI', palavras: 150 }, 'node-2')],
      ],
      [
        'node-3',
        [createNodeDataItem({ 
          user: { 
            name: 'Maria Santos', 
            age: 28,
            address: {
              city: 'São Paulo',
              country: 'Brasil'
            }
          } 
        }, 'node-3')],
      ],
    ]),
  };

  describe('resolveReferences', () => {
    it('should resolve single reference', () => {
      const config = {
        email: '{{node-1.email}}',
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.email).toBe('joao@email.com');
    });

    it('should resolve multiple references in same string', () => {
      const config = {
        message: 'Olá {{node-1.nome}}, seu email é {{node-1.email}}',
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.message).toBe('Olá João Silva, seu email é joao@email.com');
    });

    it('should resolve nested object references', () => {
      const config = {
        userName: '{{node-3.user.name}}',
        userAge: '{{node-3.user.age}}',
        city: '{{node-3.user.address.city}}',
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.userName).toBe('Maria Santos');
      expect(resolved.userAge).toBe(28);
      expect(resolved.city).toBe('São Paulo');
    });

    it('should resolve references from multiple nodes', () => {
      const config = {
        name: '{{node-1.nome}}',
        content: '{{node-2.copy}}',
        wordCount: '{{node-2.palavras}}',
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.name).toBe('João Silva');
      expect(resolved.content).toBe('Texto gerado pelo AI');
      expect(resolved.wordCount).toBe(150);
    });

    it('should keep original value if reference not found', () => {
      const config = {
        field: '{{node-999.invalid}}',
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.field).toBe('{{node-999.invalid}}');
    });

    it('should resolve arrays with references', () => {
      const config = {
        items: ['{{node-1.nome}}', 'valor estático', '{{node-2.copy}}'],
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.items).toEqual(['João Silva', 'valor estático', 'Texto gerado pelo AI']);
    });

    it('should resolve nested objects with references', () => {
      const config = {
        data: {
          user: {
            name: '{{node-1.nome}}',
            email: '{{node-1.email}}',
          },
          message: '{{node-2.copy}}',
        },
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.data.user.name).toBe('João Silva');
      expect(resolved.data.user.email).toBe('joao@email.com');
      expect(resolved.data.message).toBe('Texto gerado pelo AI');
    });

    it('should not resolve internal fields', () => {
      const config = {
        toolId: 'my-tool',
        nodeId: 'node-123',
        inputConfig: { mappings: [] },
        normalField: '{{node-1.nome}}',
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.toolId).toBe('my-tool');
      expect(resolved.nodeId).toBe('node-123');
      expect(resolved.inputConfig).toEqual({ mappings: [] });
      expect(resolved.normalField).toBe('João Silva');
    });

    it('should resolve numeric values', () => {
      const config = {
        age: '{{node-1.idade}}',
        count: '{{node-2.palavras}}',
      };

      const resolved = resolveReferences(config, mockContext);

      expect(resolved.age).toBe(30);
      expect(resolved.count).toBe(150);
    });
  });

  describe('hasReferences', () => {
    it('should detect references in strings', () => {
      expect(hasReferences('{{node-1.email}}')).toBe(true);
      expect(hasReferences('Text with {{ref}}')).toBe(true);
      expect(hasReferences('Multiple {{ref1}} and {{ref2}}')).toBe(true);
      expect(hasReferences('No references here')).toBe(false);
      expect(hasReferences('')).toBe(false);
    });

    it('should detect references in arrays', () => {
      expect(hasReferences(['{{node-1.email}}', 'text'])).toBe(true);
      expect(hasReferences(['text', 'more text'])).toBe(false);
    });

    it('should detect references in objects', () => {
      expect(hasReferences({ field: '{{node-1.email}}' })).toBe(true);
      expect(hasReferences({ field: 'text' })).toBe(false);
    });

    it('should detect references in nested structures', () => {
      expect(hasReferences({
        data: {
          items: ['{{ref}}', 'text']
        }
      })).toBe(true);
    });
  });

  describe('extractReferences', () => {
    it('should extract single reference', () => {
      const refs = extractReferences('{{node-1.email}}');
      expect(refs).toEqual(['node-1.email']);
    });

    it('should extract multiple references', () => {
      const refs = extractReferences('Hello {{node-1.nome}}, your email is {{node-1.email}}');
      expect(refs).toEqual(['node-1.nome', 'node-1.email']);
    });

    it('should extract references from objects', () => {
      const refs = extractReferences({
        field1: '{{node-1.email}}',
        field2: '{{node-2.copy}}',
      });
      expect(refs).toContain('node-1.email');
      expect(refs).toContain('node-2.copy');
    });

    it('should extract references from arrays', () => {
      const refs = extractReferences(['{{node-1.email}}', '{{node-2.copy}}']);
      expect(refs).toEqual(['node-1.email', 'node-2.copy']);
    });
  });

  describe('validateReferences', () => {
    it('should validate correct references', () => {
      const config = {
        email: '{{node-1.email}}',
        copy: '{{node-2.copy}}',
      };

      const validation = validateReferences(config, mockContext);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid node references', () => {
      const config = {
        field: '{{node-999.invalid}}',
      };

      const validation = validateReferences(config, mockContext);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('node-999');
    });

    it('should detect malformed references', () => {
      const config = {
        field: '{{invalid}}',
      };

      const validation = validateReferences(config, mockContext);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate multiple references', () => {
      const config = {
        field1: '{{node-1.email}}',
        field2: '{{node-invalid.key}}',
        field3: '{{node-2.copy}}',
      };

      const validation = validateReferences(config, mockContext);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBe(1);
      expect(validation.errors[0]).toContain('node-invalid');
    });
  });
});

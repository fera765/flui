/**
 * FLUI - Tool Validator
 * 
 * Sistema de validação automática de parâmetros de ferramentas
 * Gera validadores baseados nas definições de ToolParam
 */

import {
  ToolParam,
  ValidationError,
  ValidationResult,
} from './types.js';

export class ToolValidator {
  /**
   * Valida um conjunto de argumentos contra os parâmetros definidos
   */
  static validate(params: ToolParam[], args: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Validar cada parâmetro definido
    for (const param of params) {
      const paramKey = param.key || param.name;
      const value = args[paramKey];

      // Verificar obrigatoriedade
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push({
          param: param.name || paramKey,
          message: `Parâmetro '${param.name || paramKey}' é obrigatório`,
          code: 'required',
        });
        continue;
      }

      // Se não obrigatório e não fornecido, pular
      if (value === undefined || value === null) {
        continue;
      }

      // Validar tipo
      const typeError = this.validateType(param, value);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Validar com função customizada se fornecida
      if (param.validation) {
        try {
          const isValid = param.validation(value);
          if (!isValid) {
            errors.push({
              param: param.name || paramKey,
              message: `Valor inválido para '${param.name || paramKey}'`,
              code: 'custom',
            });
          }
        } catch (error: any) {
          errors.push({
            param: param.name || paramKey,
            message: `Erro na validação de '${param.name || paramKey}': ${error.message}`,
            code: 'custom',
          });
        }
      }

      // Validar opções (enum)
      if (param.options && param.options.length > 0) {
        if (!param.options.includes(value)) {
          errors.push({
            param: param.name || paramKey,
            message: `'${param.name || paramKey}' deve ser um de: ${param.options.join(', ')}`,
            code: 'invalid_value',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida o tipo de um valor
   */
  private static validateType(param: ToolParam, value: any): ValidationError | null {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    switch (param.type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            param: param.name,
            message: `'${param.name}' deve ser string, recebido ${actualType}`,
            code: 'invalid_type',
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            param: param.name,
            message: `'${param.name}' deve ser número, recebido ${actualType}`,
            code: 'invalid_type',
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            param: param.name,
            message: `'${param.name}' deve ser boolean, recebido ${actualType}`,
            code: 'invalid_type',
          };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return {
            param: param.name,
            message: `'${param.name}' deve ser object, recebido ${actualType}`,
            code: 'invalid_type',
          };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return {
            param: param.name,
            message: `'${param.name}' deve ser array, recebido ${actualType}`,
            code: 'invalid_type',
          };
        }
        break;

      case 'json':
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
          } catch {
            return {
              param: param.name,
              message: `'${param.name}' deve ser JSON válido`,
              code: 'invalid_value',
            };
          }
        } else if (typeof value !== 'object') {
          return {
            param: param.name,
            message: `'${param.name}' deve ser JSON ou objeto`,
            code: 'invalid_type',
          };
        }
        break;

      case 'file':
        if (typeof value !== 'string') {
          return {
            param: param.name,
            message: `'${param.name}' deve ser caminho de arquivo (string)`,
            code: 'invalid_type',
          };
        }
        break;
    }

    return null;
  }

  /**
   * Aplica valores padrão aos argumentos
   */
  static applyDefaults(params: ToolParam[], args: any): any {
    const result = { ...args };

    for (const param of params) {
      const paramKey = param.key || param.name;
      if (result[paramKey] === undefined && param.default !== undefined) {
        result[paramKey] = param.default;
      }
    }

    return result;
  }

  /**
   * Gera mensagem de erro amigável
   */
  static formatErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return '';
    }

    const messages = errors.map((err) => `- ${err.message}`);
    return `Erros de validação:\n${messages.join('\n')}`;
  }

  /**
   * Valida e aplica defaults em uma única chamada
   */
  static validateAndApplyDefaults(
    params: ToolParam[],
    args: any
  ): { valid: boolean; args: any; errors: ValidationError[] } {
    // Aplicar defaults primeiro
    const argsWithDefaults = this.applyDefaults(params, args);

    // Validar
    const validation = this.validate(params, argsWithDefaults);

    return {
      valid: validation.valid,
      args: argsWithDefaults,
      errors: validation.errors,
    };
  }
}

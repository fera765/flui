/**
 * AdvancedFieldConfig - Sistema de Configuração de Campos SUPERIOR ao N8n
 * 
 * Features:
 * - Mobile-friendly e responsivo
 * - Campos padrão: NÃO EDITÁVEIS (apenas valores)
 * - Campos custom: totalmente editáveis
 * - Type-safe linker integrado
 * - Contraste de cores perfeito
 * - UX otimizada para não-técnicos
 */

import { useState } from 'react';
import { Plus, Link2, Lock, X, Info } from 'lucide-react';
import SmartFieldLinker from './SmartFieldLinker';
import { getTypeIcon, getTypeColor, extractNodeOutputs, type FieldType, type LinkedOutputField } from '../utils/typeMatching';

// ============= TYPES =============

export interface StandardField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description?: string;
  default?: any;
  readOnly: true; // Campos padrão são read-only
}

export interface CustomField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description?: string;
  readOnly: false;
}

export type Field = StandardField | CustomField;

interface FieldValue {
  [key: string]: any;
}

interface AdvancedFieldConfigProps {
  // Campos padrão da ferramenta (não editáveis)
  standardFields: StandardField[];
  
  // Campos customizados do usuário (editáveis)
  customFields: CustomField[];
  onCustomFieldsChange: (fields: CustomField[]) => void;
  
  // Valores dos campos
  values: FieldValue;
  onValuesChange: (values: FieldValue) => void;
  
  // Nodes disponíveis para linkar
  parentNodes: any[];
  isFirstNode: boolean;
}

// ============= COMPONENT =============

export default function AdvancedFieldConfig({
  standardFields,
  customFields,
  onCustomFieldsChange,
  values,
  onValuesChange,
  parentNodes,
  isFirstNode,
}: AdvancedFieldConfigProps) {
  const [linkerOpen, setLinkerOpen] = useState(false);
  const [linkingField, setLinkingField] = useState<{ key: string; label: string; type: FieldType } | null>(null);
  const [expandedCustom, setExpandedCustom] = useState(true);
  
  // Extrair outputs disponíveis dos nodes pais
  const availableOutputs: LinkedOutputField[] = parentNodes.flatMap(node => 
    extractNodeOutputs(node).map(field => ({
      ...field,
      nodeId: node.id,
      nodeName: node.data?.label || node.type || 'Node',
    }))
  );
  
  const openLinker = (key: string, label: string, type: FieldType) => {
    setLinkingField({ key, label, type });
    setLinkerOpen(true);
  };
  
  const handleLink = (reference: string) => {
    if (linkingField) {
      onValuesChange({
        ...values,
        [linkingField.key]: reference,
      });
    }
  };
  
  const addCustomField = () => {
    const newField: CustomField = {
      id: `custom-${Date.now()}`,
      key: `campo_${customFields.length + 1}`,
      label: `Campo ${customFields.length + 1}`,
      type: 'string',
      required: false,
      readOnly: false,
    };
    onCustomFieldsChange([...customFields, newField]);
  };
  
  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    onCustomFieldsChange(
      customFields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };
  
  const removeCustomField = (id: string) => {
    onCustomFieldsChange(customFields.filter(field => field.id !== id));
    // Remover valor também
    const field = customFields.find(f => f.id === id);
    if (field) {
      const newValues = { ...values };
      delete newValues[field.key];
      onValuesChange(newValues);
    }
  };
  
  const renderFieldInput = (field: Field) => {
    const value = values[field.key] || '';
    const isLinked = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    
    return (
      <div className="space-y-2">
        {/* Value Input */}
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onValuesChange({ ...values, [field.key]: e.target.value })}
            placeholder={field.readOnly && 'default' in field && field.default !== undefined ? `Padrão: ${field.default}` : `Digite ${field.label.toLowerCase()}...`}
            className={`w-full px-4 py-3 rounded-lg border transition text-sm font-medium
              ${isLinked 
                ? 'bg-green-50 border-green-500 text-green-900 placeholder:text-green-600' 
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
              }
              focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none
            `}
          />
          
          {/* Link Button */}
          {!isFirstNode && (
            <button
              onClick={() => openLinker(field.key, field.label, field.type)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition ${
                isLinked
                  ? 'bg-green-500 text-white'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
              title="Conectar com node anterior"
            >
              <Link2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Linked Info */}
        {isLinked && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            <Info className="w-3 h-3" />
            <span>Conectado: <code className="font-mono">{value}</code></span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      
      {/* First Node Warning */}
      {isFirstNode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Primeiro Node</h4>
              <p className="text-sm text-blue-700">
                Este é o primeiro node da automação. Você não pode conectar campos com nodes anteriores.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Standard Fields (Read-Only) */}
      {standardFields.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-gradient-to-r from-slate-100 to-gray-100 px-4 py-3 border-b border-gray-200 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Campos da Ferramenta</h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Campos padrão (você pode alterar apenas os valores)
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {standardFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${getTypeColor(field.type)}`}>
                    {getTypeIcon(field.type)}
                  </span>
                  <label className="font-medium text-gray-900">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {field.type}
                  </span>
                </div>
                
                {field.description && (
                  <p className="text-xs text-gray-600">{field.description}</p>
                )}
                
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Custom Fields (Editable) */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm">
        <button
          onClick={() => setExpandedCustom(!expandedCustom)}
          className="w-full bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-purple-200 rounded-t-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Campos Personalizados</h3>
              <p className="text-xs text-gray-600">
                {customFields.length} campo{customFields.length !== 1 ? 's' : ''} adicionado{customFields.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className="text-gray-600">{expandedCustom ? '▼' : '▶'}</span>
        </button>
        
        {expandedCustom && (
          <div className="p-4">
            {customFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-4">Nenhum campo personalizado ainda</p>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {customFields.map((field) => (
                  <div key={field.id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                    {/* Field Editor */}
                    <div className="space-y-3">
                      {/* Row 1: Label + Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nome do Campo *
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                            placeholder="Ex: Nome do Cliente"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo *
                          </label>
                          <div className="relative">
                            <select
                              value={field.type}
                              onChange={(e) => updateCustomField(field.id, { type: e.target.value as FieldType })}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none appearance-none"
                            >
                              <option value="string">📝 Texto</option>
                              <option value="number">🔢 Número</option>
                              <option value="boolean">☑️ Sim/Não</option>
                              <option value="array">📋 Lista</option>
                              <option value="object">📦 Objeto</option>
                              <option value="json">💾 JSON</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              ▼
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Row 2: Key + Required */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Chave (identificador)
                          </label>
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateCustomField(field.id, { key: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-mono focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                            placeholder="campo_exemplo"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-purple-500 transition">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-900">Obrigatório</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Row 3: Description */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={field.description || ''}
                          onChange={(e) => updateCustomField(field.id, { description: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                          placeholder="Descreva para que serve este campo..."
                        />
                      </div>
                      
                      {/* Row 4: Value */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Valor
                        </label>
                        {renderFieldInput(field)}
                      </div>
                      
                      {/* Remove Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => removeCustomField(field.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition"
                        >
                          <X className="w-4 h-4" />
                          Remover Campo
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Button */}
            <button
              onClick={addCustomField}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Campo Personalizado
            </button>
          </div>
        )}
      </div>
      
      {/* Smart Field Linker Modal */}
      {linkingField && (
        <SmartFieldLinker
          isOpen={linkerOpen}
          onClose={() => setLinkerOpen(false)}
          fieldKey={linkingField.key}
          fieldLabel={linkingField.label}
          fieldType={linkingField.type}
          currentValue={values[linkingField.key]}
          availableOutputs={availableOutputs}
          onLink={handleLink}
        />
      )}
      
    </div>
  );
}

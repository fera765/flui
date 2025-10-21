/**
 * FLUI - Visual Field Editor
 * 
 * Editor visual de campos SEM JSON
 * SUPERIOR AO N8N: Interface para não-técnicos, drag-and-drop, type-safe
 */

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Link2 } from 'lucide-react';
import { getTypeIcon, getTypeColor, type FieldType, type InputField } from '../utils/typeMatching';
import FieldLinker from './FieldLinker';

interface VisualFieldEditorProps {
  fields: InputField[];
  onChange: (fields: InputField[]) => void;
  parentNodes: Array<{
    id: string;
    name: string;
    type: string;
    data: any;
  }>;
  isFirstNode?: boolean;
}

const FIELD_TYPES: Array<{ value: FieldType; label: string; icon: string }> = [
  { value: 'string', label: 'Texto', icon: '📝' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'boolean', label: 'Sim/Não', icon: '✓' },
  { value: 'object', label: 'Objeto', icon: '📦' },
  { value: 'array', label: 'Lista', icon: '📋' },
];

export default function VisualFieldEditor({
  fields,
  onChange,
  parentNodes,
  isFirstNode = false,
}: VisualFieldEditorProps) {
  const [linkingField, setLinkingField] = useState<InputField | null>(null);
  
  const addField = () => {
    const newField: InputField = {
      key: `field_${Date.now()}`,
      type: 'string',
      label: 'Novo Campo',
      description: '',
      required: false,
    };
    onChange([...fields, newField]);
  };
  
  const updateField = (index: number, updates: Partial<InputField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };
  
  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };
  
  const handleLink = (index: number, linkConfig: any) => {
    updateField(index, { linkedFrom: linkConfig });
  };
  
  const handleUnlink = (index: number) => {
    updateField(index, { linkedFrom: undefined });
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Campos de Entrada
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Configure os dados que este node recebe
          </p>
        </div>
        <button
          onClick={addField}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Adicionar Campo
        </button>
      </div>
      
      {/* First Node Warning */}
      {isFirstNode && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Este é o primeiro node da automação
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Campos não podem ser conectados a nodes anteriores pois este é o trigger inicial.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">
            Nenhum campo configurado
          </p>
          <button
            onClick={addField}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Adicionar primeiro campo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.key}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition"
            >
              {/* Field Header */}
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${getTypeColor(field.type)}20` }}
                  >
                    {getTypeIcon(field.type)}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Label */}
                    <input
                      type="text"
                      value={field.label || ''}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Nome do Campo"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    
                    {/* Key */}
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateField(index, { key: e.target.value })}
                      placeholder="chave_campo"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    
                    {/* Type */}
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isFirstNode && parentNodes.length > 0 && (
                    <button
                      onClick={() => setLinkingField(field)}
                      className={`p-2 rounded-lg transition ${
                        field.linkedFrom
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Conectar a campo de node anterior"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeField(index)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                    title="Remover campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Description */}
              <div className="mt-3">
                <input
                  type="text"
                  value={field.description || ''}
                  onChange={(e) => updateField(index, { description: e.target.value })}
                  placeholder="Descrição do campo (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              {/* Required Checkbox */}
              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required || false}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span>Campo obrigatório</span>
                </label>
              </div>
              
              {/* Linked Info */}
              {field.linkedFrom && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-900 font-medium">
                        Conectado:
                      </span>
                      <span className="text-blue-700">
                        {field.linkedFrom.nodeName} → {field.linkedFrom.fieldLabel || field.linkedFrom.fieldKey}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUnlink(index)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* No Parent Nodes Warning */}
      {!isFirstNode && parentNodes.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            💡 <strong>Dica:</strong> Adicione nodes anteriores para poder conectar campos
          </p>
        </div>
      )}
      
      {/* Field Linker Modal */}
      {linkingField && (
        <FieldLinker
          inputField={linkingField}
          currentNodeId=""
          parentNodes={parentNodes}
          onLink={(linkConfig) => {
            const index = fields.findIndex(f => f.key === linkingField.key);
            if (index !== -1) {
              handleLink(index, linkConfig);
            }
            setLinkingField(null);
          }}
          onUnlink={() => {
            const index = fields.findIndex(f => f.key === linkingField.key);
            if (index !== -1) {
              handleUnlink(index);
            }
            setLinkingField(null);
          }}
          onClose={() => setLinkingField(null)}
        />
      )}
    </div>
  );
}

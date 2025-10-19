import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { listModelsStreaming } from '../services/streaming.js';

export const SettingsView: React.FC = () => {
  const { config, updateConfig, theme, setView } = useStore();
  const colors = getTheme(theme);
  const [selectedField, setSelectedField] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      if (config?.llm.apiKey && config?.llm.endpoint) {
        try {
          const models = await listModelsStreaming();
          setAvailableModels(models);
        } catch {
          // Ignorar erro silenciosamente
        }
      }
    };
    loadModels();
  }, [config?.llm.apiKey, config?.llm.endpoint]);

  const fields = [
    { label: 'Endpoint LLM', key: 'endpoint', value: config?.llm.endpoint || '' },
    { label: 'API Key', key: 'apiKey', value: config?.llm.apiKey || '' },
    { label: 'Modelo', key: 'model', value: config?.llm.model || '' },
    { label: 'Temperature', key: 'temperature', value: String(config?.llm.temperature || 0.7) },
    { label: 'Max Tokens', key: 'maxTokens', value: String(config?.llm.maxTokens || 2000) },
    { label: 'Tema', key: 'theme', value: theme },
  ];

  useInput((input, key) => {
    if (key.escape) {
      if (editMode) {
        setEditMode(false);
        setEditValue('');
      } else {
        setView('chat');
      }
      return;
    }

    if (!editMode) {
      if (key.upArrow) {
        setSelectedField((prev) => (prev > 0 ? prev - 1 : fields.length - 1));
      } else if (key.downArrow) {
        setSelectedField((prev) => (prev < fields.length - 1 ? prev + 1 : 0));
      } else if (key.return) {
        setEditMode(true);
        setEditValue(fields[selectedField].value);
      }
    } else {
      if (key.return) {
        // Salvar valor
        const field = fields[selectedField];
        if (field.key === 'theme') {
          updateConfig({ theme: editValue as any });
        } else if (['endpoint', 'apiKey', 'model'].includes(field.key)) {
          updateConfig({
            llm: {
              ...config!.llm,
              [field.key]: editValue,
            },
          });
        } else if (['temperature', 'maxTokens'].includes(field.key)) {
          updateConfig({
            llm: {
              ...config!.llm,
              [field.key]: parseFloat(editValue),
            },
          });
        }
        setEditMode(false);
        setEditValue('');
      } else if (key.backspace || key.delete) {
        setEditValue((prev) => prev.slice(0, -1));
      } else if (input) {
        setEditValue((prev) => prev + input);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          ⚙️ CONFIGURAÇÕES
        </Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
      >
        {fields.map((field, index) => (
          <Box key={field.key} marginY={1}>
            <Text color={index === selectedField ? colors.primary : colors.text}>
              {index === selectedField ? '▶ ' : '  '}
            </Text>
            <Box width={20}>
              <Text bold={index === selectedField} color={colors.secondary}>
                {field.label}:
              </Text>
            </Box>
            <Text color={colors.accent}>
              {editMode && index === selectedField
                ? editValue + '█'
                : field.key === 'apiKey' && field.value
                ? '••••••••••'
                : field.value || '(não configurado)'}
            </Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={2} flexDirection="column">
        <Text color={colors.info}>
          💡 Temas: default, cyberpunk, minimal, ocean
        </Text>
        {availableModels.length > 0 && (
          <Box marginTop={1}>
            <Text color={colors.success}>
              ✓ {availableModels.length} modelos disponíveis (use /models para selecionar)
            </Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor>
            {editMode
              ? 'Digite o novo valor | Enter salvar | Esc cancelar'
              : '↑↓ Navegar | Enter editar | Esc voltar'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

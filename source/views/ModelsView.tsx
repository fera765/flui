import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { listModels } from '../services/llm.js';

export const ModelsView: React.FC = () => {
  const { config, updateConfig, theme, setView } = useStore();
  const colors = getTheme(theme);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      setError(null);
      try {
        const modelList = await listModels();
        setModels(modelList);
        const currentModelIndex = modelList.indexOf(config?.llm.model || '');
        if (currentModelIndex >= 0) {
          setSelectedIndex(currentModelIndex);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (manualMode) {
        setManualMode(false);
        setManualInput('');
      } else {
        setView('chat');
      }
      return;
    }

    if (manualMode) {
      if (key.return && manualInput.trim()) {
        updateConfig({
          llm: {
            ...config!.llm,
            model: manualInput.trim(),
          },
        });
        setView('chat');
      } else if (key.backspace || key.delete) {
        setManualInput((prev) => prev.slice(0, -1));
      } else if (input) {
        setManualInput((prev) => prev + input);
      }
      return;
    }

    if (!loading && models.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : models.length));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => (prev < models.length ? prev + 1 : 0));
      } else if (key.return) {
        if (selectedIndex === models.length) {
          // Opção "Inserir manualmente"
          setManualMode(true);
        } else {
          const selectedModel = models[selectedIndex];
          updateConfig({
            llm: {
              ...config!.llm,
              model: selectedModel,
            },
          });
          setView('chat');
        }
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          🤖 SELECIONAR MODELO
        </Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        minHeight={10}
      >
        {loading && (
          <Box>
            <Text color={colors.info}>
              <Spinner type="dots" />
            </Text>
            <Text> Carregando modelos disponíveis...</Text>
          </Box>
        )}

        {error && (
          <Box flexDirection="column">
            <Text color={colors.error}>❌ Erro ao carregar modelos:</Text>
            <Text color={colors.error}>{error}</Text>
            <Box marginTop={1}>
              <Text dimColor>Configure seu endpoint e API key em /settings</Text>
            </Box>
          </Box>
        )}

        {!loading && !error && models.length === 0 && (
          <Text dimColor>Nenhum modelo disponível.</Text>
        )}

        {manualMode ? (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text color={colors.accent}>
                ✏️ Inserir modelo manualmente:
              </Text>
            </Box>
            <Box>
              <Text color={colors.text}>{manualInput}</Text>
              <Text color={colors.primary}>█</Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Digite o nome do modelo | Enter confirmar | Esc cancelar</Text>
            </Box>
          </Box>
        ) : (
          !loading && !error && models.length > 0 && (
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text color={colors.info}>
                  Modelo atual: {config?.llm.model}
                </Text>
              </Box>
              {models.map((model, index) => (
                <Box key={model} marginY={0}>
                  <Text color={index === selectedIndex ? colors.primary : colors.text}>
                    {index === selectedIndex ? '▶ ' : '  '}
                  </Text>
                  <Text
                    bold={index === selectedIndex}
                    color={model === config?.llm.model ? colors.success : colors.secondary}
                  >
                    {model}
                  </Text>
                  {model === config?.llm.model && (
                    <Text color={colors.success}> ✓</Text>
                  )}
                </Box>
              ))}
              <Box marginY={1} marginTop={2}>
                <Text color={selectedIndex === models.length ? colors.primary : colors.accent}>
                  {selectedIndex === models.length ? '▶ ' : '  '}
                </Text>
                <Text
                  bold={selectedIndex === models.length}
                  color={colors.accent}
                >
                  ✏️ Inserir modelo manualmente
                </Text>
              </Box>
            </Box>
          )
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          {loading || error
            ? 'Esc Voltar'
            : manualMode
            ? 'Digite o nome | Enter confirmar | Esc cancelar'
            : '↑↓ Navegar | Enter Selecionar | Esc Voltar'}
        </Text>
      </Box>
    </Box>
  );
};

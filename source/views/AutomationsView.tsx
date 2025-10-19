import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Automation } from '../types/automation.js';
import { executeAutomation } from '../services/automationExecutor.js';
import { saveExecution } from '../store/automationStorage.js';

export const AutomationsView: React.FC = () => {
  const { theme, setView, addMessage } = useStore();
  const colors = getTheme(theme);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);

  // Carregar automações do storage
  React.useEffect(() => {
    const { getAutomations } = require('../store/automationStorage.js');
    const loaded = getAutomations();
    setAutomations(loaded);
  }, []);

  useInput(async (input, key) => {
    if (key.escape) {
      setView('chat');
      return;
    }

    if (executing) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : automations.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < automations.length - 1 ? prev + 1 : 0));
    } else if (key.return && automations.length > 0) {
      // Executar automação selecionada
      const automation = automations[selectedIndex];
      setExecuting(true);

      addMessage({
        role: 'system',
        content: `🚀 Executando automação: ${automation.name}`,
        status: 'processing',
      });

      try {
        const execution = await executeAutomation(automation, (log) => {
          addMessage({
            role: 'system',
            content: `${log.status === 'running' ? '🔄' : log.status === 'completed' ? '✅' : '❌'} ${log.nodeName}: ${log.message}`,
            status: 'completed',
            metadata: {
              executionSteps: [log.message],
            },
          });
        });

        saveExecution(execution);

        addMessage({
          role: 'system',
          content: `✅ Automação concluída: ${automation.name}\n\nResultado: ${JSON.stringify(execution.result, null, 2)}`,
          status: 'completed',
        });
      } catch (error: any) {
        addMessage({
          role: 'system',
          content: `❌ Erro na automação: ${error.message}`,
          status: 'error',
        });
      } finally {
        setExecuting(false);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          🤖 AUTOMAÇÕES
        </Text>
        <Text dimColor> ({automations.length} automações)</Text>
        {executing && (
          <Text color={colors.warning}> ⏳ Executando...</Text>
        )}
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        minHeight={10}
      >
        {automations.length === 0 ? (
          <Box flexDirection="column">
            <Text dimColor>Nenhuma automação configurada ainda.</Text>
            <Box marginTop={1}>
              <Text color={colors.info}>
                💡 Automações permitem criar workflows complexos combinando agentes, MCPs e ferramentas.
              </Text>
            </Box>
          </Box>
        ) : (
          automations.map((auto, index) => (
            <Box key={auto.id} marginY={1} flexDirection="column">
              <Box>
                <Text color={index === selectedIndex ? colors.primary : colors.text}>
                  {index === selectedIndex ? '▶ ' : '  '}
                </Text>
                <Text bold color={colors.secondary}>
                  {auto.name}
                </Text>
                <Text color={auto.enabled ? colors.success : colors.error}>
                  {' '}
                  {auto.enabled ? '✓' : '✗'}
                </Text>
              </Box>
              <Box paddingLeft={3} flexDirection="column">
                <Text dimColor>{auto.description}</Text>
                {index === selectedIndex && (
                  <Box marginTop={1} flexDirection="column">
                    <Text color={colors.info}>📊 Nós: {auto.nodes.length}</Text>
                    <Text color={colors.info}>🔄 Execuções: {auto.runCount}</Text>
                    {auto.lastRun && (
                      <Text color={colors.info}>⏱️ Última execução: {new Date(auto.lastRun).toLocaleString('pt-BR')}</Text>
                    )}
                    <Box marginTop={1}>
                      <Text color={colors.accent}>
                        Pressione Enter para executar esta automação
                      </Text>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          {executing
            ? 'Aguarde a conclusão da execução...'
            : '↑↓ Navegar | Enter Executar | Esc Voltar'}
        </Text>
      </Box>
    </Box>
  );
};

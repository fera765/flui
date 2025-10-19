import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';

export const Header: React.FC = () => {
  const { theme, currentView, currentSession } = useStore();
  const colors = getTheme(theme);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      marginBottom={1}
    >
      <Box justifyContent="space-between">
        <Box>
          <Text bold color={colors.primary}>
            ⚡ FLUI
          </Text>
          <Text dimColor> - Sistema de Automação com Agentes</Text>
        </Box>
        <Box>
          <Text dimColor>View: </Text>
          <Text color={colors.accent}>{currentView}</Text>
        </Box>
      </Box>
      {currentSession && (
        <Box marginTop={1}>
          <Text dimColor>Sessão: </Text>
          <Text color={colors.secondary}>{currentSession.name}</Text>
          <Text dimColor> | </Text>
          <Text dimColor>Mensagens: </Text>
          <Text color={colors.info}>{currentSession.messages.length}</Text>
        </Box>
      )}
    </Box>
  );
};

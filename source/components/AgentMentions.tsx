import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Agent } from '../types/index.js';

interface AgentMentionsProps {
  agents: Agent[];
  selectedIndex: number;
}

export const AgentMentions: React.FC<AgentMentionsProps> = ({ agents, selectedIndex }) => {
  const { theme } = useStore();
  const colors = getTheme(theme);

  if (agents.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      marginBottom={1}
      width="100%"
    >
      <Box marginBottom={1}>
        <Text bold color={colors.accent}>
          🤖 Mencionar Agente
        </Text>
      </Box>
      {agents.map((agent, index) => (
        <Box key={agent.id} paddingLeft={1} flexDirection="column">
          <Box>
            <Text color={index === selectedIndex ? colors.primary : colors.text}>
              {index === selectedIndex ? '▶ ' : '  '}
            </Text>
            <Text
              bold={index === selectedIndex}
              color={index === selectedIndex ? colors.primary : colors.secondary}
            >
              @{agent.name}
            </Text>
            <Text dimColor> - {agent.description}</Text>
          </Box>
          {index === selectedIndex && agent.mcpIds.length > 0 && (
            <Box paddingLeft={4}>
              <Text dimColor>🔧 MCPs: </Text>
              <Text color={colors.info}>{agent.mcpIds.length}</Text>
            </Box>
          )}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>↑↓ Navegar | Enter Selecionar | Esc Cancelar</Text>
      </Box>
    </Box>
  );
};

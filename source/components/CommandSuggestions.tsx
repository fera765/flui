import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';

interface CommandSuggestionsProps {
  commands: Array<{ name: string; description: string }>;
  selectedIndex: number;
}

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({
  commands,
  selectedIndex,
}) => {
  const { theme } = useStore();
  const colors = getTheme(theme);

  if (!commands || commands.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accent}
      paddingX={1}
      marginBottom={1}
      width="100%"
    >
      <Box marginBottom={1} paddingLeft={1}>
        <Text bold color={colors.accent}>
          💡 Comandos Disponíveis ({commands.length})
        </Text>
      </Box>
      {commands.map((cmd, index) => (
        <Box key={`${cmd.name}-${index}`} paddingLeft={1}>
          <Text color={index === selectedIndex ? colors.primary : colors.text}>
            {index === selectedIndex ? '▶ ' : '  '}
          </Text>
          <Text
            bold={index === selectedIndex}
            color={index === selectedIndex ? colors.primary : colors.secondary}
          >
            /{cmd.name}
          </Text>
          <Text dimColor> - {cmd.description}</Text>
        </Box>
      ))}
      <Box marginTop={1} paddingLeft={1}>
        <Text dimColor color={colors.accent}>
          ↑↓ Navegar | Enter Selecionar | Esc Cancelar
        </Text>
      </Box>
    </Box>
  );
};

import React, { useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Message } from '../types/index.js';

interface TimelineProps {
  height?: number;
}

export const Timeline: React.FC<TimelineProps> = ({ height = 20 }) => {
  const { messages, theme } = useStore();
  const colors = getTheme(theme);

  const renderMessage = (msg: Message) => {
    const time = format(new Date(msg.timestamp), 'HH:mm:ss', { locale: ptBR });
    const roleColor =
      msg.role === 'user'
        ? colors.primary
        : msg.role === 'assistant'
        ? colors.accent
        : msg.role === 'agent'
        ? colors.secondary
        : colors.text;

    const roleIcon =
      msg.role === 'user'
        ? '👤'
        : msg.role === 'assistant'
        ? '🤖'
        : msg.role === 'agent'
        ? '⚙️'
        : 'ℹ️';

    return (
      <Box key={msg.id} flexDirection="column" marginBottom={1}>
        <Box>
          <Text color={colors.info} dimColor>
            [{time}]
          </Text>
          <Text> </Text>
          <Text>{roleIcon}</Text>
          <Text> </Text>
          <Text bold color={roleColor}>
            {msg.role === 'agent' && msg.agentName ? msg.agentName : msg.role.toUpperCase()}
          </Text>
          {msg.status === 'processing' && (
            <Text color={colors.warning}>
              {' '}
              <Spinner type="dots" />
            </Text>
          )}
          {msg.status === 'error' && (
            <Text color={colors.error}> ❌</Text>
          )}
        </Box>
        <Box paddingLeft={2} flexDirection="column">
          <Text color={colors.text}>{msg.content}</Text>
          {msg.metadata && msg.metadata.toolCalls && (
            <Box marginTop={1}>
              <Text dimColor>🔧 Tools: </Text>
              <Text color={colors.info}>{msg.metadata.toolCalls.join(', ')}</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      paddingY={1}
      height={height}
    >
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          📝 Timeline de Execução
        </Text>
      </Box>
      <Box flexDirection="column" overflow="hidden">
        {messages.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height={height - 4}>
            <Text dimColor>Nenhuma mensagem ainda. Comece digitando abaixo!</Text>
          </Box>
        ) : (
          messages.map(renderMessage)
        )}
      </Box>
    </Box>
  );
};

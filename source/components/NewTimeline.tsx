import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Message } from '../types/index.js';

interface NewTimelineProps {
  height?: number;
}

export const NewTimeline: React.FC<NewTimelineProps> = ({ height = 20 }) => {
  const { messages, theme } = useStore();
  const colors = getTheme(theme);

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    
    // Mensagens do sistema aparecem diferentes
    if (msg.role === 'system') {
      return (
        <Box key={msg.id} marginBottom={1}>
          <Text color={colors.info}>ℹ️ {msg.content}</Text>
        </Box>
      );
    }

    return (
      <Box key={msg.id} flexDirection="column" marginBottom={1}>
        {isUser ? (
          // Mensagem do usuário - box escuro
          <Box
            borderStyle="round"
            borderColor={colors.border}
            paddingX={1}
            paddingY={0}
          >
            <Text color={colors.text}>▶ {msg.content}</Text>
          </Box>
        ) : (
          // Resposta da LLM - cor clara, sem box
          <Box paddingLeft={2}>
            <Text color={colors.accent}>{msg.content}</Text>
            {msg.status === 'processing' && (
              <Text color={colors.warning}> ⏳</Text>
            )}
            {msg.metadata?.executionSteps && (
              <Box marginTop={1} paddingLeft={2} flexDirection="column">
                <Text dimColor>🔄 Automação em andamento:</Text>
                {msg.metadata.executionSteps.map((step: string, idx: number) => (
                  <Box key={idx} paddingLeft={2}>
                    <Text color={colors.info}>• {step}</Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
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
      <Box flexDirection="column" overflow="hidden">
        {messages.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height={height - 4}>
            <Text dimColor>Timeline vazia. Digite /help para começar</Text>
          </Box>
        ) : (
          messages.map(renderMessage)
        )}
      </Box>
    </Box>
  );
};

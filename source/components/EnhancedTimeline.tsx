import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Message } from '../types/index.js';

interface EnhancedTimelineProps {
  // Sem height fixo - usa flexGrow
}

export const EnhancedTimeline: React.FC<EnhancedTimelineProps> = () => {
  const { messages, theme } = useStore();
  const colors = getTheme(theme);

  const renderMarkdown = (content: string): string => {
    // Renderização básica de markdown (pode expandir)
    let rendered = content;
    
    // Bold
    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Italic
    rendered = rendered.replace(/\*(.*?)\*/g, '$1');
    
    // Code inline
    rendered = rendered.replace(/`([^`]+)`/g, '`$1`');
    
    // Headers
    rendered = rendered.replace(/^### (.*)/gm, '▸ $1');
    rendered = rendered.replace(/^## (.*)/gm, '▸▸ $1');
    rendered = rendered.replace(/^# (.*)/gm, '▸▸▸ $1');
    
    return rendered;
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    
    // Mensagens do sistema
    if (msg.role === 'system') {
      return (
        <Box key={msg.id} marginBottom={1} flexDirection="column">
          <Box borderStyle="single" borderColor={colors.info} paddingX={1}>
            <Text color={colors.info} bold>ℹ️ Sistema</Text>
          </Box>
          <Box paddingLeft={2} paddingTop={0} paddingBottom={1}>
            <Text color={colors.text}>{msg.content}</Text>
          </Box>
        </Box>
      );
    }

    // Mensagens do usuário
    if (isUser) {
      return (
        <Box key={msg.id} marginBottom={1} flexDirection="column">
          <Box 
            borderStyle="round" 
            borderColor={colors.primary}
            paddingX={2}
            paddingY={1}
          >
            <Text color={colors.text} bold>▶ </Text>
            <Text color={colors.text}>{msg.content}</Text>
          </Box>
        </Box>
      );
    }

    // Mensagens da LLM/Agente
    return (
      <Box key={msg.id} marginBottom={1} flexDirection="column">
        <Box paddingLeft={3} paddingRight={2} paddingY={1} flexDirection="column">
          {msg.agentName && (
            <Box marginBottom={0}>
              <Text color={colors.accent} bold>🤖 {msg.agentName}</Text>
            </Box>
          )}
          <Box flexDirection="column">
            <Text color={colors.accent}>
              {renderMarkdown(msg.content)}
            </Text>
            {msg.status === 'processing' && (
              <Text color={colors.warning}> ⏳ Processando...</Text>
            )}
          </Box>
          {msg.metadata?.executionSteps && (
            <Box marginTop={1} paddingLeft={2} flexDirection="column" borderStyle="single" borderColor={colors.border}>
              <Text color={colors.info} bold>🔄 Automação:</Text>
              {msg.metadata.executionSteps.map((step: string, idx: number) => (
                <Box key={idx} paddingLeft={1}>
                  <Text color={colors.success}>  ✓ </Text>
                  <Text color={colors.text}>{step}</Text>
                </Box>
              ))}
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
      flexGrow={1}
      overflow="hidden"
    >
      {messages.length === 0 ? (
        <Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Text dimColor>Timeline vazia. Digite /help para começar</Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {messages.map(renderMessage)}
        </Box>
      )}
    </Box>
  );
};

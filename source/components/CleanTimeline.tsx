import React, { useRef, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Message } from '../types/index.js';

export const CleanTimeline: React.FC = () => {
  const { messages, theme } = useStore();
  const colors = getTheme(theme);
  const lastMessageCount = useRef(messages.length);

  // Prevenir re-renders desnecessários
  useEffect(() => {
    lastMessageCount.current = messages.length;
  }, [messages.length]);

  const renderToolExecution = (toolName: string, output?: string) => {
    const lines = output ? output.split('\n').slice(0, 10) : [];
    const totalLines = output ? output.split('\n').length : 0;

    return (
      <Box key={`tool-${toolName}`} flexDirection="column" marginTop={1} marginBottom={1}>
        <Box borderStyle="single" borderColor={colors.warning} paddingX={1}>
          <Text color={colors.warning} bold>TOOL: {toolName}</Text>
        </Box>
        {lines.length > 0 && (
          <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
            {lines.map((line, idx) => (
              <Text key={idx} color={colors.text} dimColor>{line}</Text>
            ))}
            {totalLines > 10 && (
              <Text dimColor>... ({totalLines} linhas totais)</Text>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === 'user';
    
    // Sistema
    if (msg.role === 'system') {
      return (
        <Box key={msg.id} marginY={1}>
          <Text color={colors.info}>{msg.content}</Text>
        </Box>
      );
    }

    // Usuário - com destaque
    if (isUser) {
      return (
        <Box key={msg.id} marginY={1} paddingX={2} paddingY={1}>
          <Text color={colors.text} bold>
            &gt; {msg.content}
          </Text>
        </Box>
      );
    }

    // LLM - sem fundo, cor clara
    return (
      <Box key={msg.id} flexDirection="column" marginY={1} paddingLeft={2}>
        {msg.agentName && (
          <Text color={colors.accent} bold>{msg.agentName}:</Text>
        )}
        <Box flexDirection="column">
          <Text color={colors.accent}>{msg.content}</Text>
          {msg.status === 'processing' && (
            <Text color={colors.warning}> ... processando</Text>
          )}
        </Box>
        
        {/* Tool executions */}
        {msg.metadata?.toolCalls && msg.metadata.toolCalls.map((tool: any, idx: number) => (
          renderToolExecution(tool.name, tool.output)
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
      {messages.length === 0 ? (
        <Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Text dimColor>Timeline vazia. Digite /help para começar</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {messages.map(renderMessage)}
        </Box>
      )}
    </Box>
  );
};

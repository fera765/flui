import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Message } from '../types/index.js';

export const StableTimeline: React.FC = () => {
  const messages = useStore((state) => state.messages);
  const theme = useStore((state) => state.theme);
  const colors = getTheme(theme);

  // Deduplicar mensagens por ID
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter((msg: Message) => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [messages]);

  const renderedMessages = useMemo(() => {
    return uniqueMessages.map((msg: Message) => {
      if (msg.role === 'system') {
        return (
          <Box key={msg.id} paddingY={0}>
            <Text color={colors.info}>{msg.content}</Text>
          </Box>
        );
      }

      if (msg.role === 'user') {
        return (
          <Box key={msg.id} paddingY={0} paddingX={1}>
            <Text bold color={colors.text}>&gt; {msg.content}</Text>
          </Box>
        );
      }

      // LLM/Agent
      return (
        <Box key={msg.id} flexDirection="column" paddingY={0} paddingLeft={1}>
          {msg.agentName && (
            <Text color={colors.accent} bold>{msg.agentName}:</Text>
          )}
          <Text color={colors.accent}>{msg.content}</Text>
          {msg.status === 'processing' && (
            <Text dimColor> ...</Text>
          )}
          
          {/* Tools */}
          {msg.metadata?.toolCalls && Array.isArray(msg.metadata.toolCalls) && msg.metadata.toolCalls.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              {msg.metadata.toolCalls.map((tool: any, idx: number) => (
                <Box key={idx} flexDirection="column" paddingY={0}>
                  <Box borderStyle="single" borderColor={colors.warning} paddingX={1}>
                    <Text color={colors.warning} bold>TOOL: {tool.name}</Text>
                  </Box>
                  {tool.output && (
                    <Box flexDirection="column" paddingLeft={1}>
                      {tool.output.split('\n').slice(0, 10).map((line: string, i: number) => (
                        <Text key={i} dimColor>{line}</Text>
                      ))}
                      {tool.output.split('\n').length > 10 && (
                        <Text dimColor>... ({tool.output.split('\n').length} linhas)</Text>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      );
    });
  }, [uniqueMessages, colors]);

  if (uniqueMessages.length === 0) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text dimColor>Digite /help para começar</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
      {renderedMessages}
    </Box>
  );
};

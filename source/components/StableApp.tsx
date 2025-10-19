import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { StableTimeline } from './StableTimeline.js';
import { InputArea } from './InputArea.js';
import { SettingsView } from '../views/SettingsView.js';
import { AgentsView } from '../views/AgentsView.js';
import { MCPsView } from '../views/MCPsView.js';
import { ModelsView } from '../views/ModelsView.js';
import { ThemeSelectView } from '../views/ThemeSelectView.js';
import { CompleteAutomationBuilder } from '../views/CompleteAutomationBuilder.js';
import { SessionsView } from '../views/SessionsView.js';
import { executeCommand } from '../commands/index.js';
import { sendStreamingMessageWithTools, interruptStreaming } from '../services/streamingTools.js';
import { initializeDefaults } from '../utils/init.js';

export const StableApp: React.FC = () => {
  const { currentView, initialize, addMessage, updateMessage, theme } = useStore();
  const colors = getTheme(theme);
  const [isProcessing, setIsProcessing] = useState(false);
  const initRef = useRef(false);
  const { exit } = useApp();

  // Inicializar apenas uma vez
  useEffect(() => {
    if (!initRef.current) {
      initialize();
      initializeDefaults();
      initRef.current = true;
    }
  }, []);

  const handleSubmit = useCallback(async (input: string) => {
    if (isProcessing) {
      interruptStreaming();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const isCommand = await executeCommand(input);
    if (isCommand) return;

    setIsProcessing(true);

    addMessage({
      role: 'user',
      content: input,
      status: 'completed',
    });

    const mentionMatch = input.match(/@(\w+)/);
    let selectedAgent = null;

    if (mentionMatch) {
      const agents = useStore.getState().agents;
      selectedAgent = agents.find(
        (a) => a.name.toLowerCase() === mentionMatch[1].toLowerCase()
      );
    }

    addMessage({
      role: selectedAgent ? 'agent' : 'assistant',
      content: '',
      status: 'processing',
      agentId: selectedAgent?.id,
      agentName: selectedAgent?.name,
    });

    try {
      let fullResponse = '';
      let toolCalls: any[] = [];
      
      await sendStreamingMessageWithTools(
        input,
        selectedAgent || undefined,
        (chunk: string) => {
          fullResponse += chunk;
          const messages = useStore.getState().messages;
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.status === 'processing') {
            updateMessage(lastMessage.id, {
              content: fullResponse,
              status: 'processing',
            });
          }
        },
        () => {
          const messages = useStore.getState().messages;
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
            updateMessage(lastMessage.id, {
              content: fullResponse,
              status: 'completed',
              metadata: { ...lastMessage.metadata, toolCalls },
            });
          }
          setIsProcessing(false);
        },
        (error: Error) => {
          const messages = useStore.getState().messages;
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
            updateMessage(lastMessage.id, {
              content: `Erro: ${error.message}`,
              status: 'error',
            });
          }
          setIsProcessing(false);
        },
        (toolCall: string, output?: string) => {
          toolCalls.push({ name: toolCall, output });
        }
      );
    } catch (error: any) {
      const messages = useStore.getState().messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        updateMessage(lastMessage.id, {
          content: `Erro: ${error.message}`,
          status: 'error',
        });
      }
      setIsProcessing(false);
    }
  }, [isProcessing, addMessage, updateMessage]);

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header minimalista */}
      <Box paddingX={2} paddingY={0}>
        <Text bold color={colors.primary}>FLUI</Text>
        <Text color={colors.text}> · </Text>
        <Text color={colors.secondary}>{currentView}</Text>
      </Box>

      {/* Conteúdo */}
      <Box flexDirection="column" flexGrow={1} width="100%">
        {currentView === 'chat' && (
          <>
            <StableTimeline />
            <Box paddingX={1}>
              <InputArea onSubmit={handleSubmit} />
            </Box>
          </>
        )}

        {currentView === 'settings' && <SettingsView />}
        {currentView === 'agents' && <AgentsView />}
        {currentView === 'mcps' && <MCPsView />}
        {currentView === 'models' && <ModelsView />}
        {currentView === 'theme' && <ThemeSelectView />}
        {currentView === 'automations' && <CompleteAutomationBuilder />}
        {currentView === 'sessions' && <SessionsView />}
      </Box>
    </Box>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { CleanTimeline } from './CleanTimeline.js';
import { InputArea } from './InputArea.js';
import { SettingsView } from '../views/SettingsView.js';
import { AgentsView } from '../views/AgentsView.js';
import { MCPsView } from '../views/MCPsView.js';
import { ModelsView } from '../views/ModelsView.js';
import { ThemeSelectView } from '../views/ThemeSelectView.js';
import { AutomationBuilder } from '../views/AutomationBuilder.js';
import { SessionsView } from '../views/SessionsView.js';
import { executeCommand } from '../commands/index.js';
import { sendStreamingMessageWithTools, interruptStreaming } from '../services/streamingTools.js';
import { initializeDefaults } from '../utils/init.js';

export const CleanApp: React.FC = () => {
  const { currentView, initialize, addMessage, updateMessage, theme } = useStore();
  const colors = getTheme(theme);
  const [isProcessing, setIsProcessing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (mountedRef.current) {
      initialize();
      initializeDefaults();
      mountedRef.current = false;
    }
  }, []);

  const handleSubmit = async (input: string) => {
    // Se já está processando, interromper
    if (isProcessing) {
      interruptStreaming();
      setIsProcessing(false);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verificar se é um comando
    const isCommand = await executeCommand(input);
    if (isCommand) {
      return;
    }

    setIsProcessing(true);

    // Adicionar mensagem do usuário
    addMessage({
      role: 'user',
      content: input,
      status: 'completed',
    });

    // Verificar menção a agente
    const mentionMatch = input.match(/@(\w+)/);
    let selectedAgent = null;

    if (mentionMatch) {
      const agentName = mentionMatch[1];
      const agents = useStore.getState().agents;
      selectedAgent = agents.find(
        (a) => a.name.toLowerCase() === agentName.toLowerCase()
      );
    }

    // Adicionar mensagem de processamento
    const processingMessageId = addMessage({
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
          
          if (lastMessage) {
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
              metadata: {
                ...lastMessage.metadata,
                toolCalls,
              },
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
  };

  // Header limpo
  const renderHeader = () => (
    <Box borderStyle="round" borderColor={colors.border} paddingX={2}>
      <Text bold color={colors.primary}>FLUI</Text>
      <Text color={colors.text}> - </Text>
      <Text color={colors.secondary}>{currentView === 'chat' ? 'Chat' : currentView}</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" height="100%">
      {renderHeader()}
      
      {currentView === 'chat' && (
        <Box flexDirection="column" flexGrow={1}>
          <CleanTimeline />
          <Box borderStyle="round" borderColor={colors.border}>
            <InputArea onSubmit={handleSubmit} />
          </Box>
        </Box>
      )}

      {currentView === 'settings' && <SettingsView />}
      {currentView === 'agents' && <AgentsView />}
      {currentView === 'mcps' && <MCPsView />}
      {currentView === 'models' && <ModelsView />}
      {currentView === 'theme' && <ThemeSelectView />}
      {currentView === 'automations' && <AutomationBuilder />}
      {currentView === 'sessions' && <SessionsView />}
    </Box>
  );
};

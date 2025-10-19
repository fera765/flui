import React, { useEffect } from 'react';
import { Box } from 'ink';
import { useStore } from '../store/store.js';
import { Header } from './Header.js';
import { NewTimeline } from './NewTimeline.js';
import { InputArea } from './InputArea.js';
import { SettingsView } from '../views/SettingsView.js';
import { AgentsView } from '../views/AgentsView.js';
import { MCPsView } from '../views/MCPsView.js';
import { ModelsView } from '../views/ModelsView.js';
import { ThemeSelectView } from '../views/ThemeSelectView.js';
import { AutomationsView } from '../views/AutomationsView.js';
import { executeCommand } from '../commands/index.js';
import { sendStreamingMessage } from '../services/streaming.js';
import { initializeDefaults } from '../utils/init.js';

export const App: React.FC = () => {
  const { currentView, initialize, addMessage, updateMessage, getAgentById } = useStore();

  useEffect(() => {
    initialize();
    initializeDefaults();
  }, [initialize]);

  const handleSubmit = async (input: string) => {
    // Verificar se é um comando
    const isCommand = await executeCommand(input);
    if (isCommand) {
      return;
    }

    // Adicionar mensagem do usuário
    addMessage({
      role: 'user',
      content: input,
      status: 'completed',
    });

    // Verificar se há menção a um agente (@agentName)
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
    addMessage({
      role: selectedAgent ? 'agent' : 'assistant',
      content: '',
      status: 'processing',
      agentId: selectedAgent?.id,
      agentName: selectedAgent?.name,
    });

    try {
      let fullResponse = '';
      
      // Enviar para LLM com streaming
      await sendStreamingMessage(
        input,
        selectedAgent || undefined,
        (chunk: string) => {
          fullResponse += chunk;
          // Atualizar mensagem em tempo real
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
          // Conclusão
          const messages = useStore.getState().messages;
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage) {
            updateMessage(lastMessage.id, {
              content: fullResponse,
              status: 'completed',
            });
          }
        },
        (error: Error) => {
          // Erro
          const messages = useStore.getState().messages;
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage) {
            updateMessage(lastMessage.id, {
              content: `❌ Erro: ${error.message}`,
              status: 'error',
            });
          }
        }
      );
    } catch (error: any) {
      // Erro geral
      const messages = useStore.getState().messages;
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage) {
        updateMessage(lastMessage.id, {
          content: `❌ Erro: ${error.message}`,
          status: 'error',
        });
      }
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header />
      
      {currentView === 'chat' && (
        <Box flexDirection="column" flexGrow={1}>
          <NewTimeline height={15} />
          <Box marginTop={1}>
            <InputArea onSubmit={handleSubmit} />
          </Box>
        </Box>
      )}

      {currentView === 'settings' && <SettingsView />}
      {currentView === 'agents' && <AgentsView />}
      {currentView === 'mcps' && <MCPsView />}
      {currentView === 'models' && <ModelsView />}
      {currentView === 'theme' && <ThemeSelectView />}
      {currentView === 'automations' && <AutomationsView />}
    </Box>
  );
};

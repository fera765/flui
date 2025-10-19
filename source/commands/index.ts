import { Command } from '../types/index.js';
import { useStore } from '../store/store.js';
import { testLLMConnection } from '../services/streaming.js';

// Definição de comandos
export const getCommands = (): Command[] => {
  return [
    {
      name: 'help',
      description: 'Mostra todos os comandos disponíveis',
      aliases: ['h', '?'],
      handler: async () => {
        const store = useStore.getState();
        const commands = getCommands();
        const helpMessage = commands
          .map((cmd) => `/${cmd.name} - ${cmd.description}`)
          .join('\n');
        store.addMessage({
          role: 'system',
          content: `📚 Comandos Disponíveis:\n\n${helpMessage}`,
          status: 'completed',
        });
      },
    },
    {
      name: 'clear',
      description: 'Limpa a timeline de mensagens',
      aliases: ['cls'],
      handler: async () => {
        const store = useStore.getState();
        const session = store.currentSession;
        if (session) {
          const updatedSession = {
            ...session,
            messages: [],
            updatedAt: new Date().toISOString(),
          };
          store.switchSession(updatedSession.id);
        }
      },
    },
    {
      name: 'settings',
      description: 'Abre as configurações do sistema',
      aliases: ['config', 'cfg'],
      handler: async () => {
        const store = useStore.getState();
        store.setView('settings');
      },
    },
    {
      name: 'agents',
      description: 'Gerenciar agentes',
      handler: async () => {
        const store = useStore.getState();
        store.setView('agents');
      },
    },
    {
      name: 'mcps',
      description: 'Gerenciar MCPs (Model Context Protocols)',
      handler: async () => {
        const store = useStore.getState();
        store.setView('mcps');
      },
    },
    {
      name: 'automations',
      description: 'Gerenciar automações',
      aliases: ['auto'],
      handler: async () => {
        const store = useStore.getState();
        store.setView('automations');
      },
    },
    {
      name: 'sessions',
      description: 'Gerenciar sessões',
      aliases: ['sess'],
      handler: async () => {
        const store = useStore.getState();
        store.setView('sessions');
      },
    },
    {
      name: 'models',
      description: 'Selecionar modelo LLM',
      handler: async () => {
        const store = useStore.getState();
        store.setView('models');
      },
    },
    {
      name: 'theme',
      description: 'Alterar tema da interface',
      handler: async () => {
        const store = useStore.getState();
        store.setView('theme');
      },
    },
    {
      name: 'chat',
      description: 'Voltar para o chat',
      handler: async () => {
        const store = useStore.getState();
        store.setView('chat');
      },
    },
    {
      name: 'new',
      description: 'Criar nova sessão',
      handler: async (args: string[]) => {
        const store = useStore.getState();
        const name = args.join(' ') || `Sessão ${store.sessions.length + 1}`;
        store.createSession(name);
        store.addMessage({
          role: 'system',
          content: `✅ Nova sessão criada: ${name}`,
          status: 'completed',
        });
      },
    },
    {
      name: 'status',
      description: 'Mostra status do sistema',
      handler: async () => {
        const store = useStore.getState();
        const status = `
📊 Status do Sistema:
- Agentes: ${store.agents.length}
- MCPs: ${store.mcps.length}
- Sessões: ${store.sessions.length}
- Tema: ${store.theme}
- Modelo: ${store.config?.llm.model || 'Não configurado'}
        `.trim();
        store.addMessage({
          role: 'system',
          content: status,
          status: 'completed',
        });
      },
    },
    {
      name: 'test',
      description: 'Testar conexão com LLM',
      handler: async () => {
        const store = useStore.getState();
        
        store.addMessage({
          role: 'system',
          content: '🔄 Testando conexão com LLM...',
          status: 'processing',
        });

        const result = await testLLMConnection();
        
        const messages = store.messages;
        const lastMessage = messages[messages.length - 1];
        
        if (lastMessage) {
          store.updateMessage(lastMessage.id, {
            content: result.success
              ? `✅ ${result.message}\n\n📋 Primeiros 10 modelos:\n${result.models?.slice(0, 10).map(m => `  • ${m}`).join('\n')}${result.models && result.models.length > 10 ? `\n  ... e mais ${result.models.length - 10} modelos` : ''}`
              : `❌ ${result.message}\n\n💡 Configure em /settings`,
            status: result.success ? 'completed' : 'error',
          });
        }
      },
    },
  ];
};

export const executeCommand = async (input: string): Promise<boolean> => {
  if (!input.startsWith('/')) {
    return false;
  }

  const parts = input.slice(1).split(' ');
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  const commands = getCommands();
  const command = commands.find(
    (cmd) => cmd.name === commandName || cmd.aliases?.includes(commandName)
  );

  if (command) {
    await command.handler(args);
    return true;
  }

  const store = useStore.getState();
  store.addMessage({
    role: 'system',
    content: `❌ Comando não encontrado: ${commandName}. Digite /help para ver comandos disponíveis.`,
    status: 'error',
  });

  return true;
};

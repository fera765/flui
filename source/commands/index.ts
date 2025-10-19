import { Command } from '../types/index.js';
import { useStore } from '../store/store.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ToolExecutor } from '../core/toolExecutor.js';
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
    {
      name: 'tools',
      description: 'Gerenciar ferramentas do sistema',
      aliases: ['tool', 't'],
      handler: async (args: string[]) => {
        const store = useStore.getState();
        const registry = getToolRegistry();
        const subcommand = args[0];

        if (!subcommand || subcommand === 'list') {
          // Listar todas as ferramentas com paginação
          const pageArg = args.find(a => a.startsWith('--page='));
          const pageSizeArg = args.find(a => a.startsWith('--page-size='));
          
          const page = pageArg ? parseInt(pageArg.split('=')[1]) : 1;
          const pageSize = pageSizeArg ? parseInt(pageSizeArg.split('=')[1]) : 50;
          
          const result = registry.list({ page, pageSize });
          const tools = result.tools;
          
          const grouped = tools.reduce((acc, tool) => {
            if (!acc[tool.category]) acc[tool.category] = [];
            acc[tool.category].push(tool);
            return acc;
          }, {} as Record<string, typeof tools>);

          let output = '🔧 **Ferramentas Disponíveis**\n\n';
          
          for (const [category, categoryTools] of Object.entries(grouped)) {
            output += `**${category.toUpperCase()}**\n`;
            categoryTools.forEach((tool) => {
              const metrics = tool.metrics;
              output += `  • ${tool.name} (${tool.id}) v${tool.version}\n`;
              output += `    ${tool.description}\n`;
              output += `    📊 Execuções: ${metrics.executionCount} | Sucesso: ${metrics.successCount} | Falha: ${metrics.failureCount}\n`;
            });
            output += '\n';
          }
          
          output += `\n📦 **Página ${result.page} de ${result.totalPages}** (${result.total} ferramentas no total)`;
          
          if (result.page < result.totalPages) {
            output += `\n💡 Use: /tools list --page=${result.page + 1} para ver mais`;
          }
          
          store.addMessage({
            role: 'system',
            content: output,
            status: 'completed',
          });
        } else if (subcommand === 'info') {
          // Informações detalhadas de uma ferramenta
          const toolId = args[1];
          if (!toolId) {
            store.addMessage({
              role: 'system',
              content: '❌ Uso: /tools info <tool-id>',
              status: 'error',
            });
            return;
          }

          const tool = registry.get(toolId);
          if (!tool) {
            store.addMessage({
              role: 'system',
              content: `❌ Ferramenta '${toolId}' não encontrada`,
              status: 'error',
            });
            return;
          }

          let output = `🔧 **${tool.name}** (${tool.id})\n\n`;
          output += `**Descrição:** ${tool.description}\n`;
          output += `**Categoria:** ${tool.category}\n`;
          output += `**Versão:** ${tool.version}\n\n`;
          
          output += `**Parâmetros:**\n`;
          tool.params.forEach((param) => {
            const required = param.required ? '(obrigatório)' : '(opcional)';
            output += `  • ${param.name}: ${param.type} ${required}\n`;
            output += `    ${param.description}\n`;
            if (param.default !== undefined) {
              output += `    Padrão: ${JSON.stringify(param.default)}\n`;
            }
          });

          output += `\n**Saída:**\n`;
          output += `  Tipo: ${tool.output.type}\n`;
          output += `  ${tool.output.description}\n`;

          const metrics = tool.metrics;
          output += `\n**📊 Métricas:**\n`;
          output += `  • Execuções: ${metrics.executionCount}\n`;
          output += `  • Sucesso: ${metrics.successCount}\n`;
          output += `  • Falhas: ${metrics.failureCount}\n`;
          output += `  • Tempo médio: ${metrics.averageExecutionTime.toFixed(2)}ms\n`;
          if (metrics.lastExecutedAt) {
            output += `  • Última execução: ${metrics.lastExecutedAt}\n`;
          }

          if (tool.ui.examples && tool.ui.examples.length > 0) {
            output += `\n**📚 Exemplos:**\n`;
            tool.ui.examples.forEach((example, i) => {
              output += `  ${i + 1}. ${example.title}\n`;
              output += `     ${example.description}\n`;
            });
          }

          store.addMessage({
            role: 'system',
            content: output,
            status: 'completed',
          });
        } else if (subcommand === 'exec' || subcommand === 'execute') {
          // Executar uma ferramenta
          const toolId = args[1];
          if (!toolId) {
            store.addMessage({
              role: 'system',
              content: '❌ Uso: /tools exec <tool-id> <params-json>',
              status: 'error',
            });
            return;
          }

          const tool = registry.get(toolId);
          if (!tool) {
            store.addMessage({
              role: 'system',
              content: `❌ Ferramenta '${toolId}' não encontrada`,
              status: 'error',
            });
            return;
          }

          // Parse params JSON
          const paramsJson = args.slice(2).join(' ');
          let params = {};
          
          if (paramsJson) {
            try {
              params = JSON.parse(paramsJson);
            } catch {
              store.addMessage({
                role: 'system',
                content: '❌ Parâmetros devem ser um JSON válido',
                status: 'error',
              });
              return;
            }
          }

          store.addMessage({
            role: 'system',
            content: `🔄 Executando ${tool.name}...`,
            status: 'processing',
          });

          try {
            const context = {
              automationId: 'cli-exec',
              nodeId: 'cli-exec',
              previousResults: {},
              globalContext: {},
            };

            const result = await ToolExecutor.execute(toolId, params, context);

            const messages = store.messages;
            const lastMessage = messages[messages.length - 1];

            if (lastMessage) {
              const output = result.success
                ? `✅ **Execução concluída**\n\n**Resultado:**\n\`\`\`json\n${JSON.stringify(result.result, null, 2)}\n\`\`\`\n\n⏱️ Tempo: ${result.executionTime}ms`
                : `❌ **Erro na execução**\n\n${result.error}`;

              store.updateMessage(lastMessage.id, {
                content: output,
                status: result.success ? 'completed' : 'error',
              });
            }
          } catch (error: any) {
            const messages = store.messages;
            const lastMessage = messages[messages.length - 1];
            
            if (lastMessage) {
              store.updateMessage(lastMessage.id, {
                content: `❌ Erro: ${error.message}`,
                status: 'error',
              });
            }
          }
        } else if (subcommand === 'delete') {
          // Deletar ferramenta
          const toolId = args[1];
          if (!toolId) {
            store.addMessage({
              role: 'system',
              content: '❌ Uso: /tools delete <tool-id>',
              status: 'error',
            });
            return;
          }

          if (!registry.has(toolId)) {
            store.addMessage({
              role: 'system',
              content: `❌ Ferramenta '${toolId}' não encontrada`,
              status: 'error',
            });
            return;
          }

          const removed = registry.unregister(toolId);
          
          store.addMessage({
            role: 'system',
            content: removed 
              ? `✅ Ferramenta '${toolId}' removida com sucesso`
              : `❌ Erro ao remover ferramenta '${toolId}'`,
            status: removed ? 'completed' : 'error',
          });
        } else if (subcommand === 'test') {
          // Testar ferramenta (alias para exec)
          const toolId = args[1];
          if (!toolId) {
            store.addMessage({
              role: 'system',
              content: '❌ Uso: /tools test <tool-id> <params-json>',
              status: 'error',
            });
            return;
          }

          const tool = registry.get(toolId);
          if (!tool) {
            store.addMessage({
              role: 'system',
              content: `❌ Ferramenta '${toolId}' não encontrada`,
              status: 'error',
            });
            return;
          }

          // Parse params JSON
          const paramsJson = args.slice(2).join(' ');
          let params = {};
          
          if (paramsJson) {
            try {
              params = JSON.parse(paramsJson);
            } catch {
              store.addMessage({
                role: 'system',
                content: '❌ Parâmetros devem ser um JSON válido',
                status: 'error',
              });
              return;
            }
          }

          store.addMessage({
            role: 'system',
            content: `🧪 Testando ${tool.name}...`,
            status: 'processing',
          });

          try {
            const context = {
              automationId: 'cli-test',
              nodeId: 'cli-test',
              previousResults: {},
              globalContext: {},
            };

            const startTime = Date.now();
            const result = await ToolExecutor.execute(toolId, params, context);
            const duration = Date.now() - startTime;

            const messages = store.messages;
            const lastMessage = messages[messages.length - 1];

            if (lastMessage) {
              let output = '';
              
              if (result.success) {
                output = `✅ **Teste concluído com sucesso**\n\n`;
                output += `**Tool:** ${tool.name} (${tool.id})\n`;
                output += `**Duração:** ${duration}ms\n\n`;
                output += `**Resultado:**\n\`\`\`json\n${JSON.stringify(result.result, null, 2)}\n\`\`\``;
              } else {
                output = `❌ **Teste falhou**\n\n`;
                output += `**Tool:** ${tool.name} (${tool.id})\n`;
                output += `**Erro:** ${result.error}`;
              }

              store.updateMessage(lastMessage.id, {
                content: output,
                status: result.success ? 'completed' : 'error',
              });
            }
          } catch (error: any) {
            const messages = store.messages;
            const lastMessage = messages[messages.length - 1];
            
            if (lastMessage) {
              store.updateMessage(lastMessage.id, {
                content: `❌ Erro ao testar: ${error.message}`,
                status: 'error',
              });
            }
          }
        } else if (subcommand === 'categories') {
          // Listar categorias
          const categories = registry.getCategories();
          
          let output = '📁 **Categorias de Ferramentas**\n\n';
          categories.forEach((category) => {
            const result = registry.list({ category });
            output += `  • ${category}: ${result.tools.length} ferramenta(s)\n`;
          });

          store.addMessage({
            role: 'system',
            content: output,
            status: 'completed',
          });
        } else {
          store.addMessage({
            role: 'system',
            content: `❌ Subcomando desconhecido: ${subcommand}\n\n**Subcomandos disponíveis:**\n  • list [--page N] [--page-size M] - Listar ferramentas com paginação\n  • info <tool-id> - Informações detalhadas\n  • exec <tool-id> <params-json> - Executar ferramenta\n  • test <tool-id> <params-json> - Testar ferramenta\n  • delete <tool-id> - Deletar ferramenta\n  • categories - Listar categorias`,
            status: 'error',
          });
        }
      },
    },
    {
      name: 'flow',
      description: 'Gerenciar fluxos de automação',
      aliases: ['f'],
      handler: async (args: string[]) => {
        const store = useStore.getState();
        
        store.addMessage({
          role: 'system',
          content: '🔄 Sistema de fluxos disponível!\n\nUse /automations para criar e gerenciar fluxos visuais.',
          status: 'completed',
        });
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

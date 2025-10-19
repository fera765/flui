import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Automation, AutomationNode, AutomationNodeType } from '../types/automation.js';
import { executeAutomation } from '../services/automationExecutor.js';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { nanoid } from 'nanoid';

type Mode = 'list' | 'create' | 'addNode' | 'configNode' | 'execute';

export const CompleteAutomationBuilder: React.FC = () => {
  const { theme, setView, addMessage, agents, mcps } = useStore();
  const colors = getTheme(theme);
  
  const [mode, setMode] = useState<Mode>('list');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Criação
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [runMode, setRunMode] = useState<'once' | 'continuous'>('once');
  const [nodes, setNodes] = useState<AutomationNode[]>([]);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  
  // Adicionar nó
  const [nodeTypes] = useState<AutomationNodeType[]>([
    'trigger', 'agent', 'mcp_tool', 'condition', 'loop', 'webhook', 'http_request', 'file_operation', 'data_transform'
  ]);
  const [nodeTypeIndex, setNodeTypeIndex] = useState(0);
  
  // Configurar nó
  const [configNode, setConfigNode] = useState<AutomationNode | null>(null);
  const [configField, setConfigField] = useState('');
  const [configValue, setConfigValue] = useState('');
  const [configFieldIndex, setConfigFieldIndex] = useState(0);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = () => {
    setAutomations(getAutomations());
  };

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'configNode') {
        setMode('create');
        setConfigNode(null);
      } else if (mode === 'addNode') {
        setMode('create');
      } else if (mode === 'create') {
        setMode('list');
        resetForm();
      } else {
        setView('chat');
      }
      return;
    }

    // Lista
    if (mode === 'list') {
      if (key.upArrow) {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex(prev => Math.min(automations.length, prev + 1));
      } else if (key.return) {
        if (selectedIndex === automations.length) {
          setMode('create');
        } else {
          handleExecute(automations[selectedIndex]);
        }
      } else if (input === 'e' && selectedIndex < automations.length) {
        const auto = automations[selectedIndex];
        setEditingAutomation(auto);
        setName(auto.name);
        setDescription(auto.description);
        setRunMode(auto.runMode || 'once');
        setNodes(auto.nodes);
        setMode('create');
      } else if (input === 'd' && selectedIndex < automations.length) {
        deleteAutomation(automations[selectedIndex].id);
        loadAutomations();
      }
    }

    // Criar/Editar
    if (mode === 'create') {
      if (input === 'n' && name.trim()) {
        // Adicionar nó
        setMode('addNode');
        setNodeTypeIndex(0);
      } else if (input === 's' && name.trim()) {
        // Salvar
        handleSave();
      } else if (input === 'm') {
        // Alternar modo
        setRunMode(prev => prev === 'once' ? 'continuous' : 'once');
      } else if (key.backspace) {
        if (name.length > 0) {
          setName(prev => prev.slice(0, -1));
        } else if (description.length > 0) {
          setDescription(prev => prev.slice(0, -1));
        }
      } else if (input && !key.ctrl && !key.meta) {
        if (name.length < 50) {
          setName(prev => prev + input);
        } else {
          setDescription(prev => prev + input);
        }
      } else if (input === 'x' && nodes.length > 0) {
        // Remover último nó
        setNodes(prev => prev.slice(0, -1));
      } else if (key.return && nodes.length > 0) {
        // Configurar último nó
        setConfigNode(nodes[nodes.length - 1]);
        setConfigFieldIndex(0);
        setMode('configNode');
      }
    }

    // Adicionar nó
    if (mode === 'addNode') {
      if (key.upArrow) {
        setNodeTypeIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setNodeTypeIndex(prev => Math.min(nodeTypes.length - 1, prev + 1));
      } else if (key.return) {
        const nodeType = nodeTypes[nodeTypeIndex];
        const newNode = createNode(nodeType);
        setNodes(prev => [...prev, newNode]);
        setConfigNode(newNode);
        setConfigFieldIndex(0);
        setMode('configNode');
      }
    }

    // Configurar nó
    if (mode === 'configNode' && configNode) {
      const fields = getConfigFields(configNode.type);
      
      if (key.upArrow) {
        setConfigFieldIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setConfigFieldIndex(prev => Math.min(fields.length - 1, prev + 1));
      } else if (key.return) {
        if (configValue.trim()) {
          // Salvar config
          const field = fields[configFieldIndex];
          configNode.config[field.key] = configValue.trim();
          setConfigValue('');
        }
      } else if (key.backspace) {
        setConfigValue(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setConfigValue(prev => prev + input);
      } else if (input === 'q') {
        // Voltar
        setMode('create');
        setConfigNode(null);
      }
    }
  });

  const createNode = (type: AutomationNodeType): AutomationNode => {
    const id = nanoid();
    const config: Record<string, any> = {};

    switch (type) {
      case 'agent':
        config.agentId = agents[0]?.id || '';
        config.prompt = 'Execute a tarefa';
        break;
      case 'mcp_tool':
        config.mcpId = mcps[0]?.id || '';
        config.toolName = '';
        config.params = {};
        break;
      case 'condition':
        config.field = '';
        config.operator = '==';
        config.value = '';
        config.trueBranch = [];
        config.falseBranch = [];
        break;
      case 'webhook':
        config.url = '';
        config.method = 'POST';
        config.headers = {};
        break;
      case 'trigger':
        config.type = 'manual';
        break;
      default:
        config.data = '';
    }

    return {
      id,
      type,
      name: `${type} ${nodes.length + 1}`,
      config,
      nextNodes: [],
    };
  };

  const getConfigFields = (type: AutomationNodeType) => {
    switch (type) {
      case 'agent':
        return [
          { key: 'agentId', label: 'ID do Agente', type: 'select', options: agents.map(a => ({ value: a.id, label: a.name })) },
          { key: 'prompt', label: 'Prompt', type: 'text' },
        ];
      case 'mcp_tool':
        return [
          { key: 'mcpId', label: 'ID do MCP', type: 'select', options: mcps.map(m => ({ value: m.id, label: m.name })) },
          { key: 'toolName', label: 'Nome da Tool', type: 'text' },
        ];
      case 'condition':
        return [
          { key: 'field', label: 'Campo', type: 'text' },
          { key: 'operator', label: 'Operador (==, !=, >, <)', type: 'text' },
          { key: 'value', label: 'Valor', type: 'text' },
        ];
      case 'webhook':
        return [
          { key: 'url', label: 'URL', type: 'text' },
          { key: 'method', label: 'Método (GET/POST)', type: 'text' },
        ];
      default:
        return [{ key: 'data', label: 'Dados', type: 'text' }];
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setRunMode('once');
    setNodes([]);
    setEditingAutomation(null);
    setConfigNode(null);
  };

  const handleSave = () => {
    const auto: Automation = {
      id: editingAutomation?.id || nanoid(),
      name: name.trim(),
      description: description.trim(),
      nodes: nodes.length > 0 ? nodes : createDefaultNodes(),
      startNodeId: nodes[0]?.id || nanoid(),
      enabled: true,
      runCount: 0,
      createdAt: editingAutomation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runMode,
    };

    saveAutomation(auto);
    loadAutomations();
    setMode('list');
    resetForm();
  };

  const createDefaultNodes = (): AutomationNode[] => {
    return [
      {
        id: nanoid(),
        type: 'trigger',
        name: 'Início',
        config: { type: 'manual' },
        nextNodes: [],
      },
    ];
  };

  const handleExecute = async (auto: Automation) => {
    setMode('execute');
    addMessage({
      role: 'system',
      content: `Executando: ${auto.name}`,
      status: 'processing',
    });

    try {
      await executeAutomation(auto, (log) => {
        addMessage({
          role: 'system',
          content: log.message,
          status: log.status === 'failed' ? 'error' : 'completed',
        });
      });
    } catch (error: any) {
      addMessage({
        role: 'system',
        content: `Erro: ${error.message}`,
        status: 'error',
      });
    } finally {
      setMode('list');
    }
  };

  // Renderização
  if (mode === 'execute') {
    return (
      <Box padding={1}>
        <Text color={colors.info}>Executando... Veja na timeline</Text>
      </Box>
    );
  }

  if (mode === 'configNode' && configNode) {
    const fields = getConfigFields(configNode.type);
    const currentField = fields[configFieldIndex];

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>CONFIGURAR: {configNode.name}</Text>
        
        <Box flexDirection="column" marginTop={1}>
          {fields.map((field, idx) => (
            <Box key={field.key}>
              <Text color={idx === configFieldIndex ? colors.primary : colors.text}>
                {idx === configFieldIndex ? '> ' : '  '}
                {field.label}: {configNode.config[field.key] || '(vazio)'}
              </Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text>Editando: </Text>
          <Text color={colors.accent}>{configValue}</Text>
          <Text color={colors.primary}>█</Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>↑↓ Campo | Digite valor | Enter Salvar | Q Voltar</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'addNode') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>ADICIONAR NÓ</Text>
        
        <Box flexDirection="column" marginTop={1}>
          {nodeTypes.map((type, idx) => (
            <Box key={type}>
              <Text color={idx === nodeTypeIndex ? colors.primary : colors.text}>
                {idx === nodeTypeIndex ? '> ' : '  '}
                {type}
              </Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text dimColor>↑↓ Navegar | Enter Selecionar | Esc Cancelar</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'create') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>CRIAR AUTOMAÇÃO</Text>
        
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text color={colors.secondary}>Nome: </Text>
            <Text>{name || '(digite)'}</Text>
            <Text color={colors.primary}>█</Text>
          </Box>
          
          <Box>
            <Text color={colors.secondary}>Descrição: </Text>
            <Text>{description || '(opcional)'}</Text>
          </Box>

          <Box>
            <Text color={colors.secondary}>Modo: </Text>
            <Text color={colors.accent}>{runMode === 'once' ? 'Uma vez' : 'Contínuo'}</Text>
          </Box>

          <Box marginTop={1}>
            <Text color={colors.secondary}>Nós ({nodes.length}):</Text>
          </Box>
          {nodes.map((node, idx) => (
            <Box key={node.id} paddingLeft={2}>
              <Text dimColor>{idx + 1}. {node.type} - {node.name}</Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text color={colors.warning}>N: Adicionar nó | M: Alternar modo</Text>
          <Text color={colors.warning}>Enter: Config último nó | X: Remover último</Text>
          <Text color={colors.success}>S: Salvar | Esc: Cancelar</Text>
        </Box>
      </Box>
    );
  }

  // Lista
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>AUTOMAÇÕES</Text>
      
      <Box flexDirection="column" marginTop={1}>
        {automations.map((auto, idx) => (
          <Box key={auto.id}>
            <Text color={idx === selectedIndex ? colors.primary : colors.text}>
              {idx === selectedIndex ? '> ' : '  '}
              {auto.name}
              {auto.runMode === 'continuous' && ' [LOOP]'}
            </Text>
          </Box>
        ))}
        
        <Box marginTop={1}>
          <Text color={selectedIndex === automations.length ? colors.primary : colors.accent}>
            {selectedIndex === automations.length ? '> ' : '  '}
            + Nova
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ Nav | Enter Exec | E Edit | D Del | Esc Voltar</Text>
      </Box>
    </Box>
  );
};

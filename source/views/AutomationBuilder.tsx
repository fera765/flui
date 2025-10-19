import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Automation, AutomationNode } from '../types/automation.js';
import { executeAutomation } from '../services/automationExecutor.js';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { nanoid } from 'nanoid';

type ViewMode = 'list' | 'create' | 'edit' | 'execute';
type EditField = 'name' | 'description' | 'runMode' | 'nodes';

export const AutomationBuilder: React.FC = () => {
  const { theme, setView, addMessage, agents, mcps } = useStore();
  const colors = getTheme(theme);
  
  const [mode, setMode] = useState<ViewMode>('list');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  
  // Edição
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [runMode, setRunMode] = useState<'once' | 'continuous'>('once');
  const [nodes, setNodes] = useState<AutomationNode[]>([]);
  const [currentField, setCurrentField] = useState<EditField>('name');
  const [editValue, setEditValue] = useState('');
  const [editingNode, setEditingNode] = useState(false);
  const [nodeIndex, setNodeIndex] = useState(0);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = () => {
    setAutomations(getAutomations());
  };

  useInput((input, key) => {
    if (key.escape) {
      if (editingNode) {
        setEditingNode(false);
      } else if (mode === 'create' || mode === 'edit') {
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
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(automations.length, prev + 1));
      } else if (key.return) {
        if (selectedIndex === automations.length) {
          setMode('create');
          setCurrentField('name');
        } else {
          handleExecute(automations[selectedIndex]);
        }
      } else if (input === 'e' && selectedIndex < automations.length) {
        const auto = automations[selectedIndex];
        setName(auto.name);
        setDescription(auto.description);
        setRunMode(auto.runMode || 'once');
        setNodes(auto.nodes);
        setMode('edit');
        setCurrentField('name');
      } else if (input === 'd' && selectedIndex < automations.length) {
        deleteAutomation(automations[selectedIndex].id);
        loadAutomations();
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }
    }

    // Criação/Edição
    if (mode === 'create' || mode === 'edit') {
      if (!editingNode) {
        if (key.tab) {
          // Próximo campo
          const fields: EditField[] = ['name', 'description', 'runMode', 'nodes'];
          const currentIdx = fields.indexOf(currentField);
          setCurrentField(fields[(currentIdx + 1) % fields.length]);
        } else if (key.return) {
          if (currentField === 'nodes') {
            setEditingNode(true);
          } else if (currentField === 'runMode') {
            setRunMode(prev => prev === 'once' ? 'continuous' : 'once');
          } else {
            // Editar campo
            setEditValue(currentField === 'name' ? name : description);
          }
        } else if (input && !key.ctrl && !key.meta) {
          // Digitar
          if (currentField === 'name') {
            setName(prev => prev + input);
          } else if (currentField === 'description') {
            setDescription(prev => prev + input);
          }
        } else if (key.backspace) {
          if (currentField === 'name') {
            setName(prev => prev.slice(0, -1));
          } else if (currentField === 'description') {
            setDescription(prev => prev.slice(0, -1));
          }
        } else if (input === 's') {
          handleSave();
        }
      } else {
        // Editando nós
        if (key.return) {
          handleAddNode();
        } else if (key.backspace && nodes.length > 0) {
          setNodes(nodes.slice(0, -1));
        } else if (input === 'q') {
          setEditingNode(false);
        }
      }
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setRunMode('once');
    setNodes([]);
    setCurrentField('name');
    setEditingNode(false);
  };

  const handleAddNode = () => {
    const newNode: AutomationNode = {
      id: nanoid(),
      type: 'agent',
      name: `Nó ${nodes.length + 1}`,
      config: { agentId: agents[0]?.id || '' },
      nextNodes: [],
    };
    setNodes([...nodes, newNode]);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const auto: Automation = {
      id: nanoid(),
      name: name.trim(),
      description: description.trim(),
      nodes: nodes.length > 0 ? nodes : createDefaultNodes(),
      edges: [],
      startNodeId: nodes[0]?.id || nanoid(),
      version: '2.0.0',
      enabled: true,
      runCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runMode,
    };

    saveAutomation(auto);
    loadAutomations();
    setMode('list');
    resetForm();
  };

  const createDefaultNodes = (): AutomationNode[] => {
    const triggerId = nanoid();
    const agentId = nanoid();
    
    return [
      {
        id: triggerId,
        type: 'trigger',
        name: 'Início',
        config: { type: 'manual' },
        nextNodes: [agentId],
      },
      {
        id: agentId,
        type: 'agent',
        name: 'Processar',
        config: { agentId: agents[0]?.id || '', prompt: 'Executar tarefa' },
        nextNodes: [],
      },
    ];
  };

  const handleExecute = async (automation: Automation) => {
    setExecuting(true);
    setMode('execute');

    addMessage({
      role: 'system',
      content: `Executando: ${automation.name}`,
      status: 'processing',
    });

    try {
      await executeAutomation(automation, (log) => {
        addMessage({
          role: 'system',
          content: log.message,
          status: log.status === 'failed' ? 'error' : 'completed',
        });
      });

      addMessage({
        role: 'system',
        content: `Concluído: ${automation.name}`,
        status: 'completed',
      });
    } catch (error: any) {
      addMessage({
        role: 'system',
        content: `Erro: ${error.message}`,
        status: 'error',
      });
    } finally {
      setExecuting(false);
      setMode('list');
    }
  };

  if (mode === 'execute') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          <Spinner type="dots" /> EXECUTANDO
        </Text>
        <Text dimColor>Veja o progresso na timeline...</Text>
      </Box>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          {mode === 'create' ? 'CRIAR AUTOMAÇÃO' : 'EDITAR AUTOMAÇÃO'}
        </Text>

        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text color={currentField === 'name' ? colors.primary : colors.text}>
              Nome: 
            </Text>
            <Text bold={currentField === 'name'}> {name || '(vazio)'}</Text>
          </Box>

          <Box marginTop={1}>
            <Text color={currentField === 'description' ? colors.primary : colors.text}>
              Descrição: 
            </Text>
            <Text bold={currentField === 'description'}> {description || '(vazio)'}</Text>
          </Box>

          <Box marginTop={1}>
            <Text color={currentField === 'runMode' ? colors.primary : colors.text}>
              Modo: 
            </Text>
            <Text bold={currentField === 'runMode'}>
              {runMode === 'once' ? ' Uma vez' : ' Contínuo'}
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color={currentField === 'nodes' ? colors.primary : colors.text}>
              Nós ({nodes.length}):
            </Text>
          </Box>

          {editingNode && (
            <Box marginTop={1} borderStyle="single" borderColor={colors.accent} paddingX={1}>
              <Text>Enter: Adicionar | Backspace: Remover | Q: Sair</Text>
            </Box>
          )}

          {nodes.map((node, idx) => (
            <Box key={node.id} paddingLeft={2}>
              <Text dimColor>
                {idx + 1}. {node.type} - {node.name}
              </Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={2}>
          <Text dimColor>
            Tab: Próximo | Enter: Editar | S: Salvar | Esc: Cancelar
          </Text>
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
              {auto.runMode === 'continuous' && ' [loop]'}
            </Text>
          </Box>
        ))}

        <Box marginTop={1}>
          <Text color={selectedIndex === automations.length ? colors.primary : colors.accent}>
            {selectedIndex === automations.length ? '> ' : '  '}
            + Nova automação
          </Text>
        </Box>
      </Box>

      <Box marginTop={2}>
        <Text dimColor>
          ↑↓ Navegar | Enter Executar | E Editar | D Excluir | Esc Voltar
        </Text>
      </Box>
    </Box>
  );
};

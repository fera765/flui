import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { Automation, AutomationNode } from '../types/automation.js';
import { executeAutomation } from '../services/automationExecutor.js';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { nanoid } from 'nanoid';

type ViewMode = 'list' | 'create' | 'edit' | 'execute' | 'delete';

export const EnhancedAutomationsView: React.FC = () => {
  const { theme, setView, addMessage, agents, mcps } = useStore();
  const colors = getTheme(theme);
  
  const [mode, setMode] = useState<ViewMode>('list');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  
  // Campos de criação/edição
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [runMode, setRunMode] = useState<'once' | 'continuous'>('once');
  const [nodes, setNodes] = useState<AutomationNode[]>([]);
  const [editingField, setEditingField] = useState<'name' | 'description' | 'runMode' | 'nodes' | null>(null);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = () => {
    const loaded = getAutomations();
    setAutomations(loaded);
  };

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'create' || mode === 'edit') {
        if (editingField) {
          setEditingField(null);
        } else {
          setMode('list');
          resetForm();
        }
      } else {
        setView('chat');
      }
      return;
    }

    // Lista de automações
    if (mode === 'list' && !executing) {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(automations.length, prev + 1));
      } else if (key.return) {
        if (selectedIndex === automations.length) {
          // Criar nova
          setMode('create');
        } else {
          // Executar
          handleExecute(automations[selectedIndex]);
        }
      } else if (input === 'e' && selectedIndex < automations.length) {
        // Editar
        const auto = automations[selectedIndex];
        setEditingAutomation(auto);
        setName(auto.name);
        setDescription(auto.description);
        setRunMode(auto.runMode || 'once');
        setNodes(auto.nodes);
        setMode('edit');
      } else if (input === 'd' && selectedIndex < automations.length) {
        // Excluir
        setMode('delete');
      }
    }

    // Modo de exclusão
    if (mode === 'delete') {
      if (input === 'y') {
        deleteAutomation(automations[selectedIndex].id);
        loadAutomations();
        setSelectedIndex(Math.max(0, selectedIndex - 1));
        setMode('list');
      } else if (input === 'n') {
        setMode('list');
      }
    }

    // Modo de criação/edição
    if ((mode === 'create' || mode === 'edit') && !editingField) {
      if (key.upArrow) {
        // Navegar campos
      } else if (key.downArrow) {
        // Navegar campos
      } else if (input === 's') {
        // Salvar
        handleSave();
      }
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setRunMode('once');
    setNodes([]);
    setEditingAutomation(null);
    setEditingField(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const defaultNodes = nodes.length > 0 ? nodes : createDefaultNodes();
    const automation = {
      id: editingAutomation?.id || nanoid(),
      name: name.trim(),
      description: description.trim(),
      nodes: defaultNodes,
      startNodeId: defaultNodes[0]?.id || '',
      enabled: true,
      runCount: editingAutomation?.runCount || 0,
      createdAt: editingAutomation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runMode: runMode,
    } as Automation;

    saveAutomation(automation);
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
        nextNodes: ['agent-1'],
      },
      {
        id: 'agent-1',
        type: 'agent',
        name: 'Processar',
        config: { 
          agentId: agents[0]?.id || '',
          prompt: 'Execute a tarefa solicitada',
        },
        nextNodes: [],
      },
    ];
  };

  const handleExecute = async (automation: Automation) => {
    setExecuting(true);
    setMode('execute');

    addMessage({
      role: 'system',
      content: `🚀 Executando automação: ${automation.name}`,
      status: 'processing',
    });

    try {
      let shouldContinue = true;
      let iteration = 0;
      const maxIterations = automation.runMode === 'continuous' ? 1000 : 1;

      while (shouldContinue && iteration < maxIterations) {
        iteration++;

        await executeAutomation(automation, (log) => {
          const messageStatus = log.status === 'failed' ? 'error' : log.status === 'running' ? 'processing' : log.status === 'completed' ? 'completed' : 'pending';
          addMessage({
            role: 'system',
            content: `${log.message} ${log.status === 'failed' ? '❌' : log.status === 'completed' ? '✅' : '⏳'}`,
            status: messageStatus,
          });
        });

        if (automation.runMode === 'once') {
          shouldContinue = false;
        }

        // Pequeno delay entre iterações no modo contínuo
        if (shouldContinue) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      addMessage({
        role: 'system',
        content: `✅ Automação concluída: ${automation.name} (${iteration} execuções)`,
        status: 'completed',
      });
    } catch (error: any) {
      addMessage({
        role: 'system',
        content: `❌ Erro na automação: ${error.message}`,
        status: 'error',
      });
    } finally {
      setExecuting(false);
      setMode('list');
    }
  };

  // Renderização
  if (mode === 'delete') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.error}>
            ⚠️ EXCLUIR AUTOMAÇÃO
          </Text>
        </Box>
        <Box borderStyle="round" borderColor={colors.error} paddingX={2} paddingY={1}>
          <Text color={colors.error}>
            Excluir "{automations[selectedIndex]?.name}"? (y/n)
          </Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'execute') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            <Spinner type="dots" /> EXECUTANDO AUTOMAÇÃO
          </Text>
        </Box>
        <Box borderStyle="round" borderColor={colors.border} paddingX={2} paddingY={1}>
          <Text color={colors.info}>
            Acompanhe a execução na timeline...
          </Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {mode === 'create' ? '➕ CRIAR AUTOMAÇÃO' : '✏️ EDITAR AUTOMAÇÃO'}
          </Text>
        </Box>

        <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={2} paddingY={1}>
          <Box marginBottom={1}>
            <Text color={colors.secondary}>Nome: </Text>
            <Text color={colors.text}>{name || '(vazio)'}</Text>
          </Box>
          <Box marginBottom={1}>
            <Text color={colors.secondary}>Descrição: </Text>
            <Text color={colors.text}>{description || '(vazio)'}</Text>
          </Box>
          <Box marginBottom={1}>
            <Text color={colors.secondary}>Modo: </Text>
            <Text color={colors.accent}>{runMode === 'once' ? '🔂 Uma vez' : '🔁 Contínuo'}</Text>
          </Box>
          <Box marginBottom={1}>
            <Text color={colors.secondary}>Nós: </Text>
            <Text color={colors.text}>{nodes.length || 'Padrão (2 nós)'}</Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            Digite 's' para salvar | Esc para cancelar
          </Text>
        </Box>

        <Box marginTop={1} borderStyle="single" borderColor={colors.warning} paddingX={1}>
          <Text color={colors.warning}>
            💡 Modo simplificado: Automação criada com nós padrão (Trigger + Agent)
          </Text>
        </Box>
      </Box>
    );
  }

  // Lista
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          ⚙️ AUTOMAÇÕES
        </Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={2} paddingY={1} minHeight={10}>
        {automations.length === 0 ? (
          <Text dimColor>Nenhuma automação disponível</Text>
        ) : (
          automations.map((auto, index) => (
            <Box key={auto.id} marginY={0} flexDirection="column">
              <Box>
                <Text color={index === selectedIndex ? colors.primary : colors.text}>
                  {index === selectedIndex ? '▶ ' : '  '}
                </Text>
                <Text bold={index === selectedIndex} color={colors.secondary}>
                  {auto.name}
                </Text>
                {auto.runMode === 'continuous' && (
                  <Text color={colors.accent}> 🔁</Text>
                )}
              </Box>
              {index === selectedIndex && auto.description && (
                <Box paddingLeft={3}>
                  <Text dimColor>{auto.description}</Text>
                </Box>
              )}
            </Box>
          ))
        )}
        
        <Box marginTop={1}>
          <Text color={selectedIndex === automations.length ? colors.primary : colors.accent}>
            {selectedIndex === automations.length ? '▶ ' : '  '}
          </Text>
          <Text bold={selectedIndex === automations.length} color={colors.accent}>
            ➕ Criar nova automação
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          ↑↓ Navegar | Enter Executar/Criar | E Editar | D Excluir | Esc Voltar
        </Text>
      </Box>
    </Box>
  );
};

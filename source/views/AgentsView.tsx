import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { nanoid } from 'nanoid';

export const AgentsView: React.FC = () => {
  const { agents, createAgent, updateAgent, deleteAgent, theme, setView } = useStore();
  const colors = getTheme(theme);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    model: '',
  });
  const [currentField, setCurrentField] = useState(0);

  const fields = ['name', 'description', 'systemPrompt', 'model'];

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'list') {
        setView('chat');
      } else {
        setMode('list');
        setFormData({ name: '', description: '', systemPrompt: '', model: '' });
        setCurrentField(0);
      }
      return;
    }

    if (mode === 'list') {
      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : agents.length));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => (prev < agents.length ? prev + 1 : 0));
      } else if (input === 'n') {
        setMode('create');
      } else if (input === 'd' && selectedIndex < agents.length) {
        deleteAgent(agents[selectedIndex].id);
      } else if (key.return && selectedIndex < agents.length) {
        const agent = agents[selectedIndex];
        setFormData({
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          model: agent.model || '',
        });
        setMode('edit');
      }
    } else {
      // Create/Edit mode
      if (key.tab || key.downArrow) {
        setCurrentField((prev) => (prev < fields.length - 1 ? prev + 1 : 0));
      } else if (key.upArrow) {
        setCurrentField((prev) => (prev > 0 ? prev - 1 : fields.length - 1));
      } else if (key.return && formData.name && formData.description) {
        if (mode === 'create') {
          createAgent({
            name: formData.name,
            description: formData.description,
            systemPrompt: formData.systemPrompt || 'Você é um agente assistente inteligente.',
            model: formData.model || undefined,
            mcpIds: [],
            enabled: true,
          });
        } else {
          updateAgent(agents[selectedIndex].id, formData);
        }
        setMode('list');
        setFormData({ name: '', description: '', systemPrompt: '', model: '' });
        setCurrentField(0);
      } else if (key.backspace || key.delete) {
        const field = fields[currentField] as keyof typeof formData;
        setFormData((prev) => ({ ...prev, [field]: prev[field].slice(0, -1) }));
      } else if (input) {
        const field = fields[currentField] as keyof typeof formData;
        setFormData((prev) => ({ ...prev, [field]: prev[field] + input }));
      }
    }
  });

  if (mode === 'create' || mode === 'edit') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {mode === 'create' ? '➕ CRIAR AGENTE' : '✏️ EDITAR AGENTE'}
          </Text>
        </Box>

        <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={2} paddingY={1}>
          {fields.map((field, index) => (
            <Box key={field} marginY={1} flexDirection="column">
              <Text color={index === currentField ? colors.primary : colors.secondary}>
                {index === currentField ? '▶ ' : '  '}
                {field === 'name'
                  ? 'Nome'
                  : field === 'description'
                  ? 'Descrição'
                  : field === 'systemPrompt'
                  ? 'System Prompt'
                  : 'Modelo (opcional)'}
                :
              </Text>
              <Box paddingLeft={3}>
                <Text color={colors.text}>
                  {formData[field as keyof typeof formData]}
                  {index === currentField && '█'}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text dimColor>Tab/↑↓ Navegar | Digite para preencher | Enter salvar | Esc cancelar</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          🤖 GERENCIAR AGENTES
        </Text>
        <Text dimColor> ({agents.length} agentes)</Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={2} paddingY={1}>
        {agents.length === 0 ? (
          <Text dimColor>Nenhum agente criado ainda. Pressione 'n' para criar um novo.</Text>
        ) : (
          agents.map((agent, index) => (
            <Box key={agent.id} marginY={1} flexDirection="column">
              <Box>
                <Text color={index === selectedIndex ? colors.primary : colors.text}>
                  {index === selectedIndex ? '▶ ' : '  '}
                </Text>
                <Text bold color={colors.secondary}>
                  {agent.name}
                </Text>
                <Text dimColor> - {agent.description}</Text>
              </Box>
              {index === selectedIndex && (
                <Box paddingLeft={3} flexDirection="column">
                  <Text color={colors.info}>📝 Prompt: {agent.systemPrompt.slice(0, 50)}...</Text>
                  {agent.model && <Text color={colors.info}>🤖 Modelo: {agent.model}</Text>}
                  <Text color={colors.info}>🔧 MCPs: {agent.mcpIds.length}</Text>
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ Navegar | n Novo | Enter Editar | d Deletar | Esc Voltar</Text>
      </Box>
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';
import { getCommands } from '../commands/index.js';
import { CommandSuggestions } from './CommandSuggestions.js';
import { AgentMentions } from './AgentMentions.js';

interface InputAreaProps {
  onSubmit: (text: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSubmit }) => {
  const {
    input,
    setInput,
    theme,
    agents,
    showCommandSuggestions,
    setShowCommandSuggestions,
    showAgentMentions,
    setShowAgentMentions,
  } = useStore();

  const colors = getTheme(theme);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Detectar comandos "/"
  useEffect(() => {
    if (input.startsWith('/')) {
      setShowCommandSuggestions(true);
      setShowAgentMentions(false);
    } else if (input.includes('@')) {
      const lastAtIndex = input.lastIndexOf('@');
      const afterAt = input.slice(lastAtIndex + 1);
      if (!afterAt.includes(' ')) {
        setShowAgentMentions(true);
        setShowCommandSuggestions(false);
      }
    } else {
      setShowCommandSuggestions(false);
      setShowAgentMentions(false);
    }
  }, [input]);

  // Filtrar comandos
  const commands = getCommands();
  const filteredCommands = input.startsWith('/')
    ? commands.filter((cmd) =>
        cmd.name.toLowerCase().includes(input.slice(1).toLowerCase())
      )
    : [];

  // Filtrar agentes
  const lastAtIndex = input.lastIndexOf('@');
  const mentionQuery = lastAtIndex >= 0 ? input.slice(lastAtIndex + 1).toLowerCase() : '';
  const filteredAgents = showAgentMentions
    ? agents.filter((agent) =>
        agent.name.toLowerCase().includes(mentionQuery.replace(/\s/g, ''))
      )
    : [];

  useInput((inputChar, key) => {
    // Navegação em sugestões
    if (showCommandSuggestions && filteredCommands.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (key.return) {
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          console.clear(); // Limpar ao selecionar comando
          setInput(`/${selected.name} `);
          setShowCommandSuggestions(false);
          setSelectedIndex(0);
        }
        return;
      }
      if (key.escape) {
        console.clear(); // Limpar ao fechar sugestões
        setShowCommandSuggestions(false);
        setSelectedIndex(0);
        return;
      }
    }

    // Navegação em menções
    if (showAgentMentions && filteredAgents.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredAgents.length - 1
        );
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((prev) =>
          prev < filteredAgents.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (key.return) {
        const selected = filteredAgents[selectedIndex];
        if (selected) {
          console.clear(); // Limpar ao selecionar agente
          const beforeAt = input.slice(0, lastAtIndex);
          setInput(`${beforeAt}@${selected.name} `);
          setShowAgentMentions(false);
          setSelectedIndex(0);
        }
        return;
      }
      if (key.escape) {
        console.clear(); // Limpar ao fechar menções
        setShowAgentMentions(false);
        setSelectedIndex(0);
        return;
      }
    }

    // Input normal
    if (key.return && input.trim()) {
      onSubmit(input.trim());
      setInput('');
      setCursorPosition(0);
      setSelectedIndex(0);
      return;
    }

    if (key.backspace || key.delete) {
      setInput(input.slice(0, -1));
      setCursorPosition(Math.max(0, cursorPosition - 1));
      return;
    }

    if (inputChar) {
      const newInput = input + inputChar;
      setInput(newInput);
      setCursorPosition(cursorPosition + 1);
    }
  });

  return (
    <Box flexDirection="column">
      {showCommandSuggestions && filteredCommands.length > 0 && (
        <CommandSuggestions commands={filteredCommands} selectedIndex={selectedIndex} />
      )}
      {showAgentMentions && filteredAgents.length > 0 && (
        <AgentMentions agents={filteredAgents} selectedIndex={selectedIndex} />
      )}
      <Box
        borderStyle="round"
        borderColor={colors.border}
        paddingX={1}
        flexDirection="column"
      >
        <Box>
          <Text color={colors.primary}>▶ </Text>
          <Text color={colors.text}>{input}</Text>
          <Text color={colors.primary}>█</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            / comandos | @ mencionar agente | Enter enviar | Ctrl+C sair
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

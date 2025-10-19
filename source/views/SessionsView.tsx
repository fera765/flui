import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';

export const SessionsView: React.FC = () => {
  const { sessions, currentSession, switchSession, deleteSession, theme, setView } = useStore();
  const colors = getTheme(theme);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (confirmDelete) {
        setConfirmDelete(null);
      } else {
        setView('chat');
      }
      return;
    }

    if (confirmDelete) {
      if (input.toLowerCase() === 'y') {
        deleteSession(confirmDelete);
        setConfirmDelete(null);
        if (sessions.length > 0 && selectedIndex >= sessions.length) {
          setSelectedIndex(Math.max(0, sessions.length - 2));
        }
      } else if (input.toLowerCase() === 'n') {
        setConfirmDelete(null);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(sessions.length - 1, prev + 1));
    } else if (key.return) {
      const selected = sessions[selectedIndex];
      if (selected) {
        switchSession(selected.id);
        setView('chat');
      }
    } else if (key.delete || input === 'd') {
      const selected = sessions[selectedIndex];
      if (selected && selected.id !== currentSession?.id) {
        setConfirmDelete(selected.id);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          📋 GERENCIAR SESSÕES
        </Text>
      </Box>

      {confirmDelete && (
        <Box
          marginBottom={1}
          borderStyle="round"
          borderColor={colors.error}
          paddingX={2}
          paddingY={1}
        >
          <Text color={colors.error}>
            ⚠️  Excluir sessão? (y/n)
          </Text>
        </Box>
      )}

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        minHeight={10}
      >
        {sessions.length === 0 ? (
          <Text dimColor>Nenhuma sessão disponível</Text>
        ) : (
          sessions.map((session, index) => {
            const isCurrent = session.id === currentSession?.id;
            const isSelected = index === selectedIndex;
            
            return (
              <Box key={session.id} marginY={0} flexDirection="column">
                <Box>
                  <Text color={isSelected ? colors.primary : colors.text}>
                    {isSelected ? '▶ ' : '  '}
                  </Text>
                  <Text
                    bold={isSelected || isCurrent}
                    color={isCurrent ? colors.success : colors.secondary}
                  >
                    {session.name}
                  </Text>
                  {isCurrent && (
                    <Text color={colors.success}> ✓ (atual)</Text>
                  )}
                </Box>
                {isSelected && (
                  <Box paddingLeft={3}>
                    <Text dimColor>
                      {session.messages.length} mensagens • 
                      Criada: {new Date(session.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          ↑↓ Navegar | Enter Selecionar | D Excluir | Esc Voltar
        </Text>
      </Box>
    </Box>
  );
};

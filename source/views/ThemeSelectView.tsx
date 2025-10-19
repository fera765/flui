import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme, themes } from '../themes/index.js';
import { Theme } from '../types/index.js';

export const ThemeSelectView: React.FC = () => {
  const { theme, setTheme, setView } = useStore();
  const colors = getTheme(theme);
  
  const themeList: Array<{ name: Theme; description: string }> = [
    { name: 'default', description: 'Moderno escuro com cores vibrantes' },
    { name: 'cyberpunk', description: 'Neon futurista (magenta, cyan, amarelo)' },
    { name: 'minimal', description: 'Claro minimalista' },
    { name: 'ocean', description: 'Tons de azul relaxante' },
  ];

  const [selectedIndex, setSelectedIndex] = useState(
    themeList.findIndex((t) => t.name === theme)
  );

  useInput((input, key) => {
    if (key.escape) {
      setView('chat');
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : themeList.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < themeList.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const selected = themeList[selectedIndex];
      setTheme(selected.name);
      setView('chat');
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          🎨 SELECIONAR TEMA
        </Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        minHeight={10}
      >
        <Box marginBottom={1}>
          <Text color={colors.info}>Tema atual: </Text>
          <Text bold color={colors.success}>
            {theme}
          </Text>
        </Box>

        {themeList.map((t, index) => (
          <Box key={t.name} marginY={1} flexDirection="column">
            <Box>
              <Text color={index === selectedIndex ? colors.primary : colors.text}>
                {index === selectedIndex ? '▶ ' : '  '}
              </Text>
              <Text
                bold={index === selectedIndex}
                color={t.name === theme ? colors.success : colors.secondary}
              >
                {t.name}
              </Text>
              {t.name === theme && (
                <Text color={colors.success}> ✓ (atual)</Text>
              )}
            </Box>
            <Box paddingLeft={3}>
              <Text dimColor>{t.description}</Text>
            </Box>
            {index === selectedIndex && (
              <Box paddingLeft={3} marginTop={1}>
                <Text color={colors.accent}>Preview: </Text>
                <Text color={getTheme(t.name).primary}>● </Text>
                <Text color={getTheme(t.name).secondary}>● </Text>
                <Text color={getTheme(t.name).accent}>● </Text>
                <Text color={getTheme(t.name).success}>● </Text>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ Navegar | Enter Selecionar | Esc Voltar</Text>
      </Box>
    </Box>
  );
};

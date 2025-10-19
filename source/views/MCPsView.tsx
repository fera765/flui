import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/store.js';
import { getTheme } from '../themes/index.js';

export const MCPsView: React.FC = () => {
  const { mcps, theme, setView } = useStore();
  const colors = getTheme(theme);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      setView('chat');
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : mcps.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < mcps.length - 1 ? prev + 1 : 0));
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          🔌 MODEL CONTEXT PROTOCOLS (MCPs)
        </Text>
        <Text dimColor> ({mcps.length} MCPs)</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
      >
        {mcps.length === 0 ? (
          <Box flexDirection="column">
            <Text dimColor>Nenhum MCP instalado ainda.</Text>
            <Box marginTop={1}>
              <Text color={colors.info}>
                💡 MCPs são plugins que adicionam ferramentas e capacidades aos agentes.
              </Text>
            </Box>
          </Box>
        ) : (
          mcps.map((mcp, index) => (
            <Box key={mcp.id} marginY={1} flexDirection="column">
              <Box>
                <Text color={index === selectedIndex ? colors.primary : colors.text}>
                  {index === selectedIndex ? '▶ ' : '  '}
                </Text>
                <Text bold color={colors.secondary}>
                  {mcp.name}
                </Text>
                <Text dimColor> v{mcp.version}</Text>
                <Text color={mcp.enabled ? colors.success : colors.error}>
                  {' '}
                  {mcp.enabled ? '✓' : '✗'}
                </Text>
              </Box>
              <Box paddingLeft={3} flexDirection="column">
                <Text dimColor>{mcp.description}</Text>
                {index === selectedIndex && (
                  <Box marginTop={1} flexDirection="column">
                    <Text color={colors.info}>🔧 Tools disponíveis:</Text>
                    {mcp.tools.map((tool) => (
                      <Box key={tool.id} paddingLeft={2}>
                        <Text color={colors.accent}>• {tool.name}</Text>
                        <Text dimColor> - {tool.description}</Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ Navegar | Esc Voltar</Text>
      </Box>
    </Box>
  );
};

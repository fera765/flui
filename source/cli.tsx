#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { StableApp } from './components/StableApp.js';

// Limpar console primeiro
console.clear();

// Inicializar CLI
const { waitUntilExit } = render(<StableApp />, {
  patchConsole: false,
  exitOnCtrlC: true,
});

waitUntilExit().catch(() => {
  process.exit(0);
});

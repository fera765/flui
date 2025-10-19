#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { StableApp } from './components/StableApp.js';
import { startApiServer } from './services/apiServer.js';

// Limpar console primeiro
console.clear();

// Iniciar API server
startApiServer();

// Inicializar CLI
const { waitUntilExit } = render(<StableApp />, {
  patchConsole: false,
  exitOnCtrlC: true,
});

waitUntilExit().catch(() => {
  process.exit(0);
});

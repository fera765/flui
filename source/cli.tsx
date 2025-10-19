#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { CleanApp } from './components/CleanApp.js';

// Inicializar CLI
render(<CleanApp />, {
  patchConsole: false,
  exitOnCtrlC: true,
});

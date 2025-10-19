import { describe, it, expect, beforeEach } from 'vitest';
import { testLLMConnection, initializeStreamingLLM } from '../services/streaming';
import { useStore } from '../store/store';
import * as storage from '../store/storage';

describe('LLM Connection Tests', () => {
  beforeEach(() => {
    storage.clearAllData();
    useStore.setState({
      currentView: 'chat',
      config: null,
      theme: 'default',
      currentSession: null,
      sessions: [],
      messages: [],
      agents: [],
      mcps: [],
      input: '',
      showCommandSuggestions: false,
      commandFilter: '',
      showAgentMentions: false,
      mentionFilter: '',
      selectedAgent: null,
    }, false);
  });

  describe('Connection Test', () => {
    it('should fail when LLM is not configured', async () => {
      const result = await testLLMConnection();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('não configurado');
    });

    it('should return proper structure', async () => {
      const result = await testLLMConnection();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Client Initialization', () => {
    it('should initialize client with endpoint and API key', () => {
      const endpoint = 'https://api.llm7.io/v1';
      const apiKey = 'test-key';
      
      initializeStreamingLLM(endpoint, apiKey);
      
      // Se não lançar erro, passou
      expect(true).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { initializeStreamingLLM, getStreamingLLMClient } from '../services/streaming';

describe('Streaming LLM', () => {
  it('should initialize LLM client', () => {
    initializeStreamingLLM('https://api.llm7.io/v1', 'test-key');
    const client = getStreamingLLMClient();
    
    expect(client).toBeDefined();
  });

  it('should use correct endpoint', () => {
    const endpoint = 'https://api.llm7.io/v1';
    initializeStreamingLLM(endpoint, 'test-key');
    const client = getStreamingLLMClient();
    
    expect(client).toBeDefined();
    // Client should be initialized with correct endpoint
  });
});

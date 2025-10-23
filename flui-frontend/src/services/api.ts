// Flui API Client
const API_BASE = 'http://localhost:3001';

class ApiClient {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async getAgents() {
    return this.fetch<any[]>('/api/agents');
  }

  async createAgent(data: any) {
    return this.fetch<{ success: boolean; id: string }>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgent(id: string, data: any) {
    return this.fetch<{ success: boolean }>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string) {
    return this.fetch<{ success: boolean }>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async getModels() {
    return this.fetch<any[]>('/api/models');
  }

  async getMCPs() {
    return this.fetch<any[]>('/api/mcps');
  }

  async getTools() {
    return this.fetch<any[]>('/api/tools');
  }

  async getAutomations() {
    return this.fetch<any[]>('/api/automations');
  }
}

export const api = new ApiClient();

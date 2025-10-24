// Flui API Client
// Use empty string to use Vite proxy (configured in vite.config.ts)
const API_BASE = '';

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

  async createAutomation(data: any) {
    return this.fetch<{ success: boolean; id: string; automation: any }>('/api/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAutomation(id: string, data: any) {
    return this.fetch<{ success: boolean }>(`/api/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAutomation(id: string) {
    return this.fetch<{ success: boolean }>(`/api/automations/${id}`, {
      method: 'DELETE',
    });
  }

  async executeAutomation(id: string, initialData?: any) {
    return this.fetch<any>(`/api/automations/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ initialData }),
    });
  }

  async createMCP(data: any) {
    return this.fetch<{ success: boolean; id: string }>('/api/mcps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async importMCP(data: { type: string; package: string; version?: string }) {
    return this.fetch<{ success: boolean; mcp: any }>('/api/mcps/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncMCP(id: string) {
    return this.fetch<any>(`/api/mcps/${id}/sync`, {
      method: 'POST',
    });
  }

  async testMCP(id: string) {
    return this.fetch<{ success: boolean; message: string; toolsFound: number }>(`/api/mcps/${id}/test`, {
      method: 'POST',
    });
  }

  async updateMCP(id: string, data: any) {
    return this.fetch<{ success: boolean }>(`/api/mcps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMCP(id: string) {
    return this.fetch<{ success: boolean }>(`/api/mcps/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

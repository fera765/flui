/**
 * FLUI - System Info Tool
 * 
 * Retorna informações sobre o sistema operacional e ambiente
 * Útil para debug e monitoramento
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';
import os from 'os';
import { readFile } from 'fs/promises';

/**
 * Formata uptime em formato legível
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export const SystemInfoTool: Tool = {
  id: 'system-info',
  name: 'System Info',
  description: 'Retorna informações detalhadas sobre o sistema operacional e hardware',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'Detalhado',
      key: 'detailed',
      type: 'boolean',
      description: 'Incluir informações detalhadas',
      required: false,
      default: false,
      ui: {
        widgetType: 'toggle',
        helperText: 'Incluir informações adicionais como CPU, rede e usuário',
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Informações do sistema',
    schema: {
      platform: 'string',
      arch: 'string',
      cpus: 'number',
      memory: 'object',
      uptime: 'number',
      hostname: 'string',
      nodeVersion: 'string',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      const basicInfo = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usedPercent: ((usedMemory / totalMemory) * 100).toFixed(2),
          totalGB: (totalMemory / 1024 / 1024 / 1024).toFixed(2),
          freeGB: (freeMemory / 1024 / 1024 / 1024).toFixed(2),
          usedGB: (usedMemory / 1024 / 1024 / 1024).toFixed(2),
        },
        uptime: os.uptime(),
        uptimeFormatted: formatUptime(os.uptime()),
        hostname: os.hostname(),
        nodeVersion: process.version,
        pid: process.pid,
      };

      if (args.detailed) {
        const detailedInfo = {
          ...basicInfo,
          cpuInfo: os.cpus().map((cpu, index) => ({
            model: cpu.model,
            speed: cpu.speed,
            core: index + 1,
          })),
          networkInterfaces: os.networkInterfaces(),
          loadAverage: os.loadavg(),
          homedir: os.homedir(),
          tmpdir: os.tmpdir(),
          release: os.release(),
          type: os.type(),
          endianness: os.endianness(),
          userInfo: os.userInfo(),
        };

        return {
          success: true,
          result: detailedInfo,
        };
      }

      return {
        success: true,
        result: basicInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao obter informações do sistema: ${error.message}`,
      };
    }
  },

  ui: {
    icon: 'Monitor',
    color: '#64748b', // slate
    tags: ['system', 'info', 'debug', 'monitoring'],
    examples: [
      {
        title: 'Informações básicas',
        description: 'Obtém informações básicas do sistema',
        params: {
          detailed: false,
        },
      },
      {
        title: 'Informações detalhadas',
        description: 'Obtém todas as informações disponíveis',
        params: {
          detailed: true,
        },
      },
    ],
  },

  config: {
    timeout: 5000,
    sandbox: false,
    concurrent: true,
  },
};

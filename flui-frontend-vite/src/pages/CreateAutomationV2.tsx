/**
 * CreateAutomationV2 - Editor de automação estilo N8n melhorado
 * Usa ToolNode, ToolPalette e FlowEngine
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Save, Plus, Play, Eye, Clock } from 'lucide-react';
import ElegantNode from '../components/ElegantNode';
import ToolSelectionModal from '../components/ToolSelectionModal';
import NodeConfigurationModalV2 from '../components/NodeConfigurationModalV2';
import ExecutionLogs from '../components/ExecutionLogs';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  ui: {
    icon?: string;
    color?: string;
    tags?: string[];
  };
}

export default function CreateAutomationV2() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [name, setName] = useState('Nova Automação');
  const [description, setDescription] = useState('');
  // 🔥 FIX CRÍTICO: Gerar ID temporário para nova automação
  // Sem isso, o modal não abre porque NodeConfigurationModalV2 requer automationId válido
  const [automationId, setAutomationId] = useState<string>(() => `temp-${Date.now()}`);
  const [continuousExecution, setContinuousExecution] = useState(false);
  
  // UI States
  const [showPalette, setShowPalette] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [executionNodes, setExecutionNodes] = useState<any[]>([]);
  const [executionStatus, setExecutionStatus] = useState<'running' | 'completed' | 'failed' | 'cancelled'>('running');
  const [executionDuration, setExecutionDuration] = useState<number | undefined>();
  const [showLogs, setShowLogs] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Auto-save
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tipos de nó customizados - Usando ElegantNode
  const nodeTypes = useMemo(() => ({ 
    tool: ElegantNode,
    elegant: ElegantNode,
    agent: ElegantNode, // 🔥 FIX: Adicionar agent como tipo válido
    system: ElegantNode, // Para ferramentas do sistema
  }), []);

  // Configurar nó (abre modal)
  const handleConfigureNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setConfigPanelOpen(true);
      }
      return currentNodes;
    });
  }, [setNodes]);

  // Excluir nó
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Confirmação já é feita no ToolNode, não duplicar aqui
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Conectar nós
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const newEdge: Edge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: 'default', // Linhas curvas suaves (bezier)
        animated: true,
        style: {
          stroke: '#8b5cf6', // Cor roxa
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#8b5cf6',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );
  
  // Deletar edge ao pressionar Delete ou Backspace
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    console.log('🗑️ Deletando edges:', edgesToDelete.map(e => e.id));
    setEdges((eds) => eds.filter((e) => !edgesToDelete.find((ed) => ed.id === e.id)));
  }, [setEdges]);

  // Adicionar ferramenta ao workflow
  const handleAddTool = useCallback((tool: Tool) => {
    const lastNode = nodes[nodes.length - 1];
    // Melhor espaçamento horizontal e vertical entre nodes
    const xPosition = lastNode ? lastNode.position.x + 350 : 100;
    const yPosition = lastNode ? lastNode.position.y : 100;

    const nodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: tool.category || 'elegant', // 🔥 FIX: Usar categoria da tool como type
      position: { x: xPosition, y: yPosition },
      data: {
        label: tool.name,
        description: tool.description || '',
        toolType: tool.category || 'system',
        toolId: tool.id, // ✅ CRÍTICO: Adicionar toolId
        category: tool.category,
        type: tool.category, // 🔥 FIX: Adicionar type também no data para detecção
        config: {},
        status: 'idle',
        isReturnPoint: false,
        onConfigure: () => handleConfigureNode(nodeId),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowPalette(false);

    // Conectar automaticamente ao último nó
    if (lastNode) {
      const newEdge: Edge = {
        id: `edge-${lastNode.id}-${newNode.id}`,
        source: lastNode.id,
        target: newNode.id,
        type: 'default', // Linhas curvas suaves (bezier)
        animated: true,
        style: {
          stroke: '#8b5cf6', // Cor roxa
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#8b5cf6',
        },
      };
      setEdges((eds) => [...eds, newEdge]);
    }
  }, [nodes, setNodes, setEdges, handleConfigureNode, handleDeleteNode]);

  // Salvar configuração do nó (INDEPENDENTE da automação)
  const handleSaveNodeConfig = async (config: any) => {
    if (!selectedNode) return;

    try {
      // Atualizar node localmente
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  config,
                  // Preserve callbacks explicitly
                  onConfigure: n.data.onConfigure,
                  onDelete: n.data.onDelete,
                },
              }
            : n
        )
      );

      // Se automação já foi salva (não é temp-), persistir no backend
      if (!automationId.startsWith('temp-')) {
        console.log('💾 Salvando config do node no backend:', selectedNode.id);
        await axios.patch(
          `${API_BASE_URL}/automations/${automationId}/nodes/${selectedNode.id}/config`,
          { config }
        );
        console.log('✅ Config do node salva no backend');
      } else {
        console.log('⚠️ Automação temporária - config salvo localmente');
        setHasUnsavedChanges(true);
      }
      
      setConfigPanelOpen(false);
      setSelectedNode(null);
    } catch (error) {
      console.error('❌ Erro ao salvar config do node:', error);
      alert('Erro ao salvar configuração do nó');
    }
  };

  // Testar nó
  const handleTestNode = async (config: any) => {
    if (!selectedNode) return;
    
    console.log('Testar nó:', selectedNode.id, config);
    // A lógica de teste já está no NodeConfigPanel
  };


  // Executar automação (teste) - EXECUÇÃO REAL COM LOGS DETALHADOS
  const handleExecute = async () => {
    if (nodes.length === 0) {
      alert('Adicione pelo menos um nó para executar');
      return;
    }

    // IMPORTANTE: Salvar primeiro se ainda não salvou
    if (!automationId) {
      const confirmSave = window.confirm(
        'A automação precisa ser salva antes de executar. Deseja salvar agora?'
      );
      if (confirmSave) {
        await handleSave();
        // Após salvar, o automationId será definido
        // Aguardar um pouco para garantir que salvou
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        return;
      }
    }

    if (!automationId) {
      alert('Erro: automação não foi salva corretamente');
      return;
    }

    setIsExecuting(true);
    setExecutionLogs([]);
    setExecutionNodes([]);
    setExecutionStatus('running');
    setShowLogs(true);

    try {
      console.log('🚀 Executando automação:', automationId);

      // Executar via API REAL usando o novo sistema
      const res = await fetch(`http://localhost:3001/api/automations/${automationId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debugMode: true,
          initialData: {},
        }),
      });

      const result = await res.json();
      console.log('✅ Resultado da execução:', result);

      if (result.success) {
        setExecutionStatus('completed');
        setExecutionDuration(result.duration);
        setExecutionLogs(result.logs || []);
        setExecutionNodes(result.nodes || []);

        // Atualizar status visual dos nós
        setNodes((nds) =>
          nds.map((n) => {
            const nodeResult = result.nodes?.find((nr: any) => nr.nodeId === n.id);
            if (nodeResult) {
              return {
                ...n,
                data: {
                  ...n.data,
                  status: nodeResult.status,
                },
              };
            }
            return n;
          })
        );
      } else {
        setExecutionStatus('failed');
        setExecutionLogs(result.logs || []);
        setExecutionNodes(result.nodes || []);
        alert('Erro na execução: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('❌ Erro na execução:', error);
      setExecutionStatus('failed');
      alert('Erro na execução: ' + error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Salvar automação (extrair para função separada para reusar)
  const doSave = async () => {
    if (!name.trim()) {
      throw new Error('Digite um nome para a automação');
    }

    if (nodes.length === 0) {
      throw new Error('Adicione pelo menos um nó à automação');
    }

    // Converter para formato de FlowDefinition
    const flowNodes = nodes.map((node) => ({
      id: node.id,
      type: node.data.category || node.type || 'tool', // 🔥 FIX: Use category/type instead of hardcoded 'tool'
      name: node.data.label,
      description: node.data.description,
      config: {
        toolId: node.data.toolId,
        category: node.data.category,
        color: node.data.color,
        icon: node.data.icon,
        params: node.data.config || {},
      },
      position: node.position,
    }));

    const flowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    // Converter ID temporário para ID real ao salvar
    const finalAutomationId = automationId.startsWith('temp-')
      ? `automation-${Date.now()}`
      : automationId;

    const automation = {
      id: finalAutomationId, // ✅ ID definido explicitamente
      name,
      description,
      version: '2.0.0',
      nodes: flowNodes,
      edges: flowEdges,
      startNodeId: nodes[0]?.id || '',
      continuousExecution, // 🔁 Nova feature: execução contínua
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Salvar via API
    const response = await fetch('http://localhost:3001/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(automation),
    });

    const data = await response.json();

    // Guardar o ID da automação salva
    if (data.id) {
      setAutomationId(data.id);
      return data.id;
    }

    throw new Error('Falha ao salvar: ID não retornado');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await doSave();
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      alert('Automação salva com sucesso!');
      // Não navegar imediatamente se foi salvo para executar
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar automação: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save a cada 30 segundos
  useEffect(() => {
    if (nodes.length === 0) return; // Não auto-salvar se não tem nodes
    if (automationId.startsWith('temp-')) return; // Não auto-salvar automações temporárias

    const interval = setInterval(async () => {
      if (hasUnsavedChanges && !isSaving) {
        console.log('💾 Auto-save executando...');
        try {
          await doSave();
          setHasUnsavedChanges(false);
          setLastAutoSave(new Date());
          console.log('✅ Auto-save concluído');
        } catch (error) {
          console.error('❌ Erro no auto-save:', error);
        }
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [nodes, edges, name, description, hasUnsavedChanges, isSaving, automationId]);

  // Marcar como modificado quando nodes ou edges mudam
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges]);


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - Responsive */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
            {/* Left section - Back button and inputs */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate('/')}
                className="flex-shrink-0 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-lg md:text-xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  placeholder="Nome da automação"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs md:text-sm text-gray-500 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mt-1"
                  placeholder="Descrição (opcional)"
                />
              </div>
            </div>
            
            {/* Middle section - Continuous Execution Toggle */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={continuousExecution}
                  onChange={(e) => setContinuousExecution(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  🔁 Execução Contínua
                </span>
              </label>
              {continuousExecution && (
                <div className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium animate-pulse">
                  LOOP
                </div>
              )}
            </div>
            
            {/* Right section - Action buttons */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ver logs"
              >
                <Eye className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Logs</span>
              </button>
              
              <button
                onClick={handleExecute}
                disabled={isExecuting || nodes.length === 0}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-sm md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Executar automação"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{isExecuting ? 'Executando...' : 'Executar'}</span>
              </button>
              
              {/* Indicador de auto-save */}
              {lastAutoSave && (
                <span className="hidden lg:flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span data-testid="auto-save-indicator">Auto-salvo</span>
                </span>
              )}
              {hasUnsavedChanges && !isSaving && (
                <span className="hidden md:inline text-xs text-orange-600 font-medium" data-testid="unsaved-changes">
                  • Não salvo
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Salvar automação"
              >
                <Save className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 3 }}
          defaultEdgeOptions={{
            type: 'default',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
          }}
          // Melhorar UX de conexão
          selectNodesOnDrag={false}
          // Permitir deletar edges e nodes com Delete/Backspace
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls 
            className="!bg-gray-800 !border-2 !border-gray-700 !rounded-lg [&_button]:!bg-gray-700 [&_button]:!text-white [&_button]:!border-gray-600 [&_button_svg]:!fill-white"
          />
          
          <Panel position="top-center">
            <div className="bg-white rounded-lg shadow-lg px-4 py-2 border-2 border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">
                  {nodes.length} nó(s) • {edges.length} conexão(ões)
                </span>
                <div className="h-4 w-px bg-gray-300"></div>
                <span className="text-xs text-gray-500">
                  💡 Selecione uma conexão e pressione <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Delete</kbd> para remover
                </span>
              </div>
            </div>
          </Panel>
          
          <Panel position="top-right">
            <button
              onClick={() => setShowPalette(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Ferramenta
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Logs Panel - NOVO SISTEMA SUPERIOR */}
      {showLogs && (
        <ExecutionLogs
          nodes={executionNodes}
          logs={executionLogs}
          status={executionStatus}
          duration={executionDuration}
          onClose={() => setShowLogs(false)}
        />
      )}

      {/* Tool Selection Modal - 3 Abas */}
      <ToolSelectionModal
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onSelect={(tool: any, type) => {
          const toolData = type === 'agent' ? {
            id: `agent-${tool.id}`,
            name: tool.name,
            description: tool.description || '',
            category: 'agent',
            version: '1.0.0',
            ui: { icon: 'Bot', color: '#3b82f6', tags: ['agent'] },
          } : {
            ...tool,
            ui: tool.ui || { icon: 'Wrench', color: '#a855f7', tags: [] },
            version: tool.version || '1.0.0',
          };
          handleAddTool(toolData as any);
        }}
      />

      {/* Node Config Panel */}
      {selectedNode && automationId && (
        <NodeConfigurationModalV2
          isOpen={configPanelOpen}
          automationId={automationId}
          nodeId={selectedNode.id}
          nodeData={selectedNode.data}
          allNodes={nodes}
          allEdges={edges}
          onClose={() => {
            setConfigPanelOpen(false);
            setSelectedNode(null);
          }}
          onSave={() => {
            setConfigPanelOpen(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}

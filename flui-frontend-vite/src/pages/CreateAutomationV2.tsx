/**
 * CreateAutomationV2 - Editor de automação estilo N8n melhorado
 * Usa ToolNode, ToolPalette e FlowEngine
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Save, Plus, Play, Eye } from 'lucide-react';
import ToolNode from '../components/ToolNode';
import ToolPalette from '../components/ToolPalette';
import NodeConfigurationModalV2 from '../components/NodeConfigurationModalV2';
import ExecutionLogs from '../components/ExecutionLogs';

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

  // Tipos de nó customizados
  const nodeTypes = useMemo(() => ({ tool: ToolNode }), []);

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
        type: 'smoothstep',
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Adicionar ferramenta ao workflow
  const handleAddTool = useCallback((tool: Tool) => {
    const lastNode = nodes[nodes.length - 1];
    const xPosition = lastNode ? lastNode.position.x + 300 : 100;
    const yPosition = lastNode ? lastNode.position.y : 100;

    const nodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: 'tool',
      position: { x: xPosition, y: yPosition },
      data: {
        label: tool.name,
        description: tool.description,
        toolId: tool.id,
        category: tool.category,
        color: tool.ui.color,
        icon: tool.ui.icon,
        status: 'idle',
        onConfigure: () => handleConfigureNode(nodeId),
        onDelete: () => handleDeleteNode(nodeId),
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
        type: 'smoothstep',
        animated: true,
      };
      setEdges((eds) => [...eds, newEdge]);
    }
  }, [nodes, setNodes, setEdges, handleConfigureNode, handleDeleteNode]);

  // Salvar configuração do nó
  const handleSaveNodeConfig = (config: any) => {
    if (!selectedNode) return;

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
    
    setConfigPanelOpen(false);
    setSelectedNode(null);
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
      type: 'tool',
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
      alert('Automação salva com sucesso!');
      // Não navegar imediatamente se foi salvo para executar
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar automação: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };


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
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls 
            className="!bg-gray-800 !border-2 !border-gray-700 !rounded-lg [&_button]:!bg-gray-700 [&_button]:!text-white [&_button]:!border-gray-600 [&_button_svg]:!fill-white"
          />
          
          <Panel position="top-center">
            <div className="bg-white rounded-lg shadow-lg px-4 py-2 border-2 border-gray-200">
              <span className="text-sm font-medium text-gray-600">
                {nodes.length} nó(s) • {edges.length} conexão(ões)
              </span>
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

      {/* Tool Palette Modal */}
      {showPalette && (
        <ToolPalette
          onAddTool={handleAddTool}
          onClose={() => setShowPalette(false)}
        />
      )}

      {/* Node Config Panel */}
      {selectedNode && automationId && (
        <NodeConfigurationModalV2
          isOpen={configPanelOpen}
          automationId={automationId}
          nodeId={selectedNode.id}
          nodeData={selectedNode.data}
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

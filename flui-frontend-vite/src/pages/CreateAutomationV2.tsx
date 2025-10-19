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
  MiniMap,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Save, Plus, Play, Eye } from 'lucide-react';
import ToolNode from '../components/ToolNode';
import ToolPalette from '../components/ToolPalette';
import NodeConfigPanel from '../components/NodeConfigPanel';

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
  
  // UI States
  const [showPalette, setShowPalette] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
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

  // Salvar automação
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Digite um nome para a automação');
      return;
    }

    if (nodes.length === 0) {
      alert('Adicione pelo menos um nó à automação');
      return;
    }

    setIsSaving(true);

    try {
      // Converter para formato de FlowDefinition
      const flowNodes = nodes.map((node) => ({
        id: node.id,
        type: 'tool',
        name: node.data.label,
        description: node.data.description,
        config: {
          toolId: node.data.toolId,
          params: {}, // TODO: Pegar params configurados
        },
        position: node.position,
      }));

      const flowEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }));

      const automation = {
        id: Date.now().toString(),
        name,
        description,
        version: '2.0.0',
        nodes: flowNodes,
        edges: flowEdges,
        startNodeId: nodes[0]?.id || '',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      // Salvar via API
      await fetch('http://localhost:3001/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation),
      });

      alert('Automação salva com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar automação');
    } finally {
      setIsSaving(false);
    }
  };

  // Executar automação (teste)
  const handleExecute = async () => {
    if (nodes.length === 0) {
      alert('Adicione pelo menos um nó para executar');
      return;
    }

    setIsExecuting(true);
    setExecutionLogs([]);
    setShowLogs(true);

    try {
      // Converter para flow e executar
      const flowNodes = nodes.map((node) => ({
        id: node.id,
        type: 'tool',
        name: node.data.label,
        config: {
          toolId: node.data.toolId,
          params: {},
        },
      }));

      const flowEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }));

      const flow = {
        id: 'test-execution',
        name: 'Teste',
        description: 'Execução de teste',
        version: '2.0.0',
        nodes: flowNodes,
        edges: flowEdges,
        startNodeId: nodes[0].id,
      };

      // TODO: Executar via API e coletar logs em tempo real via WebSocket
      console.log('Executando flow:', flow);
      
      // Simular execução por enquanto
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Atualizar status do nó
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'running',
                    // Preserve callbacks
                    onConfigure: n.data.onConfigure,
                    onDelete: n.data.onDelete,
                  },
                }
              : n
          )
        );

        setExecutionLogs((logs) => [
          ...logs,
          {
            nodeId: node.id,
            nodeName: node.data.label,
            status: 'running',
            message: `Executando ${node.data.label}...`,
            timestamp: new Date().toISOString(),
          },
        ]);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Completar nó
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'completed',
                    executionTime: Math.random() * 500,
                    // Preserve callbacks
                    onConfigure: n.data.onConfigure,
                    onDelete: n.data.onDelete,
                  },
                }
              : n
          )
        );

        setExecutionLogs((logs) => [
          ...logs,
          {
            nodeId: node.id,
            nodeName: node.data.label,
            status: 'completed',
            message: `${node.data.label} concluído`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      alert('Execução concluída!');
    } catch (error) {
      console.error('Erro na execução:', error);
      alert('Erro na execução');
    } finally {
      setIsExecuting(false);
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
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as any;
              return data.color || '#64748b';
            }}
            className="bg-white border-2 border-gray-200 rounded-lg"
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

      {/* Logs Panel */}
      {showLogs && (
        <div className="bg-white border-t p-4 h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Logs de Execução</h3>
            <button
              onClick={() => setShowLogs(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              Fechar
            </button>
          </div>
          
          <div className="space-y-2 font-mono text-sm">
            {executionLogs.length === 0 ? (
              <p className="text-gray-500">Nenhum log disponível</p>
            ) : (
              executionLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded ${
                    log.status === 'running'
                      ? 'bg-blue-50 text-blue-700'
                      : log.status === 'completed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-gray-500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  <span className="font-medium">{log.nodeName}:</span>{' '}
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tool Palette Modal */}
      {showPalette && (
        <ToolPalette
          onAddTool={handleAddTool}
          onClose={() => setShowPalette(false)}
        />
      )}

      {/* Node Config Panel */}
      {selectedNode && (
        <NodeConfigPanel
          isOpen={configPanelOpen}
          nodeId={selectedNode.id}
          toolId={selectedNode.data.toolId}
          initialConfig={selectedNode.data.config}
          onClose={() => {
            setConfigPanelOpen(false);
            setSelectedNode(null);
          }}
          onSave={handleSaveNodeConfig}
          onTest={handleTestNode}
        />
      )}
    </div>
  );
}

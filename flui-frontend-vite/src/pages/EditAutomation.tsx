/**
 * EditAutomation - Editor de automação existente
 * Carrega os dados da automação e permite editar no workflow
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ArrowLeft, Save, Plus, Play, Eye, Trash2 } from 'lucide-react';
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

interface Automation {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: any[];
  edges: any[];
  startNodeId: string;
  enabled: boolean;
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export default function EditAutomation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  
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
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Carregar automação existente
  useEffect(() => {
    if (id) {
      loadAutomation(id);
    }
  }, [id]);

  const loadAutomation = async (automationId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/automations/${automationId}`);
      
      if (!res.ok) {
        throw new Error('Automação não encontrada');
      }

      const automation: Automation = await res.json();
      
      setName(automation.name);
      setDescription(automation.description || '');

      // Converter nós do formato salvo para ReactFlow
      const reactFlowNodes: Node[] = automation.nodes.map((node) => ({
        id: node.id,
        type: 'tool',
        position: node.position || { x: 100, y: 100 },
        data: {
          label: node.name,
          description: node.description,
          toolId: node.config?.toolId,
          category: node.config?.category,
          color: node.config?.color,
          icon: node.config?.icon,
          status: 'idle',
          config: node.config?.params || {},
          onConfigure: () => handleConfigureNode(node.id),
          onDelete: () => handleDeleteNode(node.id),
        },
      }));

      // Converter edges do formato salvo para ReactFlow
      const reactFlowEdges: Edge[] = automation.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: true,
      }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar automação:', error);
      alert('Erro ao carregar automação');
      navigate('/automations');
    }
  };

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

      const automation = {
        id: id,
        name,
        description,
        version: '2.0.0',
        nodes: flowNodes,
        edges: flowEdges,
        startNodeId: nodes[0]?.id || '',
        metadata: {
          updatedAt: new Date().toISOString(),
        },
      };

      // Atualizar via API
      await fetch(`http://localhost:3001/api/automations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation),
      });

      alert('Automação atualizada com sucesso!');
      navigate('/automations');
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
      // Executar via API
      const res = await fetch(`http://localhost:3001/api/automations/${id}/execute`, {
        method: 'POST',
      });

      const result = await res.json();

      if (result.success) {
        alert('Execução concluída com sucesso!');
        
        // Atualizar status dos nós baseado nos resultados
        if (result.logs) {
          setExecutionLogs(result.logs);
        }
      } else {
        alert('Erro na execução: ' + result.error);
      }
    } catch (error) {
      console.error('Erro na execução:', error);
      alert('Erro na execução');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta automação?')) {
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/automations/${id}`, {
        method: 'DELETE',
      });
      navigate('/automations');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir automação');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando automação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - Responsive */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
            {/* Left section - Back button and inputs */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate('/automations')}
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
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 flex-wrap">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-sm md:text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir automação"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Excluir</span>
              </button>

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
                title="Salvar alterações"
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
          automationId={id} // 🆕 Passar automationId (já temos o id da rota)
          previousNodes={
            edges
              .filter((e) => e.target === selectedNode.id)
              .map((e) => {
                const sourceNode = nodes.find((n) => n.id === e.source);
                return sourceNode
                  ? { id: sourceNode.id, name: sourceNode.data.label || 'Node' }
                  : null;
              })
              .filter(Boolean) as Array<{ id: string; name: string }>
          }
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

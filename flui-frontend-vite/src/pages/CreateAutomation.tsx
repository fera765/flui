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
} from 'reactflow';
import type { Node, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import NodePaletteNew from '../components/NodePaletteNew';
import NodeConfigSimple from '../components/NodeConfigSimple';
import ToolNode from '../components/ToolNode';

export default function CreateAutomation() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Modais
  const [showPalette, setShowPalette] = useState(false);
  const [configNode, setConfigNode] = useState<Node | null>(null);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);

  // Tipos de nó customizados
  const nodeTypes = useMemo(() => ({ tool: ToolNode }), []);

  // Conectar nós
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Configurar nó
  const handleConfigureNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (node) {
        setConfigNode(node);
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

  // Adicionar nó ao workflow
  const handleAddNode = useCallback((tool: any) => {
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
        color: tool.ui?.color,
        icon: tool.ui?.icon,
        status: 'idle',
        config: {},
        onConfigure: () => handleConfigureNode(nodeId),
        onDelete: () => handleDeleteNode(nodeId),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowPalette(false);

    // Conectar automaticamente ao último nó
    if (lastNode) {
      setEdges((eds) => [
        ...eds,
        {
          id: `edge-${lastNode.id}-${nodeId}`,
          source: lastNode.id,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
        },
      ]);
    }
  }, [nodes, setNodes, setEdges, handleConfigureNode, handleDeleteNode]);

  // Salvar configuração do nó
  const handleSaveNodeConfig = useCallback((config: any) => {
    if (!configNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === configNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
              // Preserve callbacks
              onConfigure: node.data.onConfigure,
              onDelete: node.data.onDelete,
            },
          };
        }
        return node;
      })
    );

    setConfigPanelOpen(false);
    setConfigNode(null);
  }, [configNode, setNodes]);

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

    const automation = {
      name,
      description,
      version: '2.0.0',
      nodes: nodes.map(n => ({
        id: n.id,
        type: 'tool',
        name: n.data.label,
        description: n.data.description,
        config: {
          toolId: n.data.toolId,
          category: n.data.category,
          color: n.data.color,
          icon: n.data.icon,
          params: n.data.config || {},
        },
        position: n.position,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
      startNodeId: nodes[0]?.id || '',
      enabled: false,
    };

    try {
      const response = await fetch('http://localhost:3001/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation),
      });

      if (response.ok) {
        navigate('/');
      } else {
        alert('Erro ao salvar automação');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar automação');
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header - Mobile Friendly */}
      <div className="bg-slate-800 border-b border-purple-500/20 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Inputs de Nome e Descrição */}
          <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:gap-2">
            <input
              type="text"
              placeholder="Nome da Automação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full sm:flex-1 bg-slate-700 text-white px-3 py-2 text-sm rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full sm:flex-1 bg-slate-700 text-white px-3 py-2 text-sm rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Botões - Mobile Friendly */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-700 text-purple-300 px-4 py-2 rounded-lg hover:bg-slate-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sm:inline">Voltar</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Area */}
      <div className="flex-1 relative">
        {/* Botão Adicionar Nó - Fixo no topo do canvas */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={() => setShowPalette(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Adicionar Nó</span>
            <span className="sm:hidden">Adicionar</span>
          </button>
        </div>

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#8b5cf6"
            className="bg-slate-900"
          />
          <Controls className="bg-slate-800 border border-purple-500/30 rounded-lg" />
          
          {/* Info Panel - Mobile Friendly */}
          <Panel position="bottom-right" className="bg-slate-800/95 backdrop-blur-sm text-white p-2 sm:p-3 rounded-lg border border-purple-500/30 text-xs sm:text-sm m-2">
            <p className="text-purple-400">Nós: <span className="text-white font-semibold">{nodes.length}</span></p>
            <p className="text-purple-400">Conexões: <span className="text-white font-semibold">{edges.length}</span></p>
          </Panel>
        </ReactFlow>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-4">
              <p className="text-purple-400 text-lg sm:text-xl mb-2">
                Nenhum nó adicionado
              </p>
              <p className="text-purple-400/60 text-sm">
                Clique em "Adicionar Nó" para começar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <NodePaletteNew
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onSelectTool={handleAddNode}
      />

      {configNode && (
        <NodeConfigSimple
          isOpen={configPanelOpen}
          nodeId={configNode.id}
          toolId={configNode.data.toolId}
          initialConfig={configNode.data.config}
          localNodes={nodes}
          localEdges={edges}
          onClose={() => {
            setConfigPanelOpen(false);
            setConfigNode(null);
          }}
          onSave={handleSaveNodeConfig}
        />
      )}
    </div>
  );
}

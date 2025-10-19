import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import type { Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Plus, Settings } from 'lucide-react';

const nodeTypes = [
  { type: 'trigger', label: 'Trigger', color: 'bg-green-500' },
  { type: 'agent', label: 'Agente', color: 'bg-blue-500' },
  { type: 'mcp_tool', label: 'MCP Tool', color: 'bg-purple-500' },
  { type: 'webhook', label: 'Webhook', color: 'bg-yellow-500' },
  { type: 'condition', label: 'Condição', color: 'bg-orange-500' },
  { type: 'loop', label: 'Loop', color: 'bg-pink-500' },
];

export default function CreateAutomation() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: type,
        config: {},
      },
      style: {
        background: nodeTypes.find(t => t.type === type)?.color || 'bg-gray-500',
        color: 'white',
        border: '1px solid #8b5cf6',
        borderRadius: '8px',
        padding: '10px',
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const saveAutomation = async () => {
    const automation = {
      name,
      description,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.data.label,
        config: n.data.config,
        position: n.position,
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
      })),
    };

    await fetch('http://localhost:3001/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(automation),
    });

    window.location.href = '/';
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-purple-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Nome da Automação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none mb-2"
            />
            <input
              type="text"
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
            />
          </div>

          <button
            onClick={saveAutomation}
            disabled={!name}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Salvar
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Node Palette */}
        <div className="w-64 bg-slate-800 border-r border-purple-500/20 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold mb-4">Adicionar Nós</h3>
          <div className="space-y-2">
            {nodeTypes.map(node => (
              <button
                key={node.type}
                onClick={() => addNode(node.type)}
                className={`w-full ${node.color} text-white px-4 py-3 rounded-lg hover:opacity-80 transition flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" />
                {node.label}
              </button>
            ))}
          </div>

          {selectedNode && (
            <div className="mt-8 p-4 bg-slate-700 rounded-lg">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurar Nó
              </h4>
              <p className="text-purple-300 text-sm">
                ID: {selectedNode.id}
              </p>
              <p className="text-purple-300 text-sm">
                Tipo: {selectedNode.data.label}
              </p>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            fitView
          >
            <Background />
            <Controls />
            <Panel position="top-right" className="bg-slate-800/90 text-white p-4 rounded-lg">
              <p className="text-sm">Nós: {nodes.length}</p>
              <p className="text-sm">Conexões: {edges.length}</p>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

# Manual Testing Guide - Agent and Condition Node Configuration Fix

## Prerequisites
1. Backend API running on `http://localhost:3001`
2. Frontend running on `http://localhost:5173`

## Test Steps

### Test 1: Create and Edit Agent Node

1. **Create a new agent**
   - Navigate to `/agents`
   - Click "Novo Agente" / "Create Agent"
   - Fill in:
     - Name: "Test Agent"
     - Model: "gpt-4"
     - System Prompt: "You are a helpful assistant"
   - Click "Salvar" / "Save"
   - ✅ Verify agent appears in the list

2. **Create automation with the agent**
   - Navigate to `/automations/create`
   - Set name: "Test Automation"
   - Click "Adicionar Ferramenta" / "Add Tool"
   - Go to "Agentes" / "Agents" tab
   - Click on "Test Agent"
   - ✅ Verify agent node appears on canvas

3. **Save automation**
   - Click "Salvar" / "Save"
   - ✅ Verify automation is saved

4. **Edit agent node configuration**
   - Click on the agent node
   - Click configure/settings button (or double-click node)
   - ✅ **CRITICAL**: Verify modal opens WITHOUT "Node não encontrado" error
   - ✅ Verify agent fields are visible (prompt, temperature, maxTokens)
   - Fill in prompt: "Hello, this is a test"
   - Click "Salvar" / "Save"
   - ✅ Verify modal closes successfully

### Test 2: Edit Condition Node Configuration

1. **Add condition node to automation**
   - In the same automation, click "Adicionar Ferramenta"
   - Search for "condition"
   - Click on "Condition Flex"
   - ✅ Verify condition node appears on canvas

2. **Configure condition node**
   - Click on the condition node
   - Click configure button (or double-click)
   - ✅ **CRITICAL**: Verify modal opens WITHOUT "Node não encontrado" error
   - ✅ Verify condition fields are visible (value, paths, matchType)
   - Click "Cancelar" / "Cancel" to close

## Expected Results

### Before Fix
- ❌ Opening node configuration modal showed error: "Erro ao carregar configurações do node: Node não encontrado"
- ❌ Could not edit agent or condition nodes

### After Fix
- ✅ Modal opens successfully for both agent and condition nodes
- ✅ All fields are visible and editable
- ✅ Configuration can be saved without errors

## Technical Details of the Fix

### Issue
1. Nodes were saved with `type` field but modal was only checking `category` field
2. For agents, if `toolId` didn't start with "agent-", modal tried wrong API endpoint
3. Node type wasn't preserved when saving/loading automations

### Solution
1. **NodeConfigurationModalV2.tsx** (line 244-254):
   - Added fallback check: `node.type === 'agent'` to detect agent nodes
   - Improved agent ID extraction logic
   
2. **EditAutomation.tsx** (line 121-136):
   - Preserve original node type when loading: `type: node.type || 'tool'`
   - Add fallback for category: `category: node.config?.category || node.type`
   
3. **CreateAutomationV2.tsx** (line 327-340):
   - Use actual node type when saving: `type: node.data.category || node.type || 'tool'`
   - Ensures agents are saved with `type: 'agent'` instead of `type: 'tool'`

## Files Modified
- `/workspace/flui-frontend-vite/src/components/NodeConfigurationModalV2.tsx`
- `/workspace/flui-frontend-vite/src/pages/EditAutomation.tsx`
- `/workspace/flui-frontend-vite/src/pages/CreateAutomationV2.tsx`

# Flui API - Backend for Intelligent Automation

## Overview

Flui API is a powerful backend system for managing intelligent agents, MCP (Model Context Protocol) servers, automations, and workflows. Built with TypeScript, Express, and OpenAI integration.

## Features

- **Agent Management**: Create, update, and manage AI agents with custom system prompts and tools
- **MCP Integration**: Connect and manage Model Context Protocol servers
- **Automation Engine**: Build complex automation workflows with visual node-based editor
- **Tool Registry**: Extensible tool system for custom functionality
- **Flow Execution**: Execute multi-step workflows with context preservation
- **WebSocket Support**: Real-time updates and streaming responses
- **Persistent Storage**: File-based storage with Zustand state management

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

The API uses environment variables and file-based configuration. Configure your LLM settings via the API endpoints:

```bash
# Default LLM endpoint
https://api.llm7.io/v1

# Configure via API
POST /api/llm/config
{
  "endpoint": "https://api.openai.com/v1",
  "apiKey": "your-api-key",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

### Running the API

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Agents

- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent by ID
- `POST /api/agents` - Create new agent
- `PUT /api/agents/:id` - Update agent
- `PATCH /api/agents/:id` - Partially update agent
- `DELETE /api/agents/:id` - Delete agent
- `GET /api/agents/:id/as-tool` - Convert agent to tool format

### MCPs (Model Context Protocol)

- `GET /api/mcps` - List all MCPs
- `GET /api/mcps/:id` - Get MCP by ID
- `POST /api/mcps` - Create new MCP
- `PUT /api/mcps/:id` - Update MCP
- `PATCH /api/mcps/:id` - Partially update MCP
- `DELETE /api/mcps/:id` - Delete MCP
- `POST /api/mcps/:id/sync` - Sync MCP tools
- `POST /api/mcps/:id/test` - Test MCP connection

### Automations

- `GET /api/automations` - List all automations
- `GET /api/automations/:id` - Get automation by ID
- `POST /api/automations` - Create new automation
- `PUT /api/automations/:id` - Update automation
- `PATCH /api/automations/:id` - Partially update automation
- `DELETE /api/automations/:id` - Delete automation
- `POST /api/automations/:id/execute` - Execute automation
- `GET /api/automations/:id/executions` - Get execution history
- `GET /api/automations/:id/logs` - Get execution logs
- `GET /api/automations/:automationId/nodes/:nodeId/available-outputs` - Get available node outputs

### Tools

- `GET /api/tools` - List all tools
- `GET /api/tools/:id` - Get tool by ID
- `POST /api/tools` - Register new tool
- `PUT /api/tools/:id` - Update tool
- `DELETE /api/tools/:id` - Delete tool
- `POST /api/tools/:id/execute` - Execute tool
- `GET /api/tools/categories` - Get tool categories
- `GET /api/tools/:id/metrics` - Get tool metrics

### Flows

- `POST /api/flows/execute` - Execute flow
- `GET /api/flows` - List flows
- `POST /api/flows` - Create flow
- `PUT /api/workflows/:id/save` - Save workflow
- `GET /api/workflows/:id` - Get workflow

### Custom Nodes

- `GET /api/custom-nodes` - List custom nodes
- `GET /api/custom-nodes/:fingerprint` - Get custom node by fingerprint
- `POST /api/custom-nodes/upload` - Upload custom node
- `POST /api/custom-nodes/validate` - Validate custom node
- `DELETE /api/custom-nodes/:fingerprint` - Delete custom node

### LLM Configuration

- `GET /api/llm/config` - Get LLM configuration
- `POST /api/llm/config` - Update LLM configuration
- `GET /api/models` - List available models

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

## Test Coverage

**196 tests across 20 test suites - 100% passing**

The test suite covers:

- **API Tests** (41 tests): Agent, MCP, and Automation CRUD operations
- **System Tools** (19 tests): File, text, and execution tools
- **Tool Registry** (10 tests): Registration, discovery, validation
- **TodoWrite Tool** (10 tests): CRUD operations, persistence
- **MCP Import** (9 tests): NPM, GitHub, URL import methods
- **E2E Tests** (26 tests): Deep references, complex automations, extreme workflows
- **Architecture Tests** (20 tests): Executors, orchestration, observability
- **Real Integration** (52 tests): Complete workflow testing
- **MCP API Integration** (5 tests): Real MCP server testing
- **Complete Workflow** (4 tests): End-to-end scenarios

## Project Structure

```
/workspace
├── source/
│   ├── core/            # Core engine (flow execution, tools, types)
│   ├── services/        # Business logic (API, agents, MCPs, LLM)
│   ├── store/           # State management and persistence
│   ├── tools/           # Built-in tools and triggers
│   ├── types/           # TypeScript type definitions
│   ├── cli.ts           # CLI entry point
│   └── startApi.ts      # API server entry point
├── __tests__/           # Test suite
│   ├── setup.ts         # Test configuration
│   └── api/             # API endpoint tests
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Development

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Building

```bash
npm run build
```

Compiled files will be in the `dist/` directory.

## Architecture

### Core Components

1. **Flow Engine**: Executes automation workflows with node-based logic
2. **Tool Registry**: Manages available tools and their metadata
3. **Store**: Zustand-based state management with file persistence
4. **MCP Client**: Connects to external MCP servers for extended functionality
5. **LLM Service**: OpenAI integration for agent intelligence

### Data Flow

```
API Request → Express Router → Service Layer → Store/Storage → Response
                                    ↓
                              Flow Engine
                                    ↓
                           Tool Executor
                                    ↓
                        MCP Client / LLM Service
```

## Contributing

1. Write tests for new features
2. Ensure all tests pass
3. Follow TypeScript best practices
4. Update documentation

## License

MIT

## Support

For issues and questions, please open an issue on the repository.

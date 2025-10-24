# Flui Frontend 🚀

Modern, elegant frontend for the Flui Intelligent Automation Platform.

## ✨ Features

### 🎨 Theming System
- **3 Beautiful Themes**: Dark, Ocean, Sunset
- **Dark Mode Toggle**: Each theme supports dark mode
- **Persistent Preferences**: Theme choice saved locally

### 🤖 Agent Management
- Full CRUD operations
- Model selection from LLM endpoint
- Tool & MCP integration
- Form validation with Zod

### 🧩 MCP Integration
- Import from 4 sources: NPM, NPX, GitHub, URL
- Sync tools with toast notifications
- Test connectivity
- Real-time status indicators

### 🔄 Workflow Editor
- **React Flow** powered visual editor
- Custom nodes with configuration
- **Link System**: Connect node outputs to inputs
- Drag & drop node creation
- Real-time execution
- **No minimap** (clean UI)

### 📋 Automation Management
- List all automations
- Filter by status
- Execute workflows
- Track execution count

## 🛠️ Tech Stack

- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite 5** - Build tool
- **TailwindCSS 3.4** - Styling
- **React Router 6.26** - Navigation
- **React Flow 11.11** - Workflow editor
- **TanStack Query 5.56** - Data fetching
- **Zustand 4.5** - State management
- **React Hook Form + Zod** - Forms & validation
- **Sonner** - Toast notifications
- **Lucide React** - Icons
- **Vitest** - Testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on `localhost:3001`

### Installation

\`\`\`bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
\`\`\`

The app will be available at `http://localhost:5173`

### Available Scripts

\`\`\`bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI

# Linting
npm run lint         # Run ESLint
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components
│   ├── layout/         # Layout components
│   ├── agents/         # Agent-specific components
│   ├── mcps/           # MCP-specific components
│   ├── automations/    # Automation components
│   └── workflow/       # Workflow editor components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API services
├── store/              # Zustand stores
├── types/              # TypeScript types
├── lib/                # Utility functions
├── styles/             # Global styles & themes
└── test/               # Test utilities

\`\`\`

## 🎨 Theming

The app includes 3 pre-configured themes:

### Dark Theme (Default)
- Primary: Purple (#7c3aed)
- Accent: Violet
- Best for: Night work, reduced eye strain

### Ocean Theme
- Primary: Cyan (#0891b2)
- Accent: Teal
- Best for: Fresh, clean interface

### Sunset Theme
- Primary: Orange (#f97316)
- Accent: Pink
- Best for: Warm, energetic feel

Each theme supports **dark mode** toggle!

## 🔗 API Integration

The frontend connects to the Flui API:

### Endpoints Used
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `GET /api/models` - List LLM models
- `GET /api/tools` - List tools
- `GET /api/mcps` - List MCPs
- `POST /api/mcps/import` - Import MCP
- `POST /api/mcps/:id/sync` - Sync MCP
- `GET /api/automations` - List automations
- `POST /api/automations` - Create automation
- `POST /api/automations/:id/execute` - Execute automation

### API Client
Located in `src/services/api.ts` - centralized API client with error handling.

## 🧪 Testing

\`\`\`bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test Button.test.tsx
\`\`\`

### Test Coverage
- ✅ UI Components
- ✅ Custom Hooks
- ✅ State Management
- ✅ API Integration (mocked)

## 🚢 Production Build

\`\`\`bash
# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

Build output will be in `dist/` directory.

### Deployment
- Deploy `dist/` folder to your hosting provider
- Configure environment variables
- Ensure API endpoint is accessible

## 📋 Development Guidelines

### Component Creation
- Use functional components with TypeScript
- Include prop types interface
- Use `cn()` utility for className merging
- Follow existing patterns in `components/ui/`

### Styling
- Use Tailwind utility classes
- Use theme colors (e.g., `text-foreground`, `bg-card`)
- Avoid hardcoded colors
- Follow responsive design patterns

### State Management
- Use Zustand for global state
- Use React Query for server state
- Use local state for component-specific state

### API Calls
- Always use the `api` client from `services/api.ts`
- Use React Query hooks (`useQuery`, `useMutation`)
- Show loading states
- Handle errors with toast notifications

## 🎯 Features Roadmap

- [x] Theme system (3 themes)
- [x] Agent CRUD
- [x] MCP import & sync
- [x] Automation list
- [x] Workflow editor
- [x] Node configuration
- [x] Output linker system
- [ ] Real-time execution logs
- [ ] Webhook triggers UI
- [ ] Cron schedule builder
- [ ] Flow templates
- [ ] Export/import workflows
- [ ] Collaboration features

## 🤝 Contributing

1. Follow existing code style
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass
5. No linting errors

## 📄 License

See backend license.

## 🙏 Acknowledgments

- React Flow team
- TailwindCSS team
- Lucide icons
- Vercel (Sonner)

---

**Built with ❤️ for the Flui Platform**

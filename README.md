# AppIQ Memory MCP Server

[![smithery badge](https://smithery.ai/badge/@Viktor-Hermann/appiq-memory-mcp)](https://smithery.ai/server/@Viktor-Hermann/appiq-memory-mcp)

🧠 **Complete memory and coordination system for Flutter agent workflows with full transparency**

The AppIQ Memory MCP Server provides complete visibility and coordination for Flutter development agents, enabling transparent task delegation, progress tracking, and persistent context across sessions.

## 🚀 Quick Start

### Installing via Smithery

To install appiq-memory-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@Viktor-Hermann/appiq-memory-mcp):

```bash
npx -y @smithery/cli install @Viktor-Hermann/appiq-memory-mcp --client claude
```

### Install via Smithery.ai (Recommended)

```bash
npm create smithery @appiq/memory-mcp-server
```

### Configure Claude Code

Add to your `~/.claude.json` file:

```json
{
  "mcpServers": {
    "appiq-memory": {
      "command": "npx",
      "args": ["@appiq/memory-mcp-server"]
    }
  }
}
```

### Restart Claude Code

After configuration, restart Claude Code to load the MCP server.

## 🎯 Features

### 📊 Complete Agent Transparency
- See exactly which agents are active
- Track task delegations between agents  
- Monitor real-time progress of all work
- View complete activity history

### 🔄 Task Delegation Tracking
- Log when feature-manager delegates to other agents
- Track task types, descriptions, and priorities
- Monitor expected completion times
- View delegation chains and dependencies

### 📈 Progress Management
- Track individual task progress (0-100%)
- Monitor feature development phases
- Identify blockers and active agents
- Calculate completion rates

### 🧠 Persistent Context
- Agents remember previous work across sessions
- Complete project context available to all agents
- No lost context between Claude Code restarts
- Seamless coordination between multiple agents

## 🛠️ Available MCP Tools

### Core Activity Logging
- **`log_agent_activity`** - Log all agent actions and tasks
- **`log_task_delegation`** - Track task handoffs between agents
- **`track_task_progress`** - Monitor task completion status

### Status & Context
- **`get_memory_status`** - View current memory and activity status
- **`get_full_context`** - Get complete project context for agents
- **`update_feature_progress`** - Update overall feature development

## 🎯 Use Cases

### Flutter Development Coordination
Perfect for coordinating multiple specialized agents:
- **feature-manager** - Orchestrates complete workflows
- **po-agent** - Handles requirements analysis
- **ui-agent** - Manages UI/UX development
- **cubit-agent** - Implements state management
- **data-agent** - Develops data layers

### Bug Fix Coordination
Track and coordinate bug fixes across multiple agents:
- Parse bug lists into distributed tasks
- Monitor parallel agent execution
- Track completion status in real-time

### Feature Development Transparency
Complete visibility into feature development:
- See which agents are working on what
- Track progress across all development phases
- Maintain context between development sessions

## 📊 How It Works

1. **Automatic Integration**: Agents automatically use MCP tools when available
2. **Cloud-Based**: No local daemon or installation required
3. **Transparent**: Every action is logged and visible
4. **Persistent**: Context survives between sessions and restarts

## 🔧 Technical Details

### Architecture
- Built on Model Context Protocol (MCP) standard
- Cloud-based memory storage (no local files)
- Multi-project support with automatic project detection
- Optimized for performance with activity history limits

### Requirements
- Node.js 16+ 
- Claude Code with MCP support
- Compatible with all AppIQ Flutter agents

### Data Management
- Activities: Last 100 entries stored
- Delegations: Last 50 entries stored  
- Tasks: All active tasks maintained
- Features: Current state of all features

## 🚀 Integration with AppIQ Flutter Workflow

This MCP server is designed to work seamlessly with the AppIQ Flutter Workflow system:

1. Install AppIQ agents in your Flutter project
2. Add this MCP server to Claude Code
3. Agents automatically gain full transparency and memory
4. Complete coordination and progress tracking enabled

### Install AppIQ Agents
```bash
# Clone or download AppIQ Flutter Workflow
./install-to-project.sh /path/to/your/flutter/project
```

## 📚 Examples

### Basic Status Check
```typescript
// Agent automatically calls:
get_memory_status({
  includeHistory: true,
  includeAgentDetails: true
})
```

### Task Delegation Logging
```typescript
// Feature-manager automatically logs:
log_task_delegation({
  fromAgent: "feature-manager",
  toAgent: "ui-agent", 
  taskType: "ui-design",
  taskDescription: "Create responsive login screen",
  priority: "high"
})
```

### Progress Tracking
```typescript
// Agents automatically track progress:
track_task_progress({
  taskId: "login-ui",
  status: "completed",
  progress: 100,
  agent: "ui-agent"
})
```

## 🤝 Contributing

We welcome contributions! Please see our main repository for guidelines:
- [AppIQ Flutter Workflow](https://github.com/appiq-workflow/flutter-workflow)

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/appiq-workflow/memory-mcp-server/issues)
- **Documentation**: [AppIQ Workflow Docs](https://github.com/appiq-workflow/flutter-workflow#readme)
- **Community**: [Discussions](https://github.com/appiq-workflow/flutter-workflow/discussions)

---

**Built with ❤️ by the AppIQ Workflow Team**

*Making Flutter development transparent, coordinated, and efficient.*
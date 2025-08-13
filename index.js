#!/usr/bin/env node

/**
 * AppIQ Memory MCP Server for Smithery.ai
 * Cloud-ready memory system for Flutter agent coordination
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

class AppIQMemorySmithery {
  constructor() {
    this.projectId = process.env.CLAUDE_PROJECT_DIR ? 
      this.extractProjectId(process.env.CLAUDE_PROJECT_DIR) : 
      'default-project';
    
    this.server = new Server(
      { 
        name: 'appiq-memory', 
        version: '1.0.0',
        description: 'AppIQ Memory System for Flutter agent coordination'
      },
      { 
        capabilities: { 
          tools: {},
          resources: {}
        } 
      }
    );
    
    // In-memory storage (in real Smithery deployment, this would use cloud storage)
    this.memory = {
      agents: {},
      features: {},
      tasks: {},
      delegations: [],
      activities: []
    };
    
    this.setupHandlers();
  }

  extractProjectId(projectPath) {
    return projectPath.split('/').pop() || 'default-project';
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'log_agent_activity',
          description: 'Log agent activity for complete transparency',
          inputSchema: {
            type: 'object',
            properties: {
              agent: { 
                type: 'string', 
                description: 'Agent name (feature-manager, po-agent, ui-agent, cubit-agent, data-agent)',
                enum: ['feature-manager', 'po-agent', 'ui-agent', 'cubit-agent', 'data-agent', 'domain-agent', 'test-agent', 'security-agent']
              },
              action: { 
                type: 'string', 
                description: 'Action type (started, analyzing, implementing, completed, failed)',
                enum: ['started', 'analyzing', 'implementing', 'creating', 'fixing', 'completed', 'failed']
              },
              task: { 
                type: 'string', 
                description: 'Detailed task description' 
              },
              details: { 
                type: 'object', 
                description: 'Additional context and metadata',
                default: {}
              }
            },
            required: ['agent', 'action', 'task']
          }
        },
        {
          name: 'log_task_delegation',
          description: 'Log when feature-manager delegates tasks to other agents',
          inputSchema: {
            type: 'object',
            properties: {
              fromAgent: { 
                type: 'string', 
                description: 'Agent delegating the task (usually feature-manager)',
                default: 'feature-manager'
              },
              toAgent: { 
                type: 'string', 
                description: 'Agent receiving the task',
                enum: ['po-agent', 'ui-agent', 'cubit-agent', 'data-agent', 'domain-agent', 'test-agent', 'security-agent']
              },
              taskType: { 
                type: 'string', 
                description: 'Type of task being delegated',
                enum: ['requirements', 'ui-design', 'state-management', 'data-layer', 'business-logic', 'testing', 'security', 'bug-fix']
              },
              taskDescription: { 
                type: 'string', 
                description: 'Detailed description of the delegated task' 
              },
              expectedDuration: { 
                type: 'string', 
                description: 'Expected completion time',
                default: 'Unknown'
              },
              priority: {
                type: 'string',
                description: 'Task priority level',
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium'
              }
            },
            required: ['toAgent', 'taskType', 'taskDescription']
          }
        },
        {
          name: 'track_task_progress',
          description: 'Track progress of specific tasks',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { 
                type: 'string', 
                description: 'Unique task identifier (auto-generated if not provided)' 
              },
              status: { 
                type: 'string', 
                description: 'Current task status',
                enum: ['pending', 'in_progress', 'completed', 'failed', 'blocked']
              },
              progress: { 
                type: 'number', 
                description: 'Progress percentage (0-100)',
                minimum: 0,
                maximum: 100,
                default: 0
              },
              agent: { 
                type: 'string', 
                description: 'Agent handling the task' 
              },
              notes: {
                type: 'string',
                description: 'Additional progress notes',
                default: ''
              }
            },
            required: ['status', 'agent']
          }
        },
        {
          name: 'update_feature_progress',
          description: 'Update overall feature development progress',
          inputSchema: {
            type: 'object',
            properties: {
              featureName: { 
                type: 'string', 
                description: 'Name of the feature being developed' 
              },
              phase: { 
                type: 'string', 
                description: 'Current development phase',
                enum: ['analysis', 'planning', 'implementation', 'testing', 'integration', 'completed']
              },
              activeAgents: { 
                type: 'array', 
                items: { type: 'string' }, 
                description: 'Currently active agents working on this feature',
                default: []
              },
              completedTasks: { 
                type: 'array', 
                items: { type: 'string' }, 
                description: 'List of completed tasks',
                default: []
              },
              blockers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Current blockers or issues',
                default: []
              }
            },
            required: ['featureName', 'phase']
          }
        },
        {
          name: 'get_memory_status',
          description: 'Get current memory system status and activity overview',
          inputSchema: {
            type: 'object',
            properties: {
              includeHistory: { 
                type: 'boolean', 
                description: 'Include recent activity history',
                default: false
              },
              includeAgentDetails: {
                type: 'boolean',
                description: 'Include detailed agent activity',
                default: true
              },
              lastNActivities: {
                type: 'number',
                description: 'Number of recent activities to include',
                default: 10,
                minimum: 1,
                maximum: 50
              }
            }
          }
        },
        {
          name: 'get_full_context',
          description: 'Get complete project context for agent coordination',
          inputSchema: {
            type: 'object',
            properties: {
              requestingAgent: {
                type: 'string',
                description: 'Agent requesting the context'
              },
              contextType: {
                type: 'string',
                description: 'Type of context needed',
                enum: ['full', 'recent', 'feature-specific', 'agent-specific'],
                default: 'recent'
              },
              featureName: {
                type: 'string',
                description: 'Specific feature name (for feature-specific context)'
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'log_agent_activity':
            return await this.logAgentActivity(request.params.arguments);
          case 'log_task_delegation':
            return await this.logTaskDelegation(request.params.arguments);
          case 'track_task_progress':
            return await this.trackTaskProgress(request.params.arguments);
          case 'update_feature_progress':
            return await this.updateFeatureProgress(request.params.arguments);
          case 'get_memory_status':
            return await this.getMemoryStatus(request.params.arguments);
          case 'get_full_context':
            return await this.getFullContext(request.params.arguments);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  async logAgentActivity(args) {
    const { agent, action, task, details = {} } = args;
    const timestamp = new Date().toISOString();
    const activityId = `${agent}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    const activity = {
      id: activityId,
      timestamp,
      projectId: this.projectId,
      agent,
      action,
      task,
      details
    };

    // Store in memory
    this.memory.activities.push(activity);
    
    // Keep only last 100 activities to prevent memory bloat
    if (this.memory.activities.length > 100) {
      this.memory.activities = this.memory.activities.slice(-100);
    }

    // Update agent status
    if (!this.memory.agents[agent]) {
      this.memory.agents[agent] = { activities: [], status: 'inactive', lastActivity: null };
    }
    
    this.memory.agents[agent].activities.push(activityId);
    this.memory.agents[agent].lastActivity = timestamp;
    this.memory.agents[agent].status = action === 'completed' ? 'idle' : 'active';
    this.memory.agents[agent].currentTask = action === 'completed' ? null : task;

    return {
      content: [
        {
          type: 'text',
          text: `✅ Activity logged: ${agent} ${action}\n📝 Task: ${task}\n⏰ Time: ${timestamp}\n🆔 ID: ${activityId}`
        }
      ]
    };
  }

  async logTaskDelegation(args) {
    const { fromAgent = 'feature-manager', toAgent, taskType, taskDescription, expectedDuration = 'Unknown', priority = 'medium' } = args;
    const timestamp = new Date().toISOString();
    const delegationId = `delegation-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    const delegation = {
      id: delegationId,
      timestamp,
      projectId: this.projectId,
      fromAgent,
      toAgent,
      taskType,
      taskDescription,
      expectedDuration,
      priority,
      status: 'delegated'
    };

    this.memory.delegations.push(delegation);
    
    // Keep only last 50 delegations
    if (this.memory.delegations.length > 50) {
      this.memory.delegations = this.memory.delegations.slice(-50);
    }

    return {
      content: [
        {
          type: 'text',
          text: `🔄 Task delegated: ${fromAgent} → ${toAgent}\n📋 Type: ${taskType}\n📝 Task: ${taskDescription}\n⏱️ Expected: ${expectedDuration}\n🔥 Priority: ${priority}\n🆔 ID: ${delegationId}`
        }
      ]
    };
  }

  async trackTaskProgress(args) {
    const { taskId, status, progress = 0, agent, notes = '' } = args;
    const timestamp = new Date().toISOString();
    const finalTaskId = taskId || `task-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    const taskProgress = {
      id: finalTaskId,
      timestamp,
      projectId: this.projectId,
      status,
      progress,
      agent,
      notes
    };

    this.memory.tasks[finalTaskId] = taskProgress;

    return {
      content: [
        {
          type: 'text',
          text: `📊 Progress updated: ${finalTaskId}\n🎯 Status: ${status} (${progress}%)\n🤖 Agent: ${agent}\n📝 Notes: ${notes || 'None'}`
        }
      ]
    };
  }

  async updateFeatureProgress(args) {
    const { featureName, phase, activeAgents = [], completedTasks = [], blockers = [] } = args;
    const timestamp = new Date().toISOString();

    const featureProgress = {
      timestamp,
      projectId: this.projectId,
      phase,
      activeAgents,
      completedTasks,
      blockers,
      totalAgents: activeAgents.length,
      completionRate: completedTasks.length > 0 ? 
        Math.round((completedTasks.length / (completedTasks.length + activeAgents.length)) * 100) : 0
    };

    this.memory.features[featureName] = featureProgress;

    return {
      content: [
        {
          type: 'text',
          text: `🎯 Feature: ${featureName}\n📍 Phase: ${phase}\n🤖 Active agents: ${activeAgents.join(', ') || 'None'}\n✅ Completed: ${completedTasks.length} tasks\n🚫 Blockers: ${blockers.length}\n📊 Progress: ${featureProgress.completionRate}%`
        }
      ]
    };
  }

  async getMemoryStatus(args) {
    const { includeHistory = false, includeAgentDetails = true, lastNActivities = 10 } = args || {};
    
    const status = {
      projectId: this.projectId,
      timestamp: new Date().toISOString(),
      totalActivities: this.memory.activities.length,
      totalDelegations: this.memory.delegations.length,
      activeAgents: Object.keys(this.memory.agents).filter(agent => 
        this.memory.agents[agent].status === 'active'
      ),
      activeFeatures: Object.keys(this.memory.features),
      activeTasks: Object.keys(this.memory.tasks).filter(taskId =>
        this.memory.tasks[taskId].status === 'in_progress'
      )
    };

    let statusText = `🧠 AppIQ Memory Status (Project: ${status.projectId}):\n`;
    statusText += `📊 Total activities: ${status.totalActivities}\n`;
    statusText += `🔄 Total delegations: ${status.totalDelegations}\n`;
    statusText += `🤖 Active agents: ${status.activeAgents.length} (${status.activeAgents.join(', ') || 'None'})\n`;
    statusText += `🎯 Active features: ${status.activeFeatures.length} (${status.activeFeatures.join(', ') || 'None'})\n`;
    statusText += `📋 Active tasks: ${status.activeTasks.length}\n`;
    statusText += `⏰ Last updated: ${status.timestamp}`;

    if (includeAgentDetails) {
      statusText += `\n\n🤖 AGENT DETAILS:\n`;
      for (const [agentName, agentData] of Object.entries(this.memory.agents)) {
        statusText += `├── ${agentName}: ${agentData.status}`;
        if (agentData.currentTask) {
          statusText += ` (${agentData.currentTask})`;
        }
        statusText += `\n`;
      }
    }

    if (includeHistory && this.memory.activities.length > 0) {
      const recentActivities = this.memory.activities.slice(-lastNActivities);
      statusText += `\n\n📜 RECENT ACTIVITIES (last ${recentActivities.length}):\n`;
      recentActivities.forEach(activity => {
        const time = new Date(activity.timestamp).toLocaleTimeString();
        statusText += `├── [${time}] ${activity.agent}: ${activity.action} - ${activity.task}\n`;
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: statusText
        }
      ]
    };
  }

  async getFullContext(args) {
    const { requestingAgent, contextType = 'recent', featureName } = args || {};
    
    let contextText = `📚 FULL CONTEXT for ${requestingAgent || 'Agent'} (Type: ${contextType}):\n\n`;

    if (contextType === 'full' || contextType === 'recent') {
      // Recent delegations
      const recentDelegations = this.memory.delegations.slice(-10);
      if (recentDelegations.length > 0) {
        contextText += `🔄 RECENT DELEGATIONS:\n`;
        recentDelegations.forEach(del => {
          const time = new Date(del.timestamp).toLocaleTimeString();
          contextText += `├── [${time}] ${del.fromAgent} → ${del.toAgent}: ${del.taskDescription}\n`;
        });
        contextText += `\n`;
      }

      // Agent activities
      const recentActivities = this.memory.activities.slice(-15);
      if (recentActivities.length > 0) {
        contextText += `📝 RECENT ACTIVITIES:\n`;
        recentActivities.forEach(activity => {
          const time = new Date(activity.timestamp).toLocaleTimeString();
          contextText += `├── [${time}] ${activity.agent}: ${activity.action} - ${activity.task}\n`;
        });
        contextText += `\n`;
      }

      // Active features
      if (Object.keys(this.memory.features).length > 0) {
        contextText += `🎯 ACTIVE FEATURES:\n`;
        Object.entries(this.memory.features).forEach(([name, feature]) => {
          contextText += `├── ${name}: ${feature.phase} (${feature.completionRate}%)\n`;
          if (feature.activeAgents.length > 0) {
            contextText += `│   └── Active: ${feature.activeAgents.join(', ')}\n`;
          }
        });
      }
    }

    if (contextType === 'feature-specific' && featureName) {
      const feature = this.memory.features[featureName];
      if (feature) {
        contextText += `🎯 FEATURE: ${featureName}\n`;
        contextText += `├── Phase: ${feature.phase}\n`;
        contextText += `├── Progress: ${feature.completionRate}%\n`;
        contextText += `├── Active agents: ${feature.activeAgents.join(', ') || 'None'}\n`;
        contextText += `├── Completed tasks: ${feature.completedTasks.length}\n`;
        contextText += `└── Blockers: ${feature.blockers.length}\n`;
      } else {
        contextText += `❌ Feature '${featureName}' not found in memory.\n`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: contextText
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server when this file is run directly
const server = new AppIQMemorySmithery();
server.run().catch(console.error);
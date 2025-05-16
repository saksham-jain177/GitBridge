# GitBridge MCP Integration Guide

This guide explains how to integrate GitBridge's MCP (Model Context Protocol) server with various AI assistants.

## What is GitBridge MCP?

GitBridge MCP is a server that implements the Model Context Protocol, allowing AI assistants to analyze GitHub repositories. It provides structured access to repository data, README content, and other GitHub information.

## Integration Options

### 1. Cursor IDE

To integrate GitBridge MCP with Cursor IDE:

1. Create a file at `C:\Users\<username>\.cursor\mcp.json` (Windows) or `~/.cursor/mcp.json` (macOS/Linux)
2. Add the following content:

```json
{
  "mcpServers": {
    "gitbridge-mcp": {
      "url": "https://gitbridge-mib3.onrender.com/mcp"
    }
  }
}
```

3. Restart Cursor IDE
4. Test the integration by asking Cursor's AI: "Analyze the repository tensorflow/tensorflow using GitBridge"

### 2. Claude Desktop

To integrate GitBridge MCP with Claude Desktop:

1. Locate your Claude Desktop configuration file:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the following to the configuration file:

```json
{
  "mcp_servers": [
    {
      "name": "GitBridge",
      "url": "https://gitbridge-mib3.onrender.com/mcp",
      "enabled": true,
      "description": "GitHub Repository Analyzer"
    }
  ]
}
```

3. Save the file and restart Claude Desktop
4. Test the integration by asking Claude: "Analyze the repository tensorflow/tensorflow using GitBridge"

### 3. Anthropic Claude API

If you're using Claude through Anthropic's API, you can integrate GitBridge as follows:

```json
{
  "model": "claude-3-5-sonnet",
  "max_tokens": 1000,
  "messages": [
    { "role": "user", "content": "Analyze the repository tensorflow/tensorflow" }
  ],
  "tools": [
    {
      "name": "GitBridge",
      "url": "https://gitbridge-mib3.onrender.com/mcp",
      "description": "GitHub Repository Analyzer"
    }
  ]
}
```

## Using a Local GitBridge Server

If you're running GitBridge locally, replace the URL with your local server URL:

```
http://localhost:10001/mcp
```

## Troubleshooting

If you encounter issues with the MCP integration:

1. **Connection Errors**: Ensure your server is running and accessible
2. **CORS Issues**: Check if your browser is blocking cross-origin requests
3. **Authentication**: Some AI assistants may require authentication for MCP servers
4. **Firewall Issues**: Make sure your firewall allows connections to the MCP server

## Available Actions

GitBridge MCP provides the following actions:

1. `search_repositories`: Search for GitHub repositories
2. `get_repository`: Get repository details
3. `get_readme`: Get README.md content from a repository

## Example Queries

Once integrated, you can ask your AI assistant:

- "Analyze the repository tensorflow/tensorflow"
- "What are the main features of facebook/react?"
- "Show me the README from kubernetes/kubernetes"
- "What languages are used in microsoft/vscode?"

# GitHub Repository Analyzer MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to analyze GitHub repositories. This server provides structured access to GitHub repository data, allowing AI models to perform detailed analysis of software projects.

## Live Demo

🚀 Try it out: [GitBridge Live Demo](https://gitbridge-mib3.onrender.com/)

The live demo allows you to:

- Explore GitHub repository data through the MCP interface
- Test repository analysis capabilities
- Try different query parameters

## Features

- **Repository Analysis**: Fetch detailed information about any public GitHub repository
- **Search Capabilities**: Search across GitHub repositories
- **README Access**: Retrieve repository README content
- **AI Integration**: Ready for integration with AI assistants via MCP

## Architecture

```text
┌─────────────┐      ┌───────────────┐      ┌─────────────┐
│             │      │               │      │             │
│   AI Model  │◄────►│   MCP Server  │◄────►│  GitHub API │
│             │      │               │      │             │
└─────────────┘      └───────────────┘      └─────────────┘
```

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- GitHub Personal Access Token

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/saksham-jain177/GitBridge.git
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory:

    ```bash
    GITHUB_TOKEN=your_github_personal_access_token
    PORT=10000
    ```

## Usage

1. Start the MCP server:

    ```bash
    npm start
    ```

2. For development with auto-restart on file changes:

    ```bash
    npm run dev
    ```

3. The server will be running at `http://localhost:10000`

### Available Endpoints

- `GET /mcp`: Get server metadata and available tools
- `POST /mcp`: Execute tools with parameters

### Available Tools

1. **search_repositories**
   - Search GitHub repositories
   - Parameters: query, sort, order

2. **get_repository**
   - Get detailed repository information
   - Parameters: owner, repo

3. **get_readme**
   - Get repository README content
   - Parameters: owner, repo

## Integration with AI Assistants

This MCP server is designed to work with AI assistants through the Model Context Protocol. When integrated with Claude, Cursor IDE, or similar AI assistants, it enables:

1. Dynamic repository analysis based on user input
2. Real-time data fetching from GitHub
3. Structured response generation

### Cursor IDE Integration

To integrate GitBridge with Cursor IDE:

1. Open Cursor IDE settings
2. Navigate to the AI settings section
3. Add a new MCP provider with the following configuration:

```json
{
  "name": "GitBridge",
  "endpoint": "https://gitbridge-mib3.onrender.com/mcp"
}
```

1. Save the settings and restart Cursor IDE
1. You can now ask Cursor about GitHub repositories

### Claude Desktop Integration

To integrate GitBridge with Claude Desktop:

1. Create a file named `gitbridge-mcp.json` with the following content:

```json
{
  "mcp": {
    "endpoint": "https://gitbridge-mib3.onrender.com/mcp"
  }
}
```

1. Import this configuration in Claude Desktop
1. You can now ask Claude about GitHub repositories

## Example Interaction

```text
User: Tell me about the microsoft/vscode repository
Assistant: The microsoft/vscode repository is the official repository for Visual Studio Code, a popular open-source code editor developed by Microsoft.

Repository details:
- Description: Visual Studio Code
- Stars: 150K+
- Language: TypeScript
- Created: September 2015
- Last updated: [recent date]
```

## JSON-RPC 2.0 Implementation

This server implements the JSON-RPC 2.0 specification for all communications:

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": "request_id",
  "method": "get_repository",
  "params": {
    "owner": "microsoft",
    "repo": "vscode"
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": "request_id",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Repository data in JSON format"
      }
    ]
  }
}
```

## Development

To modify or extend the server:

1. Add new tools in `routes/mcp.js`
2. Implement corresponding services in `services/github.js`
3. Update the metadata schema as needed

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

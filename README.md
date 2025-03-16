# GitHub Repository Analyzer MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to analyze GitHub repositories. This server provides structured access to GitHub repository data, issues, and pull requests, allowing AI models to perform detailed analysis of software projects.

## Live Demo

🚀 Try it out: [GitBridge Live Demo](https://gitbridge-mib3.onrender.com/)

The live demo allows you to:
- Test repository analysis with AI integration
- Explore GitHub repository data through the MCP interface
- Try different analysis parameters and queries

## Features

- **Repository Analysis**: Fetch detailed information about any public GitHub repository
- **Issue Tracking**: Access and analyze repository issues
- **Pull Request Analysis**: Review pull request data and statistics
- **Search Capabilities**: Search across GitHub repositories
- **AI Integration**: Ready for integration with AI assistants (Claude, GPT, etc.)
  
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
- npm (Node Package Manager)- GitHub Personal Access Token
- OpenRouter API Key (for testing)
  
## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/saksham-jain177/GitBridge
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory:

    ```bash
    GITHUB_TOKEN=your_github_personal_access_token
    OPENROUTER_API_KEY=your_openrouter_api_key
    PORT=3000
    ```

## Usage

1. Start the MCP server:

    ```bash
    npm start
    ```

2. The server will be running at `http://localhost:3000`

### Testing with OpenRouter Integration

Run the test script:

```bash
node openrouter-integration.js
```

### Available Endpoints

- `GET /mcp`: Get server metadata and available actions
- `POST /mcp`: Execute actions with parameters

### Available Actions

1. **search_repositories**
   - Search GitHub repositories   - Parameters: query, sort, order, per_page
2. **get_repository**
   - Get detailed repository information   - Parameters: owner, repo
3. **list_issues**
   - List repository issues   - Parameters: owner, repo, state, per_page
4. **create_issue**
   - Create a new issue   - Parameters: owner, repo, title, body, labels
5. **list_pull_requests**
   - List repository pull requests
   - Parameters: owner, repo, state, per_page
  
## Integration with AI Assistants

This MCP server is designed to work with AI assistants through the Model Context Protocol. When integrated with Claude or similar AI assistants, it enables:

1. Dynamic repository analysis based on user input
2. Customized analysis focus areas3. Real-time data fetching and processing
3. Structured response generation

## Example Interaction

```text
textUser: Analyze the repository microsoft/vscode
Assistant: I'll analyze the VS Code repository for you.[Fetches data through MCP server]

Here's the analysis:- Repository Stats: XX stars, XX forks
- Recent Activity: XX open issues, last updated XX- Technical Stack: Primary language, main dependencies
- Key Insights: [Generated from data]
```

## Development

To modify or extend the server:

1. Add new actions in `routes/mcp.js`
2. Implement corresponding services in `services/github.js`
3. Update the metadata schema as needed

## Contributing

1. Fork the repository
2. Create your feature branch. Commit your changes
3. Push to the branch5. Create a Pull Request

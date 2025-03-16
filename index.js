require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mcpRoutes = require('./routes/mcp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>GitHub Repository Analyzer MCP Server</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 1000px;
                margin: 40px auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1, h2 {
                color: #333;
                margin-bottom: 20px;
            }
            .button-container {
                display: flex;
                gap: 20px;
                margin-top: 30px;
            }
            .button {
                padding: 12px 24px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: transform 0.1s;
            }
            .button:hover {
                transform: translateY(-2px);
            }
            .health-button {
                background-color: #4CAF50;
                color: white;
            }
            .mcp-button {
                background-color: #2196F3;
                color: white;
            }
            .description {
                color: #666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .code-block {
                background-color: #f8f8f8;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
                margin: 10px 0;
            }
            .usage-section {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .test-section {
                margin-top: 30px;
                padding: 20px;
                background-color: #f0f8ff;
                border-radius: 5px;
            }
            .input-group {
                margin-bottom: 15px;
            }
            .input-group label {
                display: block;
                margin-bottom: 5px;
                color: #333;
            }
            .input-group input, .input-group select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .test-button {
                background-color: #673ab7;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            #result {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f8f8;
                border-radius: 4px;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>GitHub Repository Analyzer MCP Server</h1>
            <p class="description">
                This server provides a Model Context Protocol (MCP) interface for AI assistants 
                to analyze GitHub repositories. It enables structured access to repository data, 
                issues, and pull requests.
            </p>
            <div class="button-container">
                <a href="/health">
                    <button class="button health-button">Check Health Status</button>
                </a>
                <a href="/mcp">
                    <button class="button mcp-button">View MCP Endpoint</button>
                </a>
            </div>

            <div class="test-section">
                <h2>Interactive API Tester</h2>
                <div class="input-group">
                    <label for="action">Select Action:</label>
                    <select id="action">
                        <option value="analyze_repo">Analyze Repository</option>
                        <option value="list_issues">List Issues</option>
                        <option value="get_repository">Get Repository Details</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="repo">Repository (owner/name):</label>
                    <input type="text" id="repo" placeholder="e.g., facebook/react">
                </div>
                <button onclick="testAPI()" class="test-button">Test API</button>
                <div id="result"></div>
            </div>

            <div class="usage-section">
                <h2>AI Assistant Integration Guide</h2>
                <p class="description">
                    To use this server with your AI assistant (Claude, GPT, etc.):
                </p>
                <div class="code-block">
                    1. Use OpenRouter Integration:
                    - Set up environment variables (OPENROUTER_API_KEY)
                    - Run: node openrouter-integration.js
                    
                    2. Direct API Calls:
                    - Make POST requests to /mcp endpoint
                    - Include action_id and parameters
                    
                    3. Example AI Prompt:
                    "Analyze the GitHub repository microsoft/vscode using the MCP server at ${your-render-url}/mcp"
                </div>
            </div>
        </div>

        <script>
        async function testAPI() {
            const action = document.getElementById('action').value;
            const repo = document.getElementById('repo').value;
            const [owner, repoName] = repo.split('/');
            
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = 'Loading...';
            
            try {
                const response = await fetch('/mcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action_id: action,
                        parameters: {
                            owner: owner,
                            repo: repoName
                        }
                    })
                });
                
                const data = await response.json();
                resultDiv.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
            }
        }
        </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// MCP routes
app.use('/mcp', mcpRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});

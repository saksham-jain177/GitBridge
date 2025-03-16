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
  // Get the current server URL
  const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>GitHub Repository Analyzer MCP Server</title>
        <style>
            /* Theme Variables */
            :root {
                --bg-color: #f5f7fa;
                --text-color: #333;
                --container-bg: white;
                --section-bg: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
                --border-color: #e1e8ed;
                --code-bg: #2d2d2d;
                --code-color: #fff;
                --button-primary: #4CAF50;
                --button-secondary: #2196F3;
                --button-test: #673ab7;
            }

            [data-theme="dark"] {
                --bg-color: #1a1a1a;
                --text-color: #e0e0e0;
                --container-bg: #2d2d2d;
                --section-bg: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
                --border-color: #404040;
                --code-bg: #000000;
                --code-color: #fff;
                --button-primary: #45a049;
                --button-secondary: #1976D2;
                --button-test: #5e35b1;
            }

            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                background: var(--bg-color);
                color: var(--text-color);
                transition: all 0.3s ease;
            }

            .container {
                max-width: 800px;
                margin: 40px auto;
                padding: 40px;
                background-color: var(--container-bg);
                border-radius: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }

            h1 {
                background: linear-gradient(90deg, #2196F3, #673ab7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-size: 2.5em;
                margin-bottom: 30px;
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
                transition: all 0.3s ease;
                font-weight: 600;
            }

            .button:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }

            .health-button {
                background-color: var(--button-primary);
                color: white;
            }

            .mcp-button {
                background-color: var(--button-secondary);
                color: white;
            }

            .description {
                color: var(--text-color);
                line-height: 1.6;
                margin-bottom: 20px;
            }

            .code-block {
                background: var(--code-bg);
                color: var(--code-color);
                padding: 20px;
                border-radius: 8px;
                font-family: 'Consolas', monospace;
                line-height: 1.6;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                white-space: pre-wrap;       /* Changed from pre to pre-wrap */
                word-wrap: break-word;       /* Added to ensure text wraps */
                max-width: 100%;            /* Added to contain width */
                overflow-x: auto;           /* Added for safety */
            }

            .usage-section {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--border-color);
            }

            .test-section {
                border: 1px solid var(--border-color);
                margin-top: 40px;
                padding: 30px;
                border-radius: 8px;
                /* Removed the background gradient */
                background: var(--container-bg);
            }

            .input-group {
                margin-bottom: 15px;
            }

            .input-group label {
                display: block;
                margin-bottom: 5px;
                color: var(--text-color);
            }

            .input-group input, .input-group select {
                width: 100%;
                padding: 8px;
                border: 2px solid var(--border-color);
                border-radius: 4px;
                transition: all 0.3s ease;
                background: var(--container-bg);
                color: var(--text-color);
            }

            .input-group input:focus, .input-group select:focus {
                border-color: var(--button-secondary);
                box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
                outline: none;
            }

            .test-button {
                background-color: var(--button-test);
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }

            #result {
                margin-top: 20px;
                padding: 15px;
                background-color: var(--code-bg);
                color: var(--code-color);
                border-radius: 4px;
                white-space: pre-wrap;
            }

            #result.placeholder {
                color: var(--code-color);
                opacity: 0.7;
                font-style: italic;
            }

            /* Theme Toggle Button */
            .theme-toggle {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 20px;
                border: none;
                background: var(--button-secondary);
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 1000;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }

            .theme-toggle:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
        </style>
    </head>
    <body>
        <button class="theme-toggle" onclick="toggleTheme()">🌓 Toggle Theme</button>
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
                    <select id="action" onchange="updateInputFields()">
                        <option value="get_repository">Get Repository Details</option>
                        <option value="list_issues">List Issues</option>
                        <option value="search_repositories">Search Repositories</option>
                    </select>
                </div>
                <div class="input-group" id="repoInput">
                    <label for="repo">Repository (owner/name):</label>
                    <input type="text" id="repo" placeholder="e.g., facebook/react">
                </div>
                <div class="input-group" id="searchInput" style="display: none;">
                    <label for="search">Search Query:</label>
                    <input type="text" id="search" placeholder="e.g., tensorflow language:python">
                </div>
                <button onclick="testAPI()" class="test-button">Test API</button>
                <div id="result" class="placeholder">
                    API response will appear here after clicking "Test API"
                    
                    Example response format:
                    {
                        "status": "success",
                        "data": {
                            // Repository details or search results
                        }
                    }
                </div>
            </div>

            <div class="usage-section">
                <h2>AI Assistant Integration Guide</h2>
                <p class="description">
                    To use this server with your AI assistant (Claude, GPT, etc.):
                </p>
                <div class="code-block">
1. Use OpenRouter Integration:
   • Set up environment variables (OPENROUTER_API_KEY)
   • Run: node openrouter-integration.js

2. Direct API Calls:
   • Make POST requests to ${serverUrl}/mcp endpoint
   • Include action_id and parameters

3. Example AI Prompt:
   • "Analyze the GitHub repository microsoft/vscode using the MCP server at ${serverUrl}/mcp"
                </div>
            </div>
        </div>

        <script>
        function toggleTheme() {
            const body = document.body;
            const currentTheme = body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                body.removeAttribute('data-theme');
            } else {
                body.setAttribute('data-theme', 'dark');
            }
            localStorage.setItem('theme', body.getAttribute('data-theme') || 'light');
        }

        // Load saved theme preference
        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
            }
            updateInputFields();
        });

        const SERVER_URL = '${serverUrl}';

        function updateInputFields() {
            const action = document.getElementById('action').value;
            const repoInput = document.getElementById('repoInput');
            const searchInput = document.getElementById('searchInput');
            
            if (action === 'search_repositories') {
                repoInput.style.display = 'none';
                searchInput.style.display = 'block';
            } else {
                repoInput.style.display = 'block';
                searchInput.style.display = 'none';
            }
        }

        async function testAPI() {
            const action = document.getElementById('action').value;
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = 'Loading...';
            
            try {
                let parameters = {};
                
                if (action === 'search_repositories') {
                    const searchQuery = document.getElementById('search').value;
                    parameters = {
                        query: searchQuery,
                        sort: 'stars',
                        order: 'desc',
                        per_page: 10
                    };
                } else {
                    const repo = document.getElementById('repo').value;
                    const [owner, repoName] = repo.split('/');
                    parameters = {
                        owner: owner,
                        repo: repoName
                    };
                }
                
                const response = await fetch('/mcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action_id: action,
                        parameters: parameters
                    })
                });
                
                const data = await response.json();
                resultDiv.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
            }
        }

        // Initialize form on load
        document.addEventListener('DOMContentLoaded', updateInputFields);
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

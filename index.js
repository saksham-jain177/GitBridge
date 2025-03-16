require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mcpRoutes = require('./routes/mcp');
const path = require('path');
const { analyzeGitHubRepository } = require('./openrouter-integration');
const responseTemplates = require('./config/response-templates');
const os = require('os');
const process = require('process');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Rate limit exceeded. Please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes
app.use(limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add this new route before your existing routes
app.get('/templates', (req, res) => {
    res.json(responseTemplates);
});

// Root route
app.get('/', (req, res) => {
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

            .mode-switch {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            /* Toggle Switch */
            .switch {
                position: relative;
                display: inline-flex;
                align-items: center;
                cursor: pointer;
            }

            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: relative;
                width: 60px;
                height: 30px;
                background-color: var(--button-secondary);
                border-radius: 34px;
                transition: .4s;
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                border-radius: 50%;
                transition: .4s;
            }

            .switch input:checked + .slider {
                background-color: var(--button-primary);
            }

            .switch input:checked + .slider:before {
                transform: translateX(30px);
            }

            .mode-label {
                margin-left: 10px;
                font-size: 14px;
                color: var(--text-color);
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
                <div class="mode-switch">
                    <h2>Interactive API Tester</h2>
                    <label class="switch">
                        <input type="checkbox" id="modeToggle" onchange="switchMode()">
                        <span class="slider round"></span>
                        <span class="mode-label">AI Mode</span>
                    </label>
                </div>

                <!-- Raw API Mode -->
                <div id="rawApiMode">
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
                </div>

                <!-- AI Analysis Mode -->
                <div id="aiAnalysisMode" style="display: none;">
                    <div class="input-group">
                        <label for="aiRepoInput">Repository Path:</label>
                        <input type="text" id="aiRepoInput" placeholder="e.g., facebook/react or microsoft">
                    </div>
                    <div class="input-group">
                        <label for="aiPromptInput">Analysis Focus:</label>
                        <input type="text" id="aiPromptInput" 
                            placeholder="e.g., Analyze code quality and recent activity"
                            title="What aspects of the repository would you like to analyze?">
                    </div>
                    <button onclick="analyzeWithAI()" class="test-button">Analyze</button>
                </div>

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

        function switchMode() {
            const isAIMode = document.getElementById('modeToggle').checked;
            const rawMode = document.getElementById('rawApiMode');
            const aiMode = document.getElementById('aiAnalysisMode');
            const resultDiv = document.getElementById('result');
            
            rawMode.style.display = isAIMode ? 'none' : 'block';
            aiMode.style.display = isAIMode ? 'block' : 'none';
            
            const aiModeText = \`AI Analysis results will appear here after clicking "Analyze"

Example response format:
{
    "analysis": {
        "repository_overview": "...",
        "code_quality": "...",
        "activity_metrics": "...",
        "recommendations": "..."
    }
}\`;

            const apiModeText = \`API response will appear here after clicking "Test API"

Example response format:
{
    "status": "success",
    "data": {
        // Repository details or search results
    }
}\`;

            resultDiv.textContent = isAIMode ? aiModeText : apiModeText;
        }

        async function analyzeWithAI() {
            const resultDiv = document.getElementById('result');
            const repoInput = document.getElementById('aiRepoInput');
            const promptInput = document.getElementById('aiPromptInput');
            
            if (!repoInput) {
                resultDiv.textContent = 'Error: Repository input field not found';
                return;
            }
            
            const repoPath = repoInput.value.trim();
            const prompt = promptInput ? promptInput.value : '';
            
            resultDiv.textContent = 'Analyzing...';
            
            try {
                if (!repoPath) {
                    throw new Error('Please enter a repository path');
                }
                
                const [owner, repo] = repoPath.split('/');
                if (!owner || !repo) {
                    throw new Error('Invalid repository format. Use format: owner/repo');
                }
                
                const response = await fetch('/analyze-repo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        owner: owner,
                        repo: repo,
                        prompt: prompt
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Analysis failed');
                }
                
                const data = await response.json();
                resultDiv.textContent = data.analysis;
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
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      memory: {
        total: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
        free: `${Math.round(os.freemem() / (1024 * 1024 * 1024))}GB`,
        usage: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        load: os.loadavg()
      }
    },
    server: {
      name: 'GitHub MCP Server',
      version: '1.0.0',
      node: process.version,
      platform: process.platform,
      pid: process.pid
    },
    endpoints: {
      mcp: '/mcp',
      analyze: '/analyze-repo',
      templates: '/templates'
    }
  };

  // Add custom header for monitoring tools
  res.set('X-Health-Check', 'passed');

  // If it's an HTML request, serve a styled page
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Health Status</title>
        <style>
          :root {
            --bg-color: #f0f2f5;
            --text-color: #2f3437;
            --success-color: #00c853;
            --warning-color: #ffd600;
            --error-color: #ff3d00;
            --header-bg: linear-gradient(135deg, #2196F3, #1565C0);
            --card-bg: #ffffff;
            --border-color: #e0e4e8;
            --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
            --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 16px;
          }

          [data-theme="dark"] {
            --bg-color: #1a1b1e;
            --text-color: #e0e0e0;
            --header-bg: linear-gradient(135deg, #1565C0, #0D47A1);
            --card-bg: #2d2d2d;
            --border-color: #404040;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            padding: 20px;
            min-height: 100vh;
          }

          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }

          .header {
            background: var(--header-bg);
            color: white;
            padding: 30px;
            border-radius: var(--radius-lg);
            margin-bottom: 30px;
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: hidden;
          }

          .header::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
            pointer-events: none;
          }

          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            background: var(--success-color);
            color: white;
            border-radius: 30px;
            font-weight: 600;
            font-size: 0.9em;
            box-shadow: var(--shadow-sm);
          }

          .status-badge::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            background: currentColor;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .metric-group {
            background: var(--card-bg);
            padding: 25px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .metric-group:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
          }

          .metric-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #2196F3;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .metric-title::before {
            content: '';
            display: block;
            width: 4px;
            height: 20px;
            background: currentColor;
            border-radius: 4px;
          }

          .metric {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-color);
          }

          .metric:last-child {
            border-bottom: none;
          }

          .metric span:first-child {
            color: var(--text-color);
            opacity: 0.8;
          }

          .metric span:last-child {
            font-weight: 500;
          }

          .refresh-button {
            background: #2196F3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 auto;
            transition: all 0.2s ease;
          }

          .refresh-button:hover {
            background: #1976D2;
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          .refresh-button::before {
            content: '↻';
            font-size: 1.2em;
          }

          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }

          @media (max-width: 768px) {
            .container {
              padding: 10px;
            }
            
            .header {
              padding: 20px;
            }

            .grid {
              grid-template-columns: 1fr;
            }
          }

          .theme-toggle {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9em;
            backdrop-filter: blur(5px);
            transition: all 0.2s ease;
          }

          .theme-toggle:hover {
            background: rgba(255,255,255,0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <button class="theme-toggle" onclick="toggleTheme()">🌓 Toggle Theme</button>
            <h1>Server Health Status</h1>
            <div class="status-badge">Status: ${healthInfo.status.toUpperCase()}</div>
          </div>

          <div class="grid">
            <div class="metric-group">
              <div class="metric-title">System Information</div>
              <div class="metric">
                <span>Memory Total</span>
                <span>${healthInfo.system.memory.total}</span>
              </div>
              <div class="metric">
                <span>Memory Free</span>
                <span>${healthInfo.system.memory.free}</span>
              </div>
              <div class="metric">
                <span>Memory Usage</span>
                <span>${healthInfo.system.memory.usage}</span>
              </div>
              <div class="metric">
                <span>CPU Cores</span>
                <span>${healthInfo.system.cpu.cores}</span>
              </div>
              <div class="metric">
                <span>CPU Load</span>
                <span>${healthInfo.system.cpu.load.map(load => load.toFixed(2)).join(', ')}</span>
              </div>
            </div>

            <div class="metric-group">
              <div class="metric-title">Server Information</div>
              <div class="metric">
                <span>Name</span>
                <span>${healthInfo.server.name}</span>
              </div>
              <div class="metric">
                <span>Version</span>
                <span>${healthInfo.server.version}</span>
              </div>
              <div class="metric">
                <span>Node.js</span>
                <span>${healthInfo.server.node}</span>
              </div>
              <div class="metric">
                <span>Platform</span>
                <span>${healthInfo.server.platform}</span>
              </div>
              <div class="metric">
                <span>Uptime</span>
                <span>${Math.floor(healthInfo.uptime)} seconds</span>
              </div>
            </div>

            <div class="metric-group">
              <div class="metric-title">Available Endpoints</div>
              ${Object.entries(healthInfo.endpoints)
                .map(([name, path]) => `
                  <div class="metric">
                    <span>${name}</span>
                    <span>${path}</span>
                  </div>
                `).join('')}
            </div>
          </div>

          <button class="refresh-button" onclick="location.reload()">
            Refresh Status
          </button>
        </div>

        <script>
          // Theme toggling functionality
          function toggleTheme() {
            const body = document.body;
            const currentTheme = body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
              body.removeAttribute('data-theme');
              localStorage.setItem('theme', 'light');
            } else {
              body.setAttribute('data-theme', 'dark');
              localStorage.setItem('theme', 'dark');
            }
          }

          // Load saved theme
          document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
              document.body.setAttribute('data-theme', 'dark');
            }
          });

          // Auto-refresh every 30 seconds
          setTimeout(() => location.reload(), 30000);
        </script>
      </body>
      </html>
    `);
  } else {
    // For API requests, return JSON
    res.json(healthInfo);
  }
});

// MCP routes
app.use('/mcp', mcpRoutes);

// Add the analyze-repo endpoint
app.post('/analyze-repo', async (req, res) => {
    try {
        const { owner, repo, prompt } = req.body;
        const analysis = await analyzeGitHubRepository(owner, repo);
        res.json({ analysis: analysis.repositoryAnalysis });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});

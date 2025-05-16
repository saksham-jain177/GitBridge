'use strict';

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
const handlebars = require('handlebars');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const sourceMap = require('source-map');

// JSON-RPC 2.0 Response Builder
const createJsonRpcResponse = (id, result, error = null) => {
    if (error) {
        return {
            jsonrpc: "2.0",
            id: id,
            error: {
                code: error.code || -32603,
                message: error.message || "Internal error"
            }
        };
    }

    return {
        jsonrpc: "2.0",
        id: id,
        result: result
    };
};

// Use PORT from environment variable with fallback to 10001
const PORT = process.env.PORT || 10001;

const app = express();
app.use(express.static('public')); // Add this line to serve static files

// Trust Render's proxy
app.set('trust proxy', 1);

// Rate limiter configuration
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 100, // increase from 5 to 100 requests per hour
    handler: function (req, res) {
        const error = {
            code: 429,
            message: 'Rate limit exceeded. Please try again later.'
        };
        res.status(429).json(createJsonRpcResponse(req.body?.id, null, error));
    }
});

// Middleware
// Configure CORS to allow Cursor IDE to connect
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'User-Agent', 'Origin'],
  exposedHeaders: ['Content-Type', 'Content-Length'],
  credentials: true
}));
app.use(express.json());
app.use(apiLimiter);
app.use('/favicon.ico', express.static('https://github.githubassets.com/favicon.ico'));

// Add this middleware before your routes
app.use((req, res, next) => {
    if (req.url.endsWith('.map')) {
        res.set('Content-Type', 'application/json');
        res.set('X-SourceMap', 'true');
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json(createJsonRpcResponse(null, null, {
            code: -32700,
            message: "Parse error",
            data: err.message
        }));
    }
    next(err);
});

// Add these routes before your existing routes
app.get('/templates', (req, res) => {
    res.json(responseTemplates);
});

// Add a route for the Cursor MCP test page
app.get('/cursor-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cursor-mcp-test.html'));
});

// Root route
app.get('/', (req, res) => {
  const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

  // Create HTML content with proper variable substitution
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>GitHub Repository Analyzer MCP Server</title>
        <link rel="stylesheet" href="/styles/main.css">
        <link rel="icon" type="image/x-icon" href="https://github.githubassets.com/favicon.ico">
        <script src="/js/main.js" defer></script>
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

                <!-- Repository Details Mode -->
                <div id="rawApiMode">
                    <div class="input-group">
                        <h3 class="action-title">Get Repository Details</h3>
                    </div>
                    <div class="input-group">
                        <label for="repo">Repository (owner/name):</label>
                        <input type="text" id="repo" placeholder="e.g., facebook/react">
                    </div>
                    <button onclick="testAPI()" class="test-button">Get Repository Details</button>
                </div>

                <!-- AI Analysis Mode -->
                <div id="aiAnalysisMode" style="display: none;">
                    <div class="input-group">
                        <label for="aiRepoInput">Repository Path:</label>
                        <input type="text" id="aiRepoInput" placeholder="e.g., facebook/react">
                    </div>
                    <div class="input-group">
                        <label for="promptInput">Analysis Focus:</label>
                        <input type="text" id="promptInput"
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
            // No need to call updateInputFields() anymore
        });

        const SERVER_URL = "${serverUrl}";

        // No longer needed since we removed the dropdown
        function updateInputFields() {
            // Function kept for backward compatibility but no longer does anything
        }

        async function testAPI() {
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = 'Loading...';

            try {
                const repo = document.getElementById('repo').value;

                if (!repo || !repo.includes('/')) {
                    throw new Error('Please enter a valid repository in the format owner/repo');
                }

                const [owner, repoName] = repo.split('/');
                const parameters = {
                    owner: owner,
                    repo: repoName
                };

                const response = await fetch('/mcp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        id: Date.now(),
                        method: "get_repository",
                        params: parameters
                    })
                });

                const data = await response.json();

                if (data.error) {
                    resultDiv.textContent = "Error: " + data.error.message;
                } else if (data.result !== undefined) {
                    resultDiv.textContent = JSON.stringify(data.result, null, 2);
                } else if (data.params !== undefined) {
                    // Fallback for backward compatibility
                    console.warn('Warning: MCP response using non-standard format with params instead of result');
                    resultDiv.textContent = JSON.stringify(data.params, null, 2);
                } else {
                    resultDiv.textContent = JSON.stringify(data, null, 2);
                }
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

            const aiModeText = "AI Analysis results will appear here after clicking \\"Analyze\\"\\n\\nExample response format:\\n{\\n    \\"analysis\\": {\\n        \\"repository_overview\\": \\"...\\",\\n        \\"code_quality\\": \\"...\\",\\n        \\"activity_metrics\\": \\"...\\",\\n        \\"recommendations\\": \\"...\\"\\n    }\\n}";

            const apiModeText = "API response will appear here after clicking \\"Test API\\"\\n\\nExample response format:\\n{\\n    \\"status\\": \\"success\\",\\n    \\"data\\": {\\n        // Repository details or search results\\n    }\\n}";

            resultDiv.textContent = isAIMode ? aiModeText : apiModeText;
        }

        async function analyzeWithAI() {
            const resultDiv = document.getElementById('result');
            const repoInput = document.getElementById('aiRepoInput');
            const promptInput = document.getElementById('promptInput');

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

        // No initialization needed anymore
        </script>
    </body>
    </html>
  `;

  res.send(htmlContent);
});

// Load and compile the template
let healthTemplate;
(async () => {
    try {
        const templateContent = await fs.readFile(path.join(__dirname, 'views/health-status.html'), 'utf8');
        healthTemplate = handlebars.compile(templateContent);
    } catch (err) {
        console.error('Failed to load health status template:', err);
    }
})();

// Health check endpoint
app.get('/health', (req, res) => {
    // Raw health data
    const rawHealthInfo = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        system: {
            memory: {
                total: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
                free: `${Math.round(os.freemem() / (1024 * 1024 * 1024))}GB`,
                usage: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0].model,
                load: os.loadavg().map(load => load.toFixed(2)).join(', ')
            }
        },
        server: {
            name: 'GitHub MCP Server',
            version: '1.0.0',
            node: process.version,
            platform: `${process.platform} (${process.arch})`,
            pid: process.pid
        },
        endpoints: {
            mcp: '/mcp',
            analyze: '/analyze-repo'
        }
    };

    // Format data for the template with dynamic metric groups
    const templateData = {
        status: rawHealthInfo.status,
        metricGroups: [
            {
                title: 'System Information',
                metrics: [
                    { label: 'Memory Total', value: rawHealthInfo.system.memory.total },
                    { label: 'Memory Free', value: rawHealthInfo.system.memory.free },
                    { label: 'Memory Usage', value: rawHealthInfo.system.memory.usage },
                    { label: 'CPU Cores', value: rawHealthInfo.system.cpu.cores }
                ]
            },
            {
                title: 'Server Information',
                metrics: [
                    { label: 'Name', value: rawHealthInfo.server.name },
                    { label: 'Version', value: rawHealthInfo.server.version },
                    { label: 'Node.js', value: rawHealthInfo.server.node },
                    { label: 'Platform', value: rawHealthInfo.server.platform }
                ]
            },
            {
                title: 'Available Endpoints',
                metrics: Object.entries(rawHealthInfo.endpoints).map(([key, value]) => ({
                    label: key,
                    value: value
                }))
            }
        ]
    };

    res.set('X-Health-Check', 'passed');

    if (req.accepts('html')) {
        if (!healthTemplate) {
            return res.status(500).send('Template not loaded');
        }
        res.send(healthTemplate(templateData));
    } else {
        res.json(rawHealthInfo);
    }
});

// Simple SSE test endpoint
app.get('/sse-test', (req, res) => {
  console.log('SSE test endpoint accessed');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send an initial message
  res.write(`data: ${JSON.stringify({
    status: "connected",
    message: "SSE connection established",
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Send a ping every 5 seconds
  const pingInterval = setInterval(() => {
    console.log('Sending ping from /sse-test');
    res.write(`data: ${JSON.stringify({
      status: "ping",
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 5000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE test connection closed');
    clearInterval(pingInterval);
  });
});

// Direct SSE implementation for MCP
// This endpoint is deprecated - use /mcp with Accept: text/event-stream header instead
app.get('/mcp-sse', (req, res) => {
  console.log('MCP SSE endpoint accessed - redirecting to /mcp');
  res.redirect(307, '/mcp');
});

// Add a test endpoint for Cursor IDE compatibility
app.post('/cursor-test', (req, res) => {
  console.log('Cursor test endpoint called');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  // Create a response in the exact format Cursor IDE expects
  const response = {
    jsonrpc: "2.0",
    id: req.body.id || "test_1",
    result: {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: "This is a test response for Cursor IDE",
            timestamp: new Date().toISOString(),
            requestBody: req.body
          }, null, 2)
        }
      ]
    }
  };

  console.log('Sending response:', JSON.stringify(response));
  res.json(response);
});

// MCP routes
app.use('/mcp', mcpRoutes);

// Analyze repo endpoint with JSON-RPC
app.post('/analyze-repo', async (req, res) => {
    const { id = "analyze_1", params } = req.body;

    try {
        const { owner, repo, prompt } = params || {};

        if (!owner || !repo) {
            return res.json(createJsonRpcResponse(id, null, {
                code: -32602,
                message: "Missing required parameters: owner and repo"
            }));
        }

        const analysis = await analyzeGitHubRepository(owner, repo, prompt);

        // Ensure we're sending a proper JSON-RPC 2.0 response
        return res.json(createJsonRpcResponse(id, analysis));

    } catch (error) {
        return res.json(createJsonRpcResponse(id, null, {
            code: -32603,
            message: error.message || "Analysis failed"
        }));
    }
});

// Add source map support
app.get('*.js.map', async (req, res) => {
    try {
        const mapPath = path.join(__dirname, req.path);
        const mapExists = await fs.access(mapPath).then(() => true).catch(() => false);

        if (!mapExists) {
            return res.status(404).json({
                error: 'Source map not found',
                path: req.path
            });
        }

        const mapContent = await fs.readFile(mapPath, 'utf8');
        res.set('Content-Type', 'application/json');
        res.send(mapContent);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to load source map',
            details: error.message
        });
    }
});

// Server startup with port fallback
const startServer = async (initialPort) => {
    const tryPort = async (port) => {
        try {
            // Simple startup message
            console.log(`Starting GitBridge MCP server on port ${port}...`);

            const server = await new Promise((resolve, reject) => {
                const srv = app.listen(port)
                    .once('listening', () => resolve(srv))
                    .once('error', reject);
            });

            // Clean success message
            console.log(`✅ Server successfully started on port ${port}`);

            return server;
        } catch (err) {
            if (err.code === 'EADDRINUSE') {
                console.log(`⚠️ Port ${port} is in use, trying port ${port + 1}...`);
                return tryPort(port + 1);
            }
            throw err;
        }
    };

    return tryPort(initialPort);
};

// Connection tracking
const connections = new Set();

// Graceful shutdown handler
const shutdown = (server) => {
    console.log('⏳ Shutting down server gracefully...');

    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);

    connections.forEach(conn => conn.end());
};

// Add a simple request logger middleware that only logs to file, not console
app.use((req, _res, next) => {
    // Only log to file, not to console to reduce clutter
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.url}`;

    // Log to file
    const fs = require('fs');
    fs.appendFileSync('server-debug.log', logMessage + '\n');

    next();
});

// Start server with error handling
(async () => {
    try {
        const server = await startServer(parseInt(PORT));

        // Set up connection tracking without logging every connection
        server.on('connection', (conn) => {
            connections.add(conn);
            conn.on('close', () => {
                connections.delete(conn);
            });
        });

        // Set up signal handlers for graceful shutdown
        process.on('SIGTERM', () => shutdown(server));
        process.on('SIGINT', () => shutdown(server));

        console.log('💡 MCP server is ready for Cursor IDE connections');
        console.log('📌 Configure Cursor IDE with: http://localhost:' + PORT + '/mcp');
    } catch (err) {
        console.error('❌ Fatal server error:', err.message);
        process.exit(1);
    }
})();

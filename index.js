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

            <div class="usage-section">
                <h2>How to Use This API</h2>
                <p class="description">
                    This API allows you to analyze GitHub repositories. Here are some example requests:
                </p>

                <h3>1. Analyze a Repository</h3>
                <div class="code-block">
                    POST https://gitbridge-mib3.onrender.com/mcp<br>
                    Content-Type: application/json<br><br>
                    {<br>
                    &nbsp;&nbsp;"type": "analyze_repo",<br>
                    &nbsp;&nbsp;"repo": "owner/repository",<br>
                    &nbsp;&nbsp;"analysis_type": "full"<br>
                    }
                </div>

                <h3>2. Get Repository Issues</h3>
                <div class="code-block">
                    POST https://gitbridge-mib3.onrender.com/mcp<br>
                    Content-Type: application/json<br><br>
                    {<br>
                    &nbsp;&nbsp;"type": "list_issues",<br>
                    &nbsp;&nbsp;"repo": "owner/repository",<br>
                    &nbsp;&nbsp;"state": "open"<br>
                    }
                </div>

                <h3>3. Check API Health</h3>
                <div class="code-block">
                    GET https://gitbridge-mib3.onrender.com/health
                </div>

                <h2>Integration Example</h2>
                <div class="code-block">
                    fetch('https://gitbridge-mib3.onrender.com/mcp', {<br>
                    &nbsp;&nbsp;method: 'POST',<br>
                    &nbsp;&nbsp;headers: {<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;'Content-Type': 'application/json'<br>
                    &nbsp;&nbsp;},<br>
                    &nbsp;&nbsp;body: JSON.stringify({<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;type: 'analyze_repo',<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;repo: 'facebook/react'<br>
                    &nbsp;&nbsp;})<br>
                    })
                </div>
            </div>
        </div>
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

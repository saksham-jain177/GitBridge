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
                max-width: 800px;
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
            h1 {
                color: #333;
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

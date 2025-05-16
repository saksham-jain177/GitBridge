#!/bin/bash
# This shell script starts the GitBridge MCP server for Cursor IDE
# Usage: Add this command to Cursor IDE MCP configuration:
#       /path/to/start-mcp-server.sh

# Set environment variables
export PORT=10001

# Start the server
echo "Starting GitBridge MCP server on port $PORT..."
node index.js

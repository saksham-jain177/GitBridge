@echo off
REM This batch file starts the GitBridge MCP server for Cursor IDE
REM Usage: Add this command to Cursor IDE MCP configuration:
REM       cmd /c "path\to\start-mcp-server.bat"

REM Set environment variables
set PORT=10001

REM Start the server
echo Starting GitBridge MCP server on port %PORT%...
node index.js

REM Keep the window open if there's an error
if %ERRORLEVEL% NEQ 0 (
  echo Server failed to start with error code %ERRORLEVEL%
  pause
)

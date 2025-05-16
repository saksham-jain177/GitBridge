# Setting Up GitBridge MCP Server with Cursor IDE

This guide provides instructions for setting up the GitBridge MCP server with Cursor IDE.

## Prerequisites

- Node.js (v14 or higher) installed
- npm (Node Package Manager) installed
- Cursor IDE installed

## Setup Instructions

### Windows

1. **Start the server using the batch file:**

   ```bash
   cmd /c "path\to\start-mcp-server.bat"
   ```

   Add this command to Cursor IDE's MCP configuration.

2. **Alternative method:**

   ```bash
   cmd /c node path\to\index.js
   ```

   Make sure to use forward slashes (/) in the path and avoid spaces in the path.

### macOS/Linux

1. **Start the server using the shell script:**

   ```bash
   /path/to/start-mcp-server.sh
   ```

   Make sure the script is executable:

   ```bash
   chmod +x /path/to/start-mcp-server.sh
   ```

2. **Alternative method:**

   ```bash
   node /path/to/index.js
   ```

## Troubleshooting

If you see "No tools available" in Cursor IDE:

1. **Check the server logs:**
   - Look for any errors in the server logs
   - Verify that the server is responding to requests

2. **Test the server:**

   ```bash
   node test-cursor-mcp.js
   ```

3. **Common issues:**
   - Spaces in the path (avoid spaces in paths)
   - Using backslashes instead of forward slashes
   - Server not running on the expected port
   - Missing environment variables

4. **Windows-specific issues:**
   - Use `cmd /c` prefix for commands
   - Avoid using environment variables in the command
   - Use full paths to executables

## Testing

Run the test script to verify the MCP server is working correctly:

```bash
node test-cursor-mcp.js
```

This script tests:

1. Basic connection to the MCP server
2. rpc.discover method to get available tools
3. SSE connection for real-time updates
4. Tool execution

## Configuration

### Cursor IDE Configuration

1. Open Cursor IDE
2. Go to Settings > MCP
3. Click "Add new global MCP server"
4. Enter a name for the server (e.g., "gitbridge-mcp")
5. Select "Command" as the type
6. Enter the command to start the server (see above)
7. Click "Save"

### Server Configuration

The server uses the following environment variables:

- `PORT`: The port to run the server on (default: 10001)

You can set these variables in a `.env` file or directly in the start script.

## Troubleshooting Cursor IDE

If you're still having issues with Cursor IDE not showing tools:

1. **Restart Cursor IDE:**
   - Sometimes a restart is needed after adding a new MCP server

2. **Check Cursor IDE logs:**
   - Look for any errors related to MCP in the Cursor IDE logs

3. **Verify the server is running:**
   - Make sure the server is running and accessible
   - Check that the port is correct

4. **Try a different port:**
   - If port 10001 is already in use, try a different port

5. **Check for firewall issues:**
   - Make sure your firewall is not blocking the connection

## Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/introduction)
- [Cursor IDE Documentation](https://docs.cursor.com/context/model-context-protocol)

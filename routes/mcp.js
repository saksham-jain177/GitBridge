const express = require('express');
const router = express.Router();
const githubService = require('../services/github');
const debug = require('debug')('mcp:router');
const fs = require('fs');

// Helper function to log to a file
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFileSync('mcp-debug.log', logMessage);
}

// MCP server metadata endpoint with SSE support
router.get('/', (req, res) => {
  // Check if the client is requesting SSE
  const acceptHeader = req.headers.accept || '';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // Only log minimal connection info
  logToFile(`MCP endpoint accessed with User-Agent: ${userAgent}`);

  // Check for SSE request - Cursor IDE uses text/event-stream
  if (acceptHeader && acceptHeader.includes('text/event-stream')) {
    console.log('\n========== NEW SSE CONNECTION ==========');
    console.log('Client connected via Server-Sent Events');
    console.log('User-Agent:', userAgent);
    console.log('==========================================\n');

    // IMPORTANT: Set headers BEFORE sending any data
    // Set SSE headers using setHeader to ensure proper content type
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send an initial connection message that Cursor IDE expects
    // The format is critical for Cursor IDE to recognize the connection
    const initialMessage = {
      jsonrpc: "2.0",
      method: "mcp.status",
      params: {
        status: "ready",
        message: "MCP connection established and ready",
        timestamp: new Date().toISOString(),
        protocolVersion: "mcp-v1",
        capabilities: {},
        serverInfo: {
          name: "gitbridge-mcp",
          version: "1.0.0"
        }
      }
    };
    console.log('Sending initial SSE message:', JSON.stringify(initialMessage));
    res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);

    // Define tools in the format expected by Cursor IDE
    const tools = [
      {
        name: "search_repositories",
        description: "Search for GitHub repositories",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            sort: { type: "string", enum: ["stars", "forks", "updated"] },
            order: { type: "string", enum: ["desc", "asc"] }
          },
          required: ["query"]
        },
        annotations: {
          title: "Search GitHub Repositories",
          readOnlyHint: true,
          openWorldHint: true
        }
      },
      {
        name: "get_repository",
        description: "Get repository details",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" }
          },
          required: ["owner", "repo"]
        },
        annotations: {
          title: "Get GitHub Repository",
          readOnlyHint: true,
          openWorldHint: true
        }
      },
      {
        name: "get_readme",
        description: "Get README.md content from a repository",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" }
          },
          required: ["owner", "repo"]
        },
        annotations: {
          title: "Get Repository README",
          readOnlyHint: true,
          openWorldHint: true
        }
      }
    ];

    // Send tools notification to inform Cursor IDE about available tools
    const toolsMessage = {
      jsonrpc: "2.0",
      method: "mcp.tools",
      params: {
        protocolVersion: "mcp-v1",
        capabilities: {},
        serverInfo: {
          name: "gitbridge-mcp",
          version: "1.0.0"
        },
        functions: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }))
      }
    };

    // Send the tools notification after a short delay to ensure it's received
    setTimeout(() => {
      console.log('Sending tools notification: MCP tools list sent');
      res.write(`data: ${JSON.stringify(toolsMessage)}\n\n`);
      logToFile(`Sent tools notification: ${JSON.stringify(toolsMessage)}`);
    }, 1000);

    // Keep the connection alive with a ping every 5 seconds (more frequent for better reliability)
    const pingInterval = setInterval(() => {
      const pingMessage = {
        jsonrpc: "2.0",
        method: "mcp.ping",
        params: {
          status: "ready",
          timestamp: new Date().toISOString()
        }
      };
      // Only log the first ping message to reduce terminal clutter
      if (!res.locals.pingLogged) {
        console.log('Sending ping SSE message (subsequent pings will not be logged)');
        res.locals.pingLogged = true;
      }
      res.write(`data: ${JSON.stringify(pingMessage)}\n\n`);
    }, 5000);

    // Handle client disconnect
    req.on('close', () => {
      console.log('SSE connection closed');
      logToFile('SSE connection closed');
      clearInterval(pingInterval);
    });

    // Keep the connection open
    req.on('end', () => {
      console.log('SSE connection ended');
      logToFile('SSE connection ended');
      clearInterval(pingInterval);
    });

    // Handle errors
    req.on('error', (err) => {
      console.error('SSE connection error:', err);
      logToFile(`SSE connection error: ${err.message}`);
      clearInterval(pingInterval);
    });

    // Handle response errors
    res.on('error', (err) => {
      console.error('SSE response error:', err);
      logToFile(`SSE response error: ${err.message}`);
      clearInterval(pingInterval);
    });

    // Important: Don't call any other response methods after setting up SSE
    return;
  } else {
    // Regular JSON request - no need to log

    // Define tools in the format expected by Cursor IDE
    const tools = [
      {
        name: "search_repositories",
        description: "Search for GitHub repositories",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            sort: { type: "string", enum: ["stars", "forks", "updated"] },
            order: { type: "string", enum: ["desc", "asc"] }
          },
          required: ["query"]
        },
        annotations: {
          title: "Search GitHub Repositories",
          readOnlyHint: true,
          openWorldHint: true
        }
      },
      {
        name: "get_repository",
        description: "Get repository details",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" }
          },
          required: ["owner", "repo"]
        },
        annotations: {
          title: "Get GitHub Repository",
          readOnlyHint: true,
          openWorldHint: true
        }
      },
      {
        name: "get_readme",
        description: "Get README.md content from a repository",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" }
          },
          required: ["owner", "repo"]
        },
        annotations: {
          title: "Get Repository README",
          readOnlyHint: true,
          openWorldHint: true
        }
      }
    ];

    // Regular JSON response for non-SSE requests - format for Cursor IDE compatibility
    const response = {
      jsonrpc: "2.0",
      id: null,
      result: {
        protocolVersion: "mcp-v1",
        capabilities: {},
        serverInfo: {
          name: "gitbridge-mcp",
          version: "1.0.0"
        },
        functions: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }))
      }
    };

    // Log the response for debugging (summary only to reduce clutter)
    console.log('GET response: MCP tools list sent');
    logToFile(`Sending GET response: ${JSON.stringify(response)}`);

    res.json(response);
  }
});

// MCP action endpoint
router.post('/', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  const requestInfo = { jsonrpc, id, method, params };

  // Log the request with clear formatting
  console.log('\n========== INCOMING MCP REQUEST ==========');
  console.log(`Method: ${method}`);
  console.log(`ID: ${id}`);
  if (params) {
    console.log('Parameters:', JSON.stringify(params, null, 2).substring(0, 200) +
      (JSON.stringify(params).length > 200 ? '...' : ''));
  }
  console.log('==========================================\n');

  logToFile(`Received MCP request: ${JSON.stringify(requestInfo)}`);
  debug('Received MCP request:', { jsonrpc, id, method });

  // Validate JSON-RPC request
  if (!jsonrpc || jsonrpc !== "2.0" || !method) {
    return res.json({
      jsonrpc: "2.0",
      id: id || null,
      error: {
        code: -32600,
        message: "Invalid Request"
      }
    });
  }

  try {
    let response;

    // Log the method being called
    logToFile(`Processing method: ${method}`);
    console.log(`Processing method: ${method}`);

    // Special handling for rpc.discover which is what Cursor IDE uses
    if (method === 'rpc.discover') {
      console.log('Handling rpc.discover method');
      logToFile('Handling rpc.discover method');

      // Format specifically for Cursor IDE's rpc.discover method
      // This follows the exact format expected by Cursor IDE
      const tools = [
        {
          name: "search_repositories",
          description: "Search for GitHub repositories",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" },
              sort: { type: "string", enum: ["stars", "forks", "updated"] },
              order: { type: "string", enum: ["desc", "asc"] }
            },
            required: ["query"]
          },
          annotations: {
            title: "Search GitHub Repositories",
            readOnlyHint: true,
            openWorldHint: true
          }
        },
        {
          name: "get_repository",
          description: "Get repository details",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string" },
              repo: { type: "string" }
            },
            required: ["owner", "repo"]
          },
          annotations: {
            title: "Get GitHub Repository",
            readOnlyHint: true,
            openWorldHint: true
          }
        },
        {
          name: "get_readme",
          description: "Get README.md content from a repository",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string" },
              repo: { type: "string" }
            },
            required: ["owner", "repo"]
          },
          annotations: {
            title: "Get Repository README",
            readOnlyHint: true,
            openWorldHint: true
          }
        }
      ];

      // Create the response in the exact format expected by Cursor IDE
      // This format is critical for Cursor IDE to recognize the tools
      response = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "mcp-v1",
          capabilities: {},
          serverInfo: {
            name: "gitbridge-mcp",
            version: "1.0.0"
          },
          functions: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
          }))
        }
      };

      // Log the response with clear formatting
      console.log('\n========== OUTGOING MCP RESPONSE ==========');
      console.log('Method: rpc.discover');
      console.log('Status: Success');
      console.log('Tools count:', response.result.functions.length);
      console.log('Tool names:', response.result.functions.map(f => f.name).join(', '));
      console.log('===========================================\n');
      logToFile(`Sending rpc.discover response: ${JSON.stringify(response)}`);

      // Return the response directly since it's already in the correct format
      return res.json(response);
    }

    switch (method) {
      case 'initialize':
        // Respond to initialize request with server capabilities
        response = {
          protocolVersion: "2025-03-26",
          capabilities: {
            tools: {
              listChanged: true
            },
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: "gitbridge-mcp",
            version: "1.0.0"
          }
        };
        break;

      case 'tools/list':
        // Return the list of available tools in the format expected by MCP
        response = {
          tools: [
            {
              name: "search_repositories",
              description: "Search for GitHub repositories",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  sort: { type: "string", enum: ["stars", "forks", "updated"] },
                  order: { type: "string", enum: ["desc", "asc"] }
                },
                required: ["query"]
              }
            },
            {
              name: "get_repository",
              description: "Get repository details",
              inputSchema: {
                type: "object",
                properties: {
                  owner: { type: "string" },
                  repo: { type: "string" }
                },
                required: ["owner", "repo"]
              }
            },
            {
              name: "get_readme",
              description: "Get README.md content from a repository",
              inputSchema: {
                type: "object",
                properties: {
                  owner: { type: "string" },
                  repo: { type: "string" }
                },
                required: ["owner", "repo"]
              }
            }
          ]
        };
        break;

      case 'tools/call':
        // This is the method Cursor IDE uses to call tools
        console.log('Handling tools/call method');
        console.log('Tool name:', params?.name);
        console.log('Tool arguments:', JSON.stringify(params?.arguments || {}));

        if (!params?.name) {
          throw { code: -32602, message: "Missing required parameter: name" };
        }

        // Map the tool name to the corresponding method
        let toolMethod;
        let toolParams;

        switch (params.name) {
          case 'get_repository':
            toolMethod = 'get_repository';
            toolParams = params.arguments || {};
            break;
          case 'search_repositories':
            toolMethod = 'search_repositories';
            toolParams = params.arguments || {};
            break;
          case 'get_readme':
            toolMethod = 'get_readme';
            toolParams = params.arguments || {};
            break;
          default:
            throw { code: -32601, message: `Unknown tool: ${params.name}` };
        }

        // Create a new request to the appropriate method
        console.log(`Redirecting tools/call to method: ${toolMethod}`);

        try {
          // Call the appropriate method handler based on the tool name
          switch (toolMethod) {
            case 'get_repository':
              if (!toolParams.owner || !toolParams.repo) {
                throw { code: -32602, message: "Missing required parameters: owner and repo" };
              }
              const repoData = await githubService.getRepository(toolParams.owner, toolParams.repo);
              response = {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(repoData, null, 2)
                  }
                ],
                isError: false
              };
              break;

            case 'search_repositories':
              if (!toolParams.query) {
                throw { code: -32602, message: "Missing required parameter: query" };
              }
              const searchResults = await githubService.searchRepositories(toolParams);
              response = {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(searchResults, null, 2)
                  }
                ],
                isError: false
              };
              break;

            case 'get_readme':
              if (!toolParams.owner || !toolParams.repo) {
                throw { code: -32602, message: "Missing required parameters: owner and repo" };
              }
              const readmeData = await githubService.getReadme(toolParams.owner, toolParams.repo);
              response = {
                content: [
                  {
                    type: "text",
                    text: readmeData.content || JSON.stringify(readmeData, null, 2)
                  }
                ],
                isError: false
              };
              break;

            default:
              throw { code: -32601, message: `Method not found: ${toolMethod}` };
          }
        } catch (error) {
          console.error(`Error in tools/call for ${params.name}:`, error);
          response = {
            content: [
              {
                type: "text",
                text: `Error calling ${params.name}: ${error.message}`
              }
            ],
            isError: true
          };
        }
        break;

      case 'notifications/initialized':
        // This is a notification, not a request, so we don't need to return anything
        // But we'll acknowledge it in the logs
        console.log('Client initialized notification received');
        // Return an empty response
        response = {};
        break;

      case 'schema':
        // Return the MCP schema for Cursor IDE
        const schemaTools = [
          {
            name: "search_repositories",
            description: "Search for GitHub repositories",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string" },
                sort: { type: "string", enum: ["stars", "forks", "updated"] },
                order: { type: "string", enum: ["desc", "asc"] }
              },
              required: ["query"]
            },
            annotations: {
              title: "Search GitHub Repositories",
              readOnlyHint: true,
              openWorldHint: true
            }
          },
          {
            name: "get_repository",
            description: "Get repository details",
            inputSchema: {
              type: "object",
              properties: {
                owner: { type: "string" },
                repo: { type: "string" }
              },
              required: ["owner", "repo"]
            },
            annotations: {
              title: "Get GitHub Repository",
              readOnlyHint: true,
              openWorldHint: true
            }
          },
          {
            name: "get_readme",
            description: "Get README.md content from a repository",
            inputSchema: {
              type: "object",
              properties: {
                owner: { type: "string" },
                repo: { type: "string" }
              },
              required: ["owner", "repo"]
            },
            annotations: {
              title: "Get Repository README",
              readOnlyHint: true,
              openWorldHint: true
            }
          }
        ];

        response = {
          protocolVersion: "mcp-v1",
          capabilities: {},
          serverInfo: {
            name: "gitbridge-mcp",
            version: "1.0.0"
          },
          functions: schemaTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
          }))
        };
        break;

      case 'search_repositories':
        if (!params?.query) {
          throw { code: -32602, message: "Missing required parameter: query" };
        }
        try {
          const searchResults = await githubService.searchRepositories(params);
          // Format the response according to MCP tool result format
          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(searchResults, null, 2)
              }
            ],
            isError: false
          };
        } catch (error) {
          response = {
            content: [
              {
                type: "text",
                text: `Error searching repositories: ${error.message}`
              }
            ],
            isError: true
          };
        }
        break;

      case 'get_repository':
        if (!params?.owner || !params?.repo) {
          throw { code: -32602, message: "Missing required parameters: owner and repo" };
        }
        try {
          console.log(`\n========== TOOL CALL: get_repository ==========`);
          console.log(`Repository: ${params.owner}/${params.repo}`);
          console.log(`GitHub Token: ${process.env.GITHUB_TOKEN ? 'Present' : 'Missing'}`);
          console.log(`Client ID: ${id}`);
          console.log(`Source: ${req.headers['user-agent'] || 'Unknown'}`);

          // Add a direct test of the GitHub API
          try {
            const testResponse = await fetch('https://api.github.com/rate_limit', {
              headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GitBridge-MCP-Server'
              }
            });

            const testData = await testResponse.json();
            console.log(`API Test Status: ${testResponse.status}`);
            console.log(`Rate Limit: ${testData.rate?.remaining || 'N/A'}/${testData.rate?.limit || 'N/A'}`);

            if (testResponse.status !== 200) {
              console.error(`API Test Error: ${JSON.stringify(testData)}`);
            }
          } catch (testError) {
            console.error(`API Test Failed: ${testError.message}`);
          }

          const repoData = await githubService.getRepository(params.owner, params.repo);
          console.log(`Repository data fetched successfully`);

          // Ensure we have valid data to return
          if (!repoData) {
            throw new Error("Repository data is empty or undefined");
          }

          // Format the response according to MCP tool result format
          // IMPORTANT: Always create a new object with the exact structure expected
          const formattedText = JSON.stringify(repoData, null, 2);
          console.log(`Formatted text length: ${formattedText.length}`);

          response = {
            content: [
              {
                type: "text",
                text: formattedText
              }
            ],
            isError: false
          };

          // Verify the response structure
          console.log(`Response structure check:`);
          console.log(`- content is array: ${Array.isArray(response.content)}`);
          console.log(`- content length: ${response.content.length}`);
          console.log(`- first item has type: ${response.content[0]?.type}`);
          console.log(`- first item has text: ${typeof response.content[0]?.text === 'string'}`);
          console.log(`- text length: ${response.content[0]?.text?.length || 0}`);

          console.log(`Response formatted successfully`);
          console.log(`===========================================\n`);
        } catch (error) {
          console.error(`\n========== TOOL ERROR: get_repository ==========`);
          console.error(`Repository: ${params.owner}/${params.repo}`);
          console.error(`Error: ${error.message}`);
          console.error(`Stack: ${error.stack}`);
          console.error(`===========================================\n`);

          // Always create a properly formatted error response
          response = {
            content: [
              {
                type: "text",
                text: `Error fetching repository ${params.owner}/${params.repo}: ${error.message}`
              }
            ],
            isError: true
          };

          // Verify the error response structure
          console.log(`Error response structure check:`);
          console.log(`- content is array: ${Array.isArray(response.content)}`);
          console.log(`- content length: ${response.content.length}`);
          console.log(`- first item has type: ${response.content[0]?.type}`);
          console.log(`- first item has text: ${typeof response.content[0]?.text === 'string'}`);
        }
        break;

      case 'get_readme':
        if (!params?.owner || !params?.repo) {
          throw { code: -32602, message: "Missing required parameters: owner and repo" };
        }
        try {
          const readmeData = await githubService.getReadme(params.owner, params.repo);
          // Format the response according to MCP tool result format
          response = {
            content: [
              {
                type: "text",
                text: readmeData.content || JSON.stringify(readmeData, null, 2)
              }
            ],
            isError: false
          };
        } catch (error) {
          response = {
            content: [
              {
                type: "text",
                text: `Error fetching README: ${error.message}`
              }
            ],
            isError: true
          };
        }
        break;

      // Handle any other method by returning the schema
      default:
        console.log(`Unknown method requested: ${method}, returning schema`);
        logToFile(`Unknown method requested: ${method}, returning schema`);

        // Return the schema for any unknown method
        const defaultTools = [
          {
            name: "search_repositories",
            description: "Search for GitHub repositories",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string" },
                sort: { type: "string", enum: ["stars", "forks", "updated"] },
                order: { type: "string", enum: ["desc", "asc"] }
              },
              required: ["query"]
            },
            annotations: {
              title: "Search GitHub Repositories",
              readOnlyHint: true,
              openWorldHint: true
            }
          },
          {
            name: "get_repository",
            description: "Get repository details",
            inputSchema: {
              type: "object",
              properties: {
                owner: { type: "string" },
                repo: { type: "string" }
              },
              required: ["owner", "repo"]
            },
            annotations: {
              title: "Get GitHub Repository",
              readOnlyHint: true,
              openWorldHint: true
            }
          },
          {
            name: "get_readme",
            description: "Get README.md content from a repository",
            inputSchema: {
              type: "object",
              properties: {
                owner: { type: "string" },
                repo: { type: "string" }
              },
              required: ["owner", "repo"]
            },
            annotations: {
              title: "Get Repository README",
              readOnlyHint: true,
              openWorldHint: true
            }
          }
        ];

        response = {
          protocolVersion: "mcp-v1",
          capabilities: {},
          serverInfo: {
            name: "gitbridge-mcp",
            version: "1.0.0"
          },
          functions: defaultTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
          }))
        };
    }

    // Make sure the response is in the correct format for tool calls
    let formattedResponse = response;

    // If this is a tool call (get_repository, search_repositories, get_readme)
    if (['get_repository', 'search_repositories', 'get_readme'].includes(method)) {
      console.log(`\n========== FORMATTING FINAL RESPONSE ==========`);
      console.log(`Method: ${method}`);
      console.log(`Client ID: ${id}`);
      console.log(`Original response type: ${typeof response}`);

      // Check if response is already properly formatted
      const hasContent = response && Array.isArray(response.content) && response.content.length > 0;
      const hasIsError = typeof response?.isError === 'boolean';

      console.log(`Response has content array: ${hasContent}`);
      console.log(`Response has isError field: ${hasIsError}`);

      // Always create a fresh response object with the required structure
      // This is critical for Cursor IDE compatibility
      formattedResponse = {
        content: hasContent ? response.content : [
          {
            type: "text",
            text: typeof response === 'string' ? response : JSON.stringify(response, null, 2)
          }
        ],
        isError: hasIsError ? response.isError : false
      };

      // Ensure the content array has at least one item with type and text
      if (formattedResponse.content.length === 0) {
        console.log(`Adding default content item because array was empty`);
        formattedResponse.content.push({
          type: "text",
          text: "No content available"
        });
      }

      // Ensure each content item has the required fields
      formattedResponse.content = formattedResponse.content.map(item => {
        if (!item.type) {
          console.log(`Adding missing type field to content item`);
          item.type = "text";
        }
        if (!item.text && item.text !== "") {
          console.log(`Adding missing text field to content item`);
          item.text = JSON.stringify(item, null, 2);
        }
        return item;
      });

      // Final verification
      console.log(`Final content array length: ${formattedResponse.content.length}`);
      console.log(`First item type: ${formattedResponse.content[0]?.type}`);
      console.log(`First item text length: ${formattedResponse.content[0]?.text?.length || 0}`);
      console.log(`isError: ${formattedResponse.isError}`);
      console.log(`===========================================\n`);
    }

    // For ALL methods, ensure we have the EXACT format Cursor IDE expects
    // This is the critical part - the response must be formatted exactly as expected

    // Create a completely new response object with the exact structure
    // This approach avoids any issues with object references or nested properties
    const standardizedResponse = {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: ""
          }
        ]
      }
    };

    // Now fill in the text content based on the response type
    if (['get_repository', 'search_repositories', 'get_readme'].includes(method)) {
      // For tool methods, extract the text content from the response
      if (typeof formattedResponse === 'string') {
        standardizedResponse.result.content[0].text = formattedResponse;
      } else if (formattedResponse.content && Array.isArray(formattedResponse.content) &&
                formattedResponse.content[0] && formattedResponse.content[0].text) {
        // If the response already has the correct structure, use its text content
        standardizedResponse.result.content[0].text = formattedResponse.content[0].text;
      } else {
        // Otherwise, stringify the entire response
        standardizedResponse.result.content[0].text = JSON.stringify(formattedResponse, null, 2);
      }

      // Set isError if present in the original response
      if (formattedResponse.isError === true) {
        standardizedResponse.result.isError = true;
      }

      console.log(`CURSOR IDE RESPONSE FORMAT: ${JSON.stringify({
        hasContent: !!standardizedResponse.result.content,
        contentIsArray: Array.isArray(standardizedResponse.result.content),
        contentLength: standardizedResponse.result.content.length,
        firstItemHasType: !!standardizedResponse.result.content[0].type,
        firstItemHasText: !!standardizedResponse.result.content[0].text,
        textLength: standardizedResponse.result.content[0].text.length
      })}`);

      return res.json(standardizedResponse);
    } else {
      // For non-tool methods (like schema requests), use the standard format but preserve the original structure
      standardizedResponse.result = formattedResponse;
      return res.json(standardizedResponse);
    }

    // This code is unreachable due to the return statements above
    // Keeping it commented out for reference
    /*
    const jsonResponse = {
      jsonrpc: "2.0",
      id,
      result: formattedResponse
    };

    console.log('\n========== OUTGOING MCP RESPONSE ==========');
    console.log(`Method: ${method}`);
    console.log('Status: Success');
    console.log('Response type:', typeof formattedResponse === 'object' ? 'Object' : typeof formattedResponse);

    if (formattedResponse.content && Array.isArray(formattedResponse.content)) {
      console.log('Content type:', formattedResponse.content[0]?.type || 'unknown');
      console.log('Content preview:', (formattedResponse.content[0]?.text || '').substring(0, 100) + '...');
    } else if (formattedResponse.functions) {
      console.log('Tools count:', formattedResponse.functions.length);
      console.log('Tool names:', formattedResponse.functions.map(f => f.name).join(', '));
    }

    console.log('===========================================\n');

    logToFile(`Sending MCP response: ${JSON.stringify(jsonResponse)}`);
    return res.json(jsonResponse);
    */

  } catch (error) {
    debug('MCP action error:', error);
    logToFile(`MCP action error: ${JSON.stringify(error)}`);

    // Create a standardized error response that follows the same structure
    // as successful responses but with error information
    const standardizedErrorResponse = {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Error: ${error.message || "Internal error"}`
          }
        ],
        isError: true
      }
    };

    // Log the error response structure
    console.log(`ERROR RESPONSE FORMAT: ${JSON.stringify({
      hasContent: !!standardizedErrorResponse.result.content,
      contentIsArray: Array.isArray(standardizedErrorResponse.result.content),
      contentLength: standardizedErrorResponse.result.content.length,
      firstItemHasType: !!standardizedErrorResponse.result.content[0].type,
      firstItemHasText: !!standardizedErrorResponse.result.content[0].text,
      isError: standardizedErrorResponse.result.isError
    })}`);

    // For backward compatibility, also include the standard JSON-RPC error field
    standardizedErrorResponse.error = {
      code: error.code || -32603,
      message: error.message || "Internal error"
    };

    // Log the error response with clear formatting
    console.log('\n========== MCP ERROR RESPONSE ==========');
    console.log(`Method: ${method || 'unknown'}`);
    console.log('Error code:', error.code || -32603);
    console.log('Error message:', error.message || "Internal error");
    console.log('=========================================\n');

    logToFile(`Sending MCP error response: ${JSON.stringify(standardizedErrorResponse)}`);
    return res.json(standardizedErrorResponse);
  }
});

module.exports = router;

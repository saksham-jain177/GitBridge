const express = require('express');
const router = express.Router();
const githubService = require('../services/github');

// MCP server metadata endpoint
router.get('/', (req, res) => {
  res.json({
    name: "GitHub MCP Server",
    description: "Provides GitHub repository and issue management capabilities",
    version: "1.0.0",
    actions: [
      {
        id: "search_repositories",
        description: "Search for GitHub repositories",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for GitHub repositories"
            },
            sort: {
              type: "string",
              enum: ["stars", "forks", "updated"],
              description: "Sort criteria",
              default: "stars"
            },
            order: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Sort order",
              default: "desc"
            },
            per_page: {
              type: "integer",
              description: "Number of results per page",
              default: 10,
              minimum: 1,
              maximum: 100
            }
          },
          required: ["query"]
        }
      },
      {
        id: "get_repository",
        description: "Get information about a specific GitHub repository",
        parameters: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "Repository owner"
            },
            repo: {
              type: "string",
              description: "Repository name"
            }
          },
          required: ["owner", "repo"]
        }
      },
      {
        id: "list_issues",
        description: "List issues for a repository",
        parameters: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "Repository owner"
            },
            repo: {
              type: "string",
              description: "Repository name"
            },
            state: {
              type: "string",
              enum: ["open", "closed", "all"],
              description: "Issue state",
              default: "open"
            },
            per_page: {
              type: "integer",
              description: "Number of results per page",
              default: 10,
              minimum: 1,
              maximum: 100
            }
          },
          required: ["owner", "repo"]
        }
      },
      {
        id: "create_issue",
        description: "Create a new issue in a repository",
        parameters: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "Repository owner"
            },
            repo: {
              type: "string",
              description: "Repository name"
            },
            title: {
              type: "string",
              description: "Issue title"
            },
            body: {
              type: "string",
              description: "Issue body content"
            },
            labels: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Labels to add to the issue"
            }
          },
          required: ["owner", "repo", "title"]
        }
      },
      {
        id: "list_pull_requests",
        description: "List pull requests for a repository",
        parameters: {
          type: "object",
          properties: {
            owner: {
              type: "string",
              description: "Repository owner"
            },
            repo: {
              type: "string",
              description: "Repository name"
            },
            state: {
              type: "string",
              enum: ["open", "closed", "all"],
              description: "Pull request state",
              default: "open"
            },
            per_page: {
              type: "integer",
              description: "Number of results per page",
              default: 10,
              minimum: 1,
              maximum: 100
            }
          },
          required: ["owner", "repo"]
        }
      }
    ]
  });
});

// MCP action endpoint
router.post('/', async (req, res) => {
  try {
    const { action_id, parameters } = req.body;
    
    if (!action_id) {
      return res.status(400).json({ error: "Missing action_id" });
    }
    
    let result;
    
    switch (action_id) {
      case 'search_repositories':
        result = await githubService.searchRepositories(parameters);
        break;
      
      case 'get_repository':
        result = await githubService.getRepository(parameters.owner, parameters.repo);
        break;
      
      case 'list_issues':
        result = await githubService.listIssues(parameters.owner, parameters.repo, parameters.state, parameters.per_page);
        break;
        
      case 'create_issue':
        result = await githubService.createIssue(
          parameters.owner,
          parameters.repo,
          parameters.title,
          parameters.body,
          parameters.labels
        );
        break;
        
      case 'list_pull_requests':
        result = await githubService.listPullRequests(
          parameters.owner,
          parameters.repo,
          parameters.state,
          parameters.per_page
        );
        break;
        
      default:
        return res.status(400).json({ error: `Unknown action: ${action_id}` });
    }
    
    res.json(result);
  } catch (error) {
    console.error('MCP action error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data || null
    });
  }
});

module.exports = router;

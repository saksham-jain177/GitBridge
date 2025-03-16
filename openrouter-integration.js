require('dotenv').config();
const axios = require('axios');

// OpenRouter API setup
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// MCP server URL - use Render URL in production
const MCP_SERVER_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

// Function to call OpenRouter API
async function callOpenRouter(prompt, actionOutput = null) {
  const systemMessage = `You are a helpful AI assistant with access to GitHub through a Model Context Protocol server. 
  When analyzing GitHub repositories, focus on: stars count, forks, open issues, main language, and recent activity.`;
  
  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt }
  ];
  
  if (actionOutput) {
    messages.push({
      role: 'assistant',
      content: `I've retrieved the repository information.`
    });
    messages.push({
      role: 'tool',
      content: JSON.stringify(actionOutput, null, 2)
    });
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'google/gemma-3-12b-it:free',
        messages: messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'
        }
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('OpenRouter returned invalid response format');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter:', error.response?.data || error.message);
    throw new Error(`OpenRouter API error: ${error.response?.data?.error || error.message}`);
  }
}

// Function to call MCP server
async function callMCPAction(actionId, parameters) {
  try {
    const response = await axios.post(`${MCP_SERVER_URL}/mcp`, {
      action_id: actionId,
      parameters: parameters
    });
    
    if (!response.data) {
      throw new Error(`MCP action ${actionId} returned no data`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error calling MCP action ${actionId}:`, error.message);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(`MCP action failed: ${error.message}`);
  }
}

// Main function to analyze a GitHub repository
async function analyzeGitHubRepository(owner, repo, prompt = '') {
  try {
    // Get repository details
    console.log(`\nFetching details for ${owner}/${repo}...`);
    const repoDetails = await callMCPAction('get_repository', { owner, repo });
    
    if (!repoDetails) {
      throw new Error('Failed to fetch repository details');
    }

    // Customize analysis prompt based on user input or use default
    const analysisPrompt = prompt || `Analyze this GitHub repository and provide insights about:
1. Repository popularity (stars, forks)
2. Development activity (open issues, last update)
3. Technical stack (main language, topics)
4. Key metrics and statistics`;
    
    const analysis = await callOpenRouter(analysisPrompt, repoDetails);
    
    if (!analysis) {
      throw new Error('OpenRouter analysis failed to return results');
    }

    // Get and analyze issues only if no specific prompt is provided
    if (!prompt) {
      try {
        const issues = await callMCPAction('list_issues', {
          owner,
          repo,
          state: 'open',
          per_page: 5
        });

        const issuesSummary = await callOpenRouter(
          'Summarize the key themes and patterns in these recent open issues, focusing on common problems and feature requests.',
          issues
        );

        return {
          repositoryAnalysis: analysis,
          issuesAnalysis: issuesSummary
        };
      } catch (issueError) {
        console.warn('Issues analysis failed:', issueError);
        // Continue with main analysis even if issues analysis fails
        return {
          repositoryAnalysis: analysis
        };
      }
    }

    return {
      repositoryAnalysis: analysis
    };
  } catch (error) {
    console.error('Analysis failed:', error);
    throw new Error(error.message || 'Repository analysis failed');
  }
}

// Example usage
async function runDemo() {
  try {
    // Test Case 1: Large open source project
    console.log('\n=== Analyzing React Repository ===');
    await analyzeGitHubRepository('facebook', 'react');

    // Test Case 2: Your personal project
    console.log('\n=== Analyzing Your Repository ===');
    await analyzeGitHubRepository('your-username', 'your-repo');

    // Test Case 3: Another popular project
    console.log('\n=== Analyzing VS Code Repository ===');
    await analyzeGitHubRepository('microsoft', 'vscode');

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Export functions for external use
module.exports = {
  analyzeGitHubRepository,
  callMCPAction,
  callOpenRouter
};

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

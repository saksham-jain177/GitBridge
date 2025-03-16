require('dotenv').config();
const axios = require('axios');

// OpenRouter API setup
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// MCP server URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';

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
          'HTTP-Referer': 'http://localhost:3000'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter:', error.response?.data || error.message);
    throw error;
  }
}

// Function to call MCP server
async function callMCPAction(actionId, parameters) {
  try {
    const response = await axios.post(
      MCP_SERVER_URL,
      {
        action_id: actionId,
        parameters: parameters
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error calling MCP server:', error.response?.data || error.message);
    throw error;
  }
}

// Main function to analyze a GitHub repository
async function analyzeGitHubRepository(owner, repo) {
  try {
    // 1. Get repository details
    console.log(`\nFetching details for ${owner}/${repo}...`);
    const repoDetails = await callMCPAction('get_repository', {
      owner: owner,
      repo: repo
    });
    
    // 2. Ask AI to analyze the repository
    const analysisPrompt = `Please analyze this GitHub repository and provide key insights about:
    1. Repository popularity (stars, forks)
    2. Development activity (open issues, last update)
    3. Technical stack (main language, topics)
    4. Key metrics and statistics
    Please format the response in a clear, structured way.`;
    
    const analysis = await callOpenRouter(analysisPrompt, repoDetails);
    console.log('\nAI Analysis of Repository:');
    console.log(analysis);

    // 3. Get open issues
    console.log('\nFetching recent issues...');
    const issues = await callMCPAction('list_issues', {
      owner: owner,
      repo: repo,
      state: 'open',
      per_page: 5
    });

    // 4. Ask AI to summarize issues
    const issuesPrompt = `Please summarize the key themes and patterns in these recent open issues. 
    Focus on identifying common problems, feature requests, or bugs that users are reporting.`;
    
    const issuesSummary = await callOpenRouter(issuesPrompt, issues);
    console.log('\nAI Summary of Recent Issues:');
    console.log(issuesSummary);

    return {
      repositoryAnalysis: analysis,
      issuesAnalysis: issuesSummary
    };
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
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
    await analyzeGitHubRepository('saksham-jain177', 'automated-transcription-system');

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

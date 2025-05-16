const axios = require('axios');
const debug = require('debug')('mcp:github');

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Check if token is available
if (!GITHUB_TOKEN) {
  console.error('⚠️ ERROR: GITHUB_TOKEN environment variable is not set');
  console.error('⚠️ GitHub API requests will fail. Please add a valid GitHub token to your .env file.');
  console.error('⚠️ You can create a new token at: https://github.com/settings/tokens');
} else {
  // Log token details for debugging (safely)
  const tokenPrefix = GITHUB_TOKEN.substring(0, 4);
  const tokenLength = GITHUB_TOKEN.length;
  console.log(`✅ GitHub token found: ${tokenPrefix}... (${tokenLength} characters)`);

  // Make a test request to verify token works
  setTimeout(async () => {
    try {
      console.log('🔍 Testing GitHub token with a simple API request...');
      const response = await axios.get('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitBridge-MCP-Server'
        }
      });

      if (response.status === 200) {
        console.log('✅ GitHub token is valid and working!');
        console.log(`✅ Rate limits: ${response.data.rate.remaining}/${response.data.rate.limit} requests remaining`);

        // Check if token has necessary scopes
        const scopes = response.headers['x-oauth-scopes'] || 'none';
        console.log(`✅ Token scopes: ${scopes}`);

        if (!scopes.includes('repo') && !scopes.includes('public_repo')) {
          console.warn('⚠️ WARNING: Your token may not have sufficient permissions.');
          console.warn('⚠️ For full repository access, the token needs the "repo" scope.');
          console.warn('⚠️ For public repository access only, it needs at least "public_repo" scope.');
        }
      }
    } catch (error) {
      console.error('❌ GitHub token validation failed:');
      if (error.response) {
        console.error(`❌ Status: ${error.response.status}`);
        console.error(`❌ Message: ${error.response.data.message || 'Unknown error'}`);

        if (error.response.status === 401) {
          console.error('❌ Token is invalid or revoked. Please generate a new token.');
        } else if (error.response.status === 403) {
          console.error('❌ Token does not have sufficient permissions or rate limit exceeded.');
        }
      } else if (error.request) {
        console.error('❌ Network error: No response received from GitHub API.');
        console.error('❌ Check your internet connection and firewall settings.');
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  }, 1000); // Delay by 1 second to not block server startup
}

// Create headers with or without token
const headers = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'GitBridge-MCP-Server'
};

// Add authorization header only if token is available
if (GITHUB_TOKEN) {
  headers['Authorization'] = `token ${GITHUB_TOKEN}`;
}

const githubClient = axios.create({
  baseURL: GITHUB_API_URL,
  headers: headers
});

/**
 * Format a date string to a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Filter repository data to include only essential fields
 * @param {Object} repoData - Full repository data from GitHub API
 * @returns {Object} Filtered repository data
 */
function filterRepositoryData(repoData) {
  if (!repoData) return null;

  return {
    name: repoData.name,
    full_name: repoData.full_name,
    description: repoData.description || 'No description provided',
    owner: {
      login: repoData.owner?.login,
      profile_url: repoData.owner?.html_url
    },
    stats: {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      open_issues: repoData.open_issues_count
    },
    language: repoData.language || 'Not specified',
    topics: repoData.topics || [],
    dates: {
      created_at: formatDate(repoData.created_at),
      updated_at: formatDate(repoData.updated_at),
      pushed_at: formatDate(repoData.pushed_at)
    },
    urls: {
      html_url: repoData.html_url,
      api_url: repoData.url
    }
  };
}

/**
 * Filter search results to include only essential fields
 * @param {Object} searchData - Full search results from GitHub API
 * @returns {Object} Filtered search results
 */
function filterSearchResults(searchData) {
  if (!searchData || !searchData.items) {
    return { total_count: 0, items: [] };
  }

  return {
    total_count: searchData.total_count,
    items: searchData.items.map(repo => filterRepositoryData(repo))
  };
}

async function searchRepositories({ query, sort = 'stars', order = 'desc' }) {
  try {
    console.log(`Searching repositories with query: ${query}...`);

    // Check if GitHub token is configured
    if (!GITHUB_TOKEN) {
      console.error('⚠️ GitHub token is missing. Please add a valid GITHUB_TOKEN to your .env file.');
      throw {
        code: -32001,
        message: `GitHub API authentication error: No GitHub token configured. Please add a valid GITHUB_TOKEN to your .env file.`
      };
    }

    const response = await githubClient.get('/search/repositories', {
      params: { q: query, sort, order }
    });

    console.log(`Successfully searched repositories. Found ${response.data.total_count} results.`);

    // Filter the response data to include only essential fields
    return filterSearchResults(response.data);
  } catch (error) {
    console.error(`Error searching repositories:`, error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data || {}, null, 2));
    }

    // For authentication errors
    if (error.response?.status === 401) {
      console.error('⚠️ GitHub token is invalid or expired. Please update your GITHUB_TOKEN in the .env file.');
      throw {
        code: -32001,
        message: `GitHub API authentication error: Invalid or expired token. Please update your GITHUB_TOKEN in the .env file.`
      };
    }

    // For network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw {
        code: -32001,
        message: `Network error: Cannot connect to GitHub API. Check your internet connection.`
      };
    }

    // For rate limiting
    if (error.response?.status === 403 && error.response?.data?.message?.includes('rate limit')) {
      throw {
        code: -32001,
        message: `GitHub API rate limit exceeded. Please try again later or configure a valid GitHub token.`
      };
    }

    debug('GitHub API error:', error.response?.data || error.message);
    throw {
      code: -32001,
      message: `GitHub API error: ${error.response?.data?.message || error.message}`
    };
  }
}

async function getRepository(owner, repo) {
  try {
    console.log(`\n========== GITHUB API REQUEST ==========`);
    console.log(`Repository: ${owner}/${repo}`);
    console.log(`Token: ${GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 4) + '...' : 'Missing'}`);
    console.log(`Token Length: ${GITHUB_TOKEN ? GITHUB_TOKEN.length : 0}`);
    console.log(`Request URL: https://api.github.com/repos/${owner}/${repo}`);
    console.log(`Request Headers: Authorization, Accept: application/vnd.github.v3+json, User-Agent: GitBridge-MCP-Server`);

    // Check if GitHub token is configured
    if (!GITHUB_TOKEN) {
      console.error('⚠️ GitHub token is missing. Please add a valid GITHUB_TOKEN to your .env file.');
      throw {
        code: -32001,
        message: `GitHub API authentication error: No GitHub token configured. Please add a valid GITHUB_TOKEN to your .env file.`
      };
    }

    // Special handling for known repositories to debug differences
    if ((owner === 'facebook' && repo === 'react') || (owner === 'meta' && repo === 'react')) {
      console.log(`⚠️ Special handling for ${owner}/${repo} - This repository is known to cause issues`);

      // Try a direct fetch to bypass any potential axios issues
      try {
        console.log(`Attempting direct fetch API call...`);
        const directResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitBridge-MCP-Server'
          }
        });

        console.log(`Direct fetch status: ${directResponse.status}`);

        if (directResponse.ok) {
          const data = await directResponse.json();
          console.log(`Successfully fetched data via direct fetch`);
          const filteredData = filterRepositoryData(data);
          console.log(`Filtered data successfully`);
          console.log(`===========================================\n`);
          return filteredData;
        } else {
          const errorData = await directResponse.json();
          console.error(`Direct fetch error: ${JSON.stringify(errorData)}`);
          throw {
            code: -32001,
            message: `GitHub API error: ${errorData.message || 'Unknown error'}`
          };
        }
      } catch (directError) {
        console.error(`Direct fetch failed: ${directError.message}`);
        // Continue with normal axios request as fallback
      }
    }

    console.log(`Making axios request to GitHub API...`);
    const response = await githubClient.get(`/repos/${owner}/${repo}`);
    console.log(`Successfully fetched data for ${owner}/${repo}`);
    console.log(`Response status: ${response.status}`);
    console.log(`Response data type: ${typeof response.data}`);
    console.log(`Response data keys: ${Object.keys(response.data).join(', ')}`);

    // Filter the response data to include only essential fields
    console.log(`Filtering repository data...`);
    const filteredData = filterRepositoryData(response.data);
    console.log(`Filtered data keys: ${Object.keys(filteredData).join(', ')}`);
    console.log(`===========================================\n`);
    return filteredData;
  } catch (error) {
    console.error(`\n========== GITHUB API ERROR ==========`);
    console.error(`Repository: ${owner}/${repo}`);
    console.error(`Error message: ${error.message}`);

    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data: ${JSON.stringify(error.response.data || {}, null, 2)}`);
      console.error(`Response headers: ${JSON.stringify(error.response.headers || {}, null, 2)}`);
    }

    // For authentication errors
    if (error.response?.status === 401) {
      console.error('⚠️ GitHub token is invalid or expired. Please update your GITHUB_TOKEN in the .env file.');
      throw {
        code: -32001,
        message: `GitHub API authentication error: Invalid or expired token. Please update your GITHUB_TOKEN in the .env file.`
      };
    }

    // For network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`Network error: ${error.code}`);
      throw {
        code: -32001,
        message: `Network error: Cannot connect to GitHub API. Check your internet connection.`
      };
    }

    // For rate limiting
    if (error.response?.status === 403 && error.response?.data?.message?.includes('rate limit')) {
      console.error(`Rate limit exceeded`);
      throw {
        code: -32001,
        message: `GitHub API rate limit exceeded. Please try again later or configure a valid GitHub token.`
      };
    }

    // For not found
    if (error.response?.status === 404) {
      console.error(`Repository not found`);
      throw {
        code: -32001,
        message: `Repository ${owner}/${repo} not found on GitHub.`
      };
    }

    // Generic error
    console.error(`===========================================\n`);
    throw {
      code: -32001,
      message: `GitHub API error: ${error.response?.data?.message || error.message}`
    };
  }
}

/**
 * Fetch README.md content from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Object} README content and metadata
 */
async function getReadme(owner, repo) {
  try {
    console.log(`Fetching README for ${owner}/${repo}...`);

    // Check if GitHub token is configured
    if (!GITHUB_TOKEN) {
      console.error('⚠️ GitHub token is missing. Please add a valid GITHUB_TOKEN to your .env file.');
      throw {
        code: -32001,
        message: `GitHub API authentication error: No GitHub token configured. Please add a valid GITHUB_TOKEN to your .env file.`
      };
    }

    // First try to get the README directly
    const response = await githubClient.get(`/repos/${owner}/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw' // Request raw content
      }
    });

    console.log(`Successfully fetched README for ${owner}/${repo}`);

    // If successful, return the content
    return {
      content: response.data,
      name: 'README.md',
      path: 'README.md',
      encoding: 'utf-8',
      size: response.data.length,
      type: 'file',
      html_url: `https://github.com/${owner}/${repo}/blob/master/README.md`,
      download_url: `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`
    };
  } catch (error) {
    console.error(`Error fetching README for ${owner}/${repo}:`, error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data || {}, null, 2));
    }

    // For authentication errors
    if (error.response?.status === 401) {
      console.error('⚠️ GitHub token is invalid or expired. Please update your GITHUB_TOKEN in the .env file.');
      throw {
        code: -32001,
        message: `GitHub API authentication error: Invalid or expired token. Please update your GITHUB_TOKEN in the .env file.`
      };
    }

    // If the README wasn't found, try to search for it with different casing
    if (error.response?.status === 404) {
      try {
        console.log(`README not found at default location, searching for alternatives...`);
        // Get the repository contents
        const contentsResponse = await githubClient.get(`/repos/${owner}/${repo}/contents`);

        // Look for any file that might be a README
        const readmeFile = contentsResponse.data.find(file =>
          file.type === 'file' &&
          file.name.toLowerCase().startsWith('readme')
        );

        if (readmeFile) {
          console.log(`Found alternative README: ${readmeFile.name}`);
          // Get the content of the found README file
          const fileResponse = await githubClient.get(readmeFile.url, {
            headers: {
              'Accept': 'application/vnd.github.v3.raw' // Request raw content
            }
          });

          return {
            content: fileResponse.data,
            name: readmeFile.name,
            path: readmeFile.path,
            encoding: 'utf-8',
            size: fileResponse.data.length,
            type: 'file',
            html_url: readmeFile.html_url,
            download_url: readmeFile.download_url
          };
        } else {
          console.log(`No README files found in repository`);
        }
      } catch (searchError) {
        console.error('Error searching for README:', searchError.message);
        debug('Error searching for README:', searchError.response?.data || searchError.message);
      }
    }

    // For network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw {
        code: -32001,
        message: `Network error: Cannot connect to GitHub API. Check your internet connection.`
      };
    }

    // For rate limiting
    if (error.response?.status === 403 && error.response?.data?.message?.includes('rate limit')) {
      throw {
        code: -32001,
        message: `GitHub API rate limit exceeded. Please try again later or configure a valid GitHub token.`
      };
    }

    // If we get here, we couldn't find a README
    debug('GitHub API error fetching README:', error.response?.data || error.message);
    throw {
      code: -32001,
      message: `Could not find README for ${owner}/${repo}: ${error.response?.data?.message || error.message}`
    };
  }
}

module.exports = {
  searchRepositories,
  getRepository,
  getReadme,
  filterRepositoryData, // Export for testing
  filterSearchResults   // Export for testing
};

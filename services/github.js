const axios = require('axios');

// Create axios instance for GitHub API
const github = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-MCP-Server'
  }
});

/**
 * Search for GitHub repositories
 */
async function searchRepositories(params) {
  const { query, sort = 'stars', order = 'desc', per_page = 10 } = params;
  
  const response = await github.get('/search/repositories', {
    params: {
      q: query,
      sort,
      order,
      per_page
    }
  });
  
  // Format response for the MCP
  return {
    total_count: response.data.total_count,
    repositories: response.data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        url: repo.owner.html_url
      },
      created_at: repo.created_at,
      updated_at: repo.updated_at
    }))
  };
}

/**
 * Get information about a specific repository
 */
async function getRepository(owner, repo) {
  const response = await github.get(`/repos/${owner}/${repo}`);
  
  // Format response for the MCP
  return {
    id: response.data.id,
    name: response.data.name,
    full_name: response.data.full_name,
    description: response.data.description,
    url: response.data.html_url,
    stars: response.data.stargazers_count,
    forks: response.data.forks_count,
    watchers: response.data.watchers_count,
    open_issues: response.data.open_issues_count,
    language: response.data.language,
    license: response.data.license?.name,
    default_branch: response.data.default_branch,
    topics: response.data.topics,
    owner: {
      login: response.data.owner.login,
      avatar_url: response.data.owner.avatar_url,
      url: response.data.owner.html_url
    },
    created_at: response.data.created_at,
    updated_at: response.data.updated_at,
    pushed_at: response.data.pushed_at
  };
}

/**
 * List issues for a repository
 */
async function listIssues(owner, repo, state = 'open', per_page = 10) {
  const response = await github.get(`/repos/${owner}/${repo}/issues`, {
    params: { state, per_page }
  });
  
  // Filter out pull requests which are included in the issues endpoint
  const issues = response.data.filter(issue => !issue.pull_request);
  
  // Format response for the MCP
  return {
    count: issues.length,
    issues: issues.map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      user: {
        login: issue.user.login,
        avatar_url: issue.user.avatar_url,
        url: issue.user.html_url
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      comments: issue.comments,
      body: issue.body,
      labels: issue.labels.map(label => ({
        name: label.name,
        color: label.color
      }))
    }))
  };
}

/**
 * Create a new issue in a repository
 */
async function createIssue(owner, repo, title, body = '', labels = []) {
  const response = await github.post(`/repos/${owner}/${repo}/issues`, {
    title,
    body,
    labels
  });
  
  // Format response for the MCP
  return {
    number: response.data.number,
    title: response.data.title,
    state: response.data.state,
    url: response.data.html_url,
    created_at: response.data.created_at
  };
}

/**
 * List pull requests for a repository
 */
async function listPullRequests(owner, repo, state = 'open', per_page = 10) {
  const response = await github.get(`/repos/${owner}/${repo}/pulls`, {
    params: { state, per_page }
  });
  
  // Format response for the MCP
  return {
    count: response.data.length,
    pull_requests: response.data.map(pr => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      url: pr.html_url,
      user: {
        login: pr.user.login,
        avatar_url: pr.user.avatar_url,
        url: pr.user.html_url
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
      draft: pr.draft,
      mergeable: pr.mergeable,
      mergeable_state: pr.mergeable_state,
      comments: pr.comments,
      review_comments: pr.review_comments,
      commits: pr.commits,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files
    }))
  };
}

module.exports = {
  searchRepositories,
  getRepository,
  listIssues,
  createIssue,
  listPullRequests
};

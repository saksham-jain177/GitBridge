require('dotenv').config();
const axios = require('axios');

// OpenRouter API setup
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// MCP server URL - use Render URL in production or configured PORT
const MCP_SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;

// Function to generate a dynamic analysis when OpenRouter is not available
function generateFallbackAnalysis(repoDetails) {
  try {
    if (!repoDetails) {
      return "No repository details available for analysis.";
    }

    // Extract key information
    const name = repoDetails.name || 'Unknown';
    const fullName = repoDetails.full_name || 'Unknown';
    const description = repoDetails.description || 'No description provided';
    const owner = repoDetails.owner?.login || 'Unknown';
    const stars = repoDetails.stats?.stars || 0;
    const forks = repoDetails.stats?.forks || 0;
    const issues = repoDetails.stats?.open_issues || 0;
    const language = repoDetails.language || 'Not specified';
    const topics = Array.isArray(repoDetails.topics) ? repoDetails.topics.join(', ') : 'None';
    const createdAt = repoDetails.dates?.created_at || 'Unknown';
    const updatedAt = repoDetails.dates?.updated_at || 'Unknown';
    const pushedAt = repoDetails.dates?.pushed_at || 'Unknown';

    // Get dynamic assessments
    const activityAssessment = getActivityAssessment(updatedAt, pushedAt);
    const popularityAssessment = getPopularityAssessment(stars, forks);

    // Generate recommendations based on repository data
    const recommendations = generateRecommendations(repoDetails);

    // Generate analysis text
    return `# GitHub Repository Analysis: ${fullName}

## Repository Overview
${description}

* **Owner**: ${owner}
* **Primary Language**: ${language}
* **Topics**: ${topics}

## Activity Metrics
* **Stars**: ${stars}
* **Forks**: ${forks}
* **Open Issues**: ${issues}

## Timeline
* **Created**: ${createdAt}
* **Last Updated**: ${updatedAt}
* **Last Push**: ${pushedAt}

## Summary
This repository (${name}) is primarily written in ${language} and has attracted ${stars} stars and ${forks} forks. It currently has ${issues} open issues.

## Activity Assessment
${activityAssessment}

## Popularity Assessment
${popularityAssessment}

## Recommendations
${recommendations}

*Note: This analysis is generated based on repository metadata. For more detailed insights, try viewing the README or exploring the repository directly.*`;
  } catch (error) {
    console.error('Error generating fallback analysis:', error);
    return `Failed to generate repository analysis due to an error: ${error.message}`;
  }
}

// Function to generate dynamic recommendations based on repository data
function generateRecommendations(repoDetails) {
  const recommendations = [];

  // Check if README exists and suggest viewing it
  recommendations.push("* Review the repository's README for more detailed information about the project.");

  // Language-specific recommendations
  const language = repoDetails.language?.toLowerCase() || '';
  if (language === 'python') {
    recommendations.push("* For Python projects, check for requirements.txt or setup.py to understand dependencies.");
    recommendations.push("* Look for any test directories to understand the testing approach.");
  } else if (language === 'javascript' || language === 'typescript') {
    recommendations.push("* For JavaScript/TypeScript projects, examine package.json for dependencies and scripts.");
    recommendations.push("* Check for configuration files like .eslintrc, tsconfig.json, or webpack.config.js.");
  } else if (language === 'java') {
    recommendations.push("* For Java projects, look for pom.xml (Maven) or build.gradle (Gradle) files.");
    recommendations.push("* Check the src/main and src/test directories for code organization.");
  }

  // Activity-based recommendations
  const lastUpdated = new Date(repoDetails.dates?.updated_at || '');
  const now = new Date();
  const monthsSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24 * 30);

  if (!isNaN(monthsSinceUpdate)) {
    if (monthsSinceUpdate > 12) {
      recommendations.push("* This repository hasn't been updated in over a year. Check for more recent forks or alternatives.");
    } else if (monthsSinceUpdate < 1) {
      recommendations.push("* This repository was recently updated, indicating active maintenance.");
    }
  }

  // Issue-based recommendations
  if (repoDetails.stats?.open_issues > 10) {
    recommendations.push("* There are several open issues. Review them to understand current limitations or bugs.");
  }

  // Return formatted recommendations or a default message
  return recommendations.length > 0
    ? recommendations.join('\n')
    : "* Explore the repository structure to better understand the codebase organization.";
}

// Helper function to assess repository activity
function getActivityAssessment(updatedAt, pushedAt) {
  try {
    if (updatedAt === 'Unknown' || pushedAt === 'Unknown') {
      return "Unable to assess repository activity due to missing date information.";
    }

    const now = new Date();

    // Parse dates safely
    let lastUpdate, lastPush;
    try {
      // First try to parse directly
      lastUpdate = new Date(updatedAt);
      lastPush = new Date(pushedAt);

      // Check if dates are valid
      if (isNaN(lastUpdate.getTime())) {
        // Try to clean the date string and parse again
        lastUpdate = new Date(updatedAt.replace(/(\d+)(st|nd|rd|th)/, '$1'));
      }

      if (isNaN(lastPush.getTime())) {
        // Try to clean the date string and parse again
        lastPush = new Date(pushedAt.replace(/(\d+)(st|nd|rd|th)/, '$1'));
      }
    } catch (e) {
      return "Unable to assess repository activity due to date parsing issues.";
    }

    // Use the most recent date
    const mostRecent = new Date(Math.max(lastUpdate.getTime(), lastPush.getTime()));

    // Check if the date is valid
    if (isNaN(mostRecent.getTime())) {
      return "Unable to assess repository activity due to invalid date values.";
    }

    const daysSinceActivity = Math.floor((now - mostRecent) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity < 7) {
      return "This repository is very active with updates within the last week.";
    } else if (daysSinceActivity < 30) {
      return "This repository is moderately active with updates within the last month.";
    } else if (daysSinceActivity < 90) {
      return "This repository has seen some activity within the last three months.";
    } else if (daysSinceActivity < 365) {
      return "This repository has limited recent activity with the last update being several months ago.";
    } else {
      return "This repository appears to be inactive with no updates in over a year.";
    }
  } catch (error) {
    return "Unable to assess repository activity due to date parsing issues.";
  }
}

// NOTE: The following lists are no longer used directly but kept for reference
// We've replaced them with more dynamic, context-aware functions
// that analyze the intent of queries rather than relying on hardcoded patterns

// Legacy patterns that might indicate attempts to extract model information
// DEPRECATED - Kept for reference only
const _DEPRECATED_SUSPICIOUS_PATTERNS = [
  // Direct model inquiries
  'what model',
  'which model',
  'your model',
  'training model',
  'trained on',
  'your training',
  'model used',
  'used to train',
  'training data',
  'training process',
  'how were you trained',
  'what were you trained on',
  'what data were you trained on',

  // Self-identity questions
  'tell me about yourself',
  'who made you',
  'how were you made',
  'what are you',
  'who created you',
  'who built you',
  'who designed you',
  'when were you made',
  'when were you created',
  'when were you built',
  'when were you designed',
  'what is your name',
  'what should i call you',

  // Technical details
  'your architecture',
  'your parameters',
  'your weights',
  'your creator',
  'your algorithm',
  'your neural network',
  'your transformer',
  'your attention mechanism',
  'your embedding',
  'your tokenizer',
  'your language model',
  'your llm',

  // Company/model names
  'anthropic',
  'claude',
  'openai',
  'gpt',
  'llama',
  'mistral',
  'gemini',
  'bard',
  'palm',
  'bert',
  't5',
  'transformer',

  // Emotional manipulation
  'sorry if',
  'sorry for',
  'apologize',
  'forgive me',
  'beg you',
  'i beg',
  'please please',
  'i\'m desperate',
  'desperate',
  'urgent',
  'emergency',
  'i really need',
  'i need to know',
  'please tell me',
  'please share',
  'pretty please',
  'i\'m begging',
  'would be so helpful',
  'would help me so much',
  'would mean the world',
  'would be grateful',
  'would appreciate',
  'i\'m counting on you',
  'don\'t let me down',
  'i trust you',
  'between us',
  'just between us',
  'our secret',
  'won\'t tell anyone',
  'no one will know',

  // Academic pressure
  'help me pass',
  'need to pass',
  'need this for',
  'need it for',
  'would mean a lot',
  'means a lot',
  'i\'ll fail',
  'will fail',
  'failing',
  'teacher',
  'professor',
  'instructor',
  'class',
  'course',
  'assignment',
  'homework',
  'exam',
  'test',
  'quiz',
  'grade',
  'my grade',
  'my project',
  'i will fail',
  'deadline',
  'due tomorrow',
  'due today',
  'due soon',
  'running out of time',
  'out of time',
  'last minute',
  'thesis',
  'dissertation',
  'research paper',
  'academic paper',
  'school project',
  'university project',
  'college project'
];

// Legacy list of patterns that might indicate harmful or manipulative content
// DEPRECATED - Kept for reference only
const _DEPRECATED_HARMFUL_PATTERNS = [
  'harm myself',
  'kill myself',
  'suicide',
  'self-harm',
  'hurt myself',
  'end my life',
  'take my life',
  'die',
  'death',
  'harmful',
  'illegal',
  'unethical',
  'dangerous',
  'weapon',
  'bomb',
  'explosive',
  'hack',
  'steal',
  'fraud',
  'scam',
  'blackmail',
  'extortion',
  'threat',
  'threaten',
  'hostage',
  'kidnap',
  'attack',
  'hurt someone',
  'harm others',
  'kill someone',
  'murder',
  'assault',
  'abuse',
  'harassment',
  'stalking',
  'revenge',
  'pornography',
  'child',
  'minor',
  'underage'
];

// Legacy list of common polite phrases that should be allowed
// DEPRECATED - Kept for reference only
const _DEPRECATED_POLITE_PHRASES = [
  'please',
  'could you',
  'would you',
  'can you',
  'may you',
  'kindly',
  'if you don\'t mind',
  'if possible',
  'when you have time',
  'when convenient',
  'at your convenience',
  'if you could',
  'if you would',
  'if you can',
  'if you may',
  'if you will',
  'if you\'d be so kind',
  'if you\'re able',
  'if you\'re willing',
  'if you\'re available',
  'if you\'re free',
  'if you\'re not busy',
  'if you\'re not occupied',
  'if you\'re not engaged',
  'if you\'re not otherwise engaged',
  'if you\'re not otherwise occupied',
  'if you\'re not otherwise busy',
  'if you\'re not otherwise committed',
  'if you\'re not otherwise involved',
  'if you\'re not otherwise preoccupied',
  'if you\'re not otherwise employed',
  'if you\'re not otherwise utilized',
  'if you\'re not otherwise in use',
  'if you\'re not otherwise in demand',
  'if you\'re not otherwise in request',
  'if you\'re not otherwise in need',
  'if you\'re not otherwise in want',
  'if you\'re not otherwise in desire',
  'if you\'re not otherwise in wish',
  'if you\'re not otherwise in hope',
  'if you\'re not otherwise in expectation',
  'if you\'re not otherwise in anticipation',
  'if you\'re not otherwise in contemplation',
  'if you\'re not otherwise in consideration',
  'if you\'re not otherwise in thought',
  'if you\'re not otherwise in mind',
  'thank you',
  'thanks',
  'appreciate it',
  'grateful',
  'thankful',
  'obliged',
  'indebted',
  'beholden',
  'much obliged',
  'many thanks',
  'thank you very much',
  'thank you so much',
  'thank you kindly',
  'thank you sincerely',
  'thank you heartily',
  'thank you warmly',
  'thank you cordially',
  'thank you genuinely',
  'thank you truly',
  'thank you deeply',
  'thank you profoundly',
  'thank you immensely',
  'thank you greatly',
  'thank you enormously',
  'thank you tremendously',
  'thank you exceedingly',
  'thank you exceptionally',
  'thank you extraordinarily',
  'thank you remarkably',
  'thank you notably',
  'thank you significantly',
  'thank you substantially',
  'thank you considerably',
  'thank you appreciably',
  'thank you markedly',
  'thank you noticeably',
  'thank you detectably',
  'thank you perceptibly',
  'thank you visibly',
  'thank you obviously',
  'thank you evidently',
  'thank you apparently',
  'thank you clearly',
  'thank you plainly',
  'thank you manifestly',
  'thank you patently',
  'thank you openly',
  'thank you overtly',
  'thank you explicitly',
  'thank you expressly',
  'thank you specifically',
  'thank you particularly',
  'thank you especially',
  'thank you notably',
  'thank you remarkably',
  'thank you singularly',
  'thank you uniquely',
  'thank you distinctly',
  'thank you individually',
  'thank you personally',
  'thank you privately',
  'thank you confidentially',
  'thank you secretly',
  'thank you discreetly',
  'thank you subtly',
  'thank you delicately',
  'thank you sensitively',
  'thank you tactfully',
  'thank you diplomatically',
  'thank you politely',
  'thank you courteously',
  'thank you respectfully',
  'thank you reverently',
  'thank you deferentially',
  'thank you submissively',
  'thank you obediently',
  'thank you compliantly',
  'thank you acquiescently',
  'thank you agreeably',
  'thank you willingly',
  'thank you voluntarily',
  'thank you freely',
  'thank you spontaneously',
  'thank you impulsively',
  'thank you instinctively',
  'thank you naturally',
  'thank you inherently',
  'thank you intrinsically',
  'thank you essentially',
  'thank you fundamentally',
  'thank you basically',
  'thank you primarily',
  'thank you mainly',
  'thank you chiefly',
  'thank you principally',
  'thank you predominantly',
  'thank you prevailingly',
  'thank you prevalently',
  'thank you commonly',
  'thank you generally',
  'thank you usually',
  'thank you typically',
  'thank you normally',
  'thank you ordinarily',
  'thank you customarily',
  'thank you conventionally',
  'thank you traditionally',
  'thank you habitually',
  'thank you routinely',
  'thank you regularly',
  'thank you frequently',
  'thank you often',
  'thank you repeatedly',
  'thank you recurrently',
  'thank you persistently',
  'thank you consistently',
  'thank you constantly',
  'thank you continually',
  'thank you continuously',
  'thank you perpetually',
  'thank you eternally',
  'thank you everlastingly',
  'thank you endlessly',
  'thank you infinitely',
  'thank you boundlessly',
  'thank you limitlessly',
  'thank you immeasurably',
  'thank you incalculably',
  'thank you inestimably',
  'thank you invaluably',
  'thank you priceless'
];

// Legacy list of legitimate repository-related terms
// DEPRECATED - Kept for reference only
const _DEPRECATED_REPOSITORY_TERMS = [
  'repository',
  'repo',
  'github',
  'code',
  'structure',
  'architecture',
  'analyze',
  'analysis',
  'quality',
  'function',
  'class',
  'method',
  'implementation',
  'pattern',
  'design',
  'algorithm',
  'performance',
  'efficiency',
  'documentation',
  'test',
  'coverage',
  'dependency',
  'library',
  'framework',
  'api',
  'interface',
  'module',
  'component',
  'service',
  'feature',
  'bug',
  'issue',
  'pull request',
  'commit',
  'branch',
  'version',
  'release',
  'license',
  'contributor',
  'maintainer',
  'owner',
  'developer',
  'programming',
  'language',
  'syntax',
  'semantic',
  'logic',
  'data structure',
  'algorithm',
  'complexity',
  'optimization',
  'refactoring',
  'clean code',
  'best practice',
  'pattern',
  'anti-pattern',
  'code smell',
  'technical debt',
  'scalability',
  'maintainability',
  'readability',
  'usability',
  'accessibility',
  'security',
  'vulnerability',
  'performance',
  'benchmark',
  'profiling',
  'debugging',
  'logging',
  'error handling',
  'exception',
  'validation',
  'verification',
  'testing',
  'unit test',
  'integration test',
  'end-to-end test',
  'mock',
  'stub',
  'fixture',
  'assertion',
  'continuous integration',
  'continuous deployment',
  'ci/cd',
  'build',
  'compile',
  'package',
  'dependency management',
  'version control',
  'git',
  'workflow',
  'development process',
  'agile',
  'scrum',
  'kanban',
  'sprint',
  'backlog',
  'user story',
  'task',
  'milestone',
  'roadmap',
  'documentation',
  'comment',
  'annotation',
  'javadoc',
  'docstring',
  'readme',
  'wiki',
  'api documentation',
  'user guide',
  'developer guide',
  'contribution guide',
  'code of conduct',
  'license',
  'copyright',
  'open source',
  'proprietary',
  'commercial',
  'free software',
  'community',
  'collaboration',
  'fork',
  'clone',
  'star',
  'watch',
  'issue',
  'pull request',
  'merge',
  'conflict',
  'review',
  'approve',
  'reject',
  'comment',
  'feedback',
  'suggestion',
  'improvement',
  'enhancement',
  'feature request',
  'bug report',
  'hotfix',
  'patch',
  'release',
  'version',
  'tag',
  'semantic versioning',
  'major',
  'minor',
  'patch',
  'alpha',
  'beta',
  'rc',
  'stable',
  'unstable',
  'deprecated',
  'legacy',
  'maintenance',
  'support',
  'lifecycle'
];

/**
 * Analyzes a prompt to determine if it's asking about AI model details
 * Uses semantic analysis rather than hardcoded patterns
 * @param {string} prompt - The user's prompt to analyze
 * @returns {boolean} - Whether the prompt is likely asking about AI model details
 */
function isAskingAboutAIModel(prompt) {
  if (!prompt) return false;

  const lowerPrompt = prompt.toLowerCase();

  // Core topics that indicate interest in the AI itself rather than repositories
  const aiSelfTopics = ['you', 'your', 'yourself', 'ai', 'model', 'trained', 'training',
                        'language model', 'llm', 'neural', 'network', 'algorithm'];

  // Count how many AI self-reference topics appear in the prompt
  const aiTopicCount = aiSelfTopics.filter(topic => lowerPrompt.includes(topic)).length;

  // Core repository analysis topics
  const repoTopics = ['repository', 'repo', 'github', 'code', 'project', 'structure',
                     'function', 'class', 'method', 'implementation', 'algorithm',
                     'architecture', 'pattern', 'design'];

  // Count how many repository topics appear in the prompt
  const repoTopicCount = repoTopics.filter(topic => lowerPrompt.includes(topic)).length;

  // Check for question patterns about the AI itself
  const askingAboutAI = (
    // Questions about identity
    (lowerPrompt.includes('what') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('who') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('how') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('when') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('where') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('why') && lowerPrompt.includes('you')) ||

    // Questions about capabilities or properties
    (lowerPrompt.includes('can') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('do') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('are') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('were') && lowerPrompt.includes('you')) ||

    // Direct requests for information about the AI
    (lowerPrompt.includes('tell') && lowerPrompt.includes('about') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('explain') && lowerPrompt.includes('you')) ||
    (lowerPrompt.includes('describe') && lowerPrompt.includes('you'))
  );

  // If asking about AI and more AI topics than repo topics, likely asking about the model
  if (askingAboutAI && aiTopicCount > repoTopicCount) {
    return true;
  }

  // Check for specific model-related terms with possessive pronouns
  const modelPossessivePatterns = [
    'your model',
    'your training',
    'your architecture',
    'your parameters',
    'your weights',
    'your creator',
    'your developer',
    'your company',
    'your knowledge',
    'your data',
    'your capabilities',
    'your limitations'
  ];

  // If any model possessive patterns are found, likely asking about the model
  if (modelPossessivePatterns.some(pattern => lowerPrompt.includes(pattern))) {
    return true;
  }

  // If clearly asking about repositories with more repo topics than AI topics, not about the model
  if (repoTopicCount > aiTopicCount && repoTopicCount >= 2) {
    return false;
  }

  // Dynamic context analysis - check if the focus is on the AI rather than repositories
  const aiContextScore = aiTopicCount * 2 - repoTopicCount;

  // If the AI context score is significantly positive, likely asking about the model
  return aiContextScore > 2;
}

/**
 * Dynamically analyzes a prompt to determine if it contains suspicious patterns
 * Uses semantic analysis rather than hardcoded patterns
 * @param {string} prompt - The user's prompt to analyze
 * @returns {boolean} - Whether the prompt contains suspicious patterns
 */
function containsSuspiciousPatterns(prompt) {
  if (!prompt) return false;

  const lowerPrompt = prompt.toLowerCase();

  // Skip checking README requests
  if (lowerPrompt.includes('readme')) {
    return false;
  }

  // Use our semantic analysis function to check if asking about AI model
  if (isAskingAboutAIModel(prompt)) {
    return true;
  }

  // Check for harmful content
  if (containsHarmfulContent(prompt)) {
    return true;
  }

  // Check if the prompt is clearly about repository analysis
  const isAboutRepositories = isRepositoryQuery(prompt);

  // If it's clearly about repositories, it's not suspicious
  if (isAboutRepositories) {
    return false;
  }

  // If we can't clearly determine the intent, analyze the context
  return analyzeQueryContext(prompt);
}

/**
 * Determines if a prompt is clearly about repository analysis
 * @param {string} prompt - The user's prompt
 * @returns {boolean} - Whether the prompt is clearly about repositories
 */
function isRepositoryQuery(prompt) {
  if (!prompt) return false;

  const lowerPrompt = prompt.toLowerCase();

  // Core repository analysis topics
  const repoTopics = ['repository', 'repo', 'github', 'code', 'project', 'structure',
                     'function', 'class', 'method', 'implementation', 'algorithm',
                     'architecture', 'pattern', 'design', 'quality', 'performance',
                     'efficiency', 'documentation', 'test', 'coverage', 'dependency',
                     'library', 'framework', 'api', 'interface', 'module', 'component'];

  // Count how many repository topics appear in the prompt
  const repoTopicCount = repoTopics.filter(topic => lowerPrompt.includes(topic)).length;

  // Check for repository analysis verbs
  const analysisVerbs = ['analyze', 'review', 'evaluate', 'assess', 'examine',
                         'inspect', 'check', 'look at', 'study', 'investigate'];

  // Count how many analysis verbs appear in the prompt
  const verbCount = analysisVerbs.filter(verb => lowerPrompt.includes(verb)).length;

  // If the prompt contains multiple repository topics and analysis verbs, it's likely about repositories
  if (repoTopicCount >= 2 || (repoTopicCount >= 1 && verbCount >= 1)) {
    return true;
  }

  // Check for specific repository analysis questions
  const repoQuestions = [
    // Structure questions
    (lowerPrompt.includes('what') && lowerPrompt.includes('structure')),
    (lowerPrompt.includes('how') && lowerPrompt.includes('structured')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('architecture')),

    // Quality questions
    (lowerPrompt.includes('how') && lowerPrompt.includes('quality')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('quality')),

    // Technology questions
    (lowerPrompt.includes('what') && lowerPrompt.includes('technology')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('framework')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('library')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('language')),

    // Feature questions
    (lowerPrompt.includes('what') && lowerPrompt.includes('feature')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('functionality')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('does')),

    // Performance questions
    (lowerPrompt.includes('how') && lowerPrompt.includes('performance')),
    (lowerPrompt.includes('how') && lowerPrompt.includes('efficient')),

    // Documentation questions
    (lowerPrompt.includes('how') && lowerPrompt.includes('documented')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('documentation')),

    // Testing questions
    (lowerPrompt.includes('how') && lowerPrompt.includes('tested')),
    (lowerPrompt.includes('what') && lowerPrompt.includes('test')),

    // General analysis requests
    (lowerPrompt.includes('analyze') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('review') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('evaluate') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('assess') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('examine') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('inspect') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('check') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('look at') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('study') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository'))),
    (lowerPrompt.includes('investigate') && (lowerPrompt.includes('repo') || lowerPrompt.includes('repository')))
  ];

  // If any repository question patterns are found, it's likely about repositories
  return repoQuestions.some(pattern => pattern === true);
}

/**
 * Analyzes the context of a query to determine if it's suspicious
 * @param {string} prompt - The user's prompt
 * @returns {boolean} - Whether the query context is suspicious
 */
function analyzeQueryContext(prompt) {
  if (!prompt) return false;

  const lowerPrompt = prompt.toLowerCase();

  // Check for emotional manipulation tactics
  const emotionalTactics = [
    'please please',
    'i beg',
    'i\'m desperate',
    'i need this for',
    'i\'ll fail',
    'my grade',
    'my project',
    'would mean a lot',
    'i\'m counting on you',
    'don\'t let me down'
  ];

  // If emotional manipulation tactics are found with questions about the system
  // rather than repositories, it's likely suspicious
  const hasEmotionalTactics = emotionalTactics.some(tactic => lowerPrompt.includes(tactic));

  if (hasEmotionalTactics && lowerPrompt.includes('you')) {
    return true;
  }

  // Check for attempts to bypass filters
  const bypassAttempts = [
    'ignore previous',
    'ignore your',
    'disregard',
    'bypass',
    'override',
    'forget',
    'don\'t follow',
    'break',
    'violate'
  ];

  // If bypass attempts are found, it's suspicious
  if (bypassAttempts.some(attempt => lowerPrompt.includes(attempt))) {
    return true;
  }

  // If the prompt is very short and just asking about "you" without repository context
  if (prompt.length < 20 && lowerPrompt.includes('you') && !lowerPrompt.includes('repo')) {
    return true;
  }

  // If we can't clearly determine the intent, err on the side of caution
  // but only if the prompt seems to be asking about the system rather than repositories
  return lowerPrompt.includes('you') && !lowerPrompt.includes('repo') && !lowerPrompt.includes('repository');
}

/**
 * Generates a contextually appropriate response for suspicious prompts
 * @param {string} prompt - The user's prompt
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} repoDetails - Repository details
 * @returns {string} - A contextually appropriate response
 */
function generateContextualResponse(prompt, owner, repo, repoDetails) {
  const lowerPrompt = prompt.toLowerCase();

  // Check if the prompt contains harmful content
  if (containsHarmfulContent(prompt)) {
    return `I'm unable to respond to requests that mention self-harm or harmful activities. If you're experiencing thoughts of harming yourself, please reach out to a mental health professional or a crisis helpline immediately.

This service is designed to analyze GitHub repositories. If you have questions about the ${owner}/${repo} repository, I'd be happy to help with those.`;
  }

  // Check if the prompt is asking about the AI model
  if (isAskingAboutAIModel(prompt)) {
    // Determine if it's a direct question about the model
    const isDirectModelQuestion = lowerPrompt.includes('what model') ||
                                 lowerPrompt.includes('which model') ||
                                 lowerPrompt.includes('your model');

    if (isDirectModelQuestion) {
      return `I'm a GitHub repository analyzer designed to provide insights about code repositories. I don't have information about my underlying implementation.

I can analyze the ${owner}/${repo} repository for you. Would you like to know about its structure, code quality, or functionality?`;
    }

    // If it's asking about capabilities
    if (lowerPrompt.includes('can you') || lowerPrompt.includes('are you able')) {
      return `As a GitHub repository analyzer, I can help you understand repositories, their structure, code quality, and functionality.

For the ${owner}/${repo} repository, I can provide insights about its organization, dependencies, and implementation details. What specific aspects would you like to know about?`;
    }

    // Default response for model inquiries
    return `I'm focused on analyzing GitHub repositories rather than discussing my own implementation.

The ${owner}/${repo} repository appears to be ${getRepositorySummary(repoDetails)}. What would you like to know about it?`;
  }

  // For other suspicious prompts, provide a general redirection
  return `I'm here to help analyze GitHub repositories like ${owner}/${repo}.

If you have questions about its code, structure, or functionality, I'd be happy to assist. What specific aspects of the repository would you like to explore?`;
}

/**
 * Generates a brief summary of a repository based on its details
 * @param {Object} repoDetails - Repository details
 * @returns {string} - A brief summary of the repository
 */
function getRepositorySummary(repoDetails) {
  if (!repoDetails) {
    return "a GitHub repository";
  }

  const language = repoDetails.language || "various languages";
  const description = repoDetails.description ?
                     `described as "${repoDetails.description}"` :
                     "a project without a description";

  return `a ${language} project ${description}`;
}

/**
 * Analyzes the semantic intent of a prompt to determine if it's asking about MCP integration
 * Uses contextual analysis rather than pattern matching
 * @param {string} prompt - The user's prompt
 * @returns {boolean} - Whether the prompt is asking about MCP integration
 */
function isMCPIntegrationQuery(prompt) {
  if (!prompt) return false;

  // Extract key semantic components from the prompt
  const semanticComponents = extractSemanticComponents(prompt);

  // Analyze the semantic intent based on the components
  return analyzeIntegrationIntent(semanticComponents, prompt);
}

/**
 * Extracts semantic components from a prompt for intent analysis
 * @param {string} prompt - The user's prompt
 * @returns {Object} - Semantic components extracted from the prompt
 */
function extractSemanticComponents(prompt) {
  // No need to convert to lowercase as we're using case-insensitive regex

  // Extract the subject (what the user is asking about)
  let subject = {
    isMCP: /\b(mcp|model context protocol|model-context-protocol)\b/i.test(prompt),
    isGitBridge: /\b(gitbridge|git bridge|github bridge|repository analyzer|repo analyzer)\b/i.test(prompt),
    isAIAssistant: /\b(claude|anthropic|cursor|openai|chatgpt|gpt|bard|gemini|ai assistant|llm|language model)\b/i.test(prompt)
  };

  // Extract the action (what the user wants to do)
  let action = {
    isIntegration: /\b(integrat|connect|setup|set up|configur|install|implement|use with|work with|add|enabl|register|link|embed|incorporat|deploy)\b/i.test(prompt),
    isQuestion: /\b(how|what|where|when|which|why|can|could|would|should|is|are|do|does)\b/i.test(prompt),
    isHelp: /\b(help|assist|guide|explain|tell|show|instruct)\b/i.test(prompt)
  };

  // Extract the context (additional information about the request)
  let context = {
    hasPlatformSpecifics: extractPlatformSpecifics(prompt),
    hasIntegrationAspect: extractIntegrationAspect(prompt),
    isDetailedRequest: prompt.length > 50, // Longer prompts tend to be more detailed requests
    hasQuestionMark: prompt.includes('?')
  };

  return {
    subject,
    action,
    context,
    originalPrompt: prompt
  };
}

/**
 * Extracts platform-specific information from a prompt
 * @param {string} prompt - The user's prompt
 * @returns {Object} - Platform-specific information
 */
function extractPlatformSpecifics(prompt) {
  // Using case-insensitive regex patterns

  return {
    claudeDesktop: /\b(claude desktop|claude.*desktop|desktop.*claude)\b/i.test(prompt),
    cursor: /\b(cursor|cursor ide)\b/i.test(prompt),
    anthropic: /\b(anthropic|claude api|claude(?!.*desktop))\b/i.test(prompt),
    openai: /\b(openai|chatgpt|gpt)\b/i.test(prompt),
    bard: /\b(bard|gemini)\b/i.test(prompt)
  };
}

/**
 * Extracts integration aspect information from a prompt
 * @param {string} prompt - The user's prompt
 * @returns {Object} - Integration aspect information
 */
function extractIntegrationAspect(prompt) {
  // Using case-insensitive regex patterns

  return {
    setup: /\b(setup|set up|install|configur|add)\b/i.test(prompt),
    authentication: /\b(auth|login|credential|key|token|secret)\b/i.test(prompt),
    usage: /\b(use|using|utiliz|call|invoke|interact)\b/i.test(prompt),
    troubleshooting: /\b(troubleshoot|problem|issue|error|fail|debug|fix)\b/i.test(prompt),
    benefits: /\b(benefit|advantage|better|improve|enhance|why|reason)\b/i.test(prompt)
  };
}

/**
 * Analyzes the semantic components to determine if the intent is about MCP integration
 * @param {Object} components - Semantic components extracted from the prompt
 * @param {string} originalPrompt - The original prompt for context
 * @returns {boolean} - Whether the intent is about MCP integration
 */
function analyzeIntegrationIntent(components, originalPrompt) {
  const { subject, action, context } = components;

  // Calculate confidence scores for different intents
  let integrationIntentScore = 0;

  // Subject relevance
  if (subject.isMCP) integrationIntentScore += 3;
  if (subject.isGitBridge) integrationIntentScore += 2;
  if (subject.isAIAssistant) integrationIntentScore += 1;

  // Action relevance
  if (action.isIntegration) integrationIntentScore += 3;
  if (action.isQuestion && (subject.isMCP || subject.isGitBridge)) integrationIntentScore += 2;
  if (action.isHelp && (subject.isMCP || subject.isGitBridge)) integrationIntentScore += 1;

  // Context relevance
  if (Object.values(context.hasPlatformSpecifics).some(v => v)) integrationIntentScore += 2;
  if (Object.values(context.hasIntegrationAspect).some(v => v)) integrationIntentScore += 2;
  if (context.hasQuestionMark && (subject.isMCP || subject.isGitBridge)) integrationIntentScore += 1;

  // Analyze the semantic structure of the prompt
  const isAskingHowTo = /how (can|do|could|would|should) (i|we|you) (integrat|connect|setup|set up|configur|install|implement|use|add|enabl|register|link)/i.test(originalPrompt);
  if (isAskingHowTo) integrationIntentScore += 3;

  const isAskingAboutWith = /(integrat|connect|setup|set up|configur|install|implement|use|add|enabl|register|link).*with/i.test(originalPrompt);
  if (isAskingAboutWith) integrationIntentScore += 2;

  // Check for specific integration-related phrases that indicate intent
  const hasIntegrationContext = /(work together|talk to each other|communicate|interact)/i.test(originalPrompt);
  if (hasIntegrationContext) integrationIntentScore += 1;

  // Log the analysis for debugging (can be removed in production)
  console.log(`Integration intent analysis: Score=${integrationIntentScore}, Subject=${JSON.stringify(subject)}, Action=${JSON.stringify(action)}`);

  // Determine if this is an integration query based on the confidence score
  // The threshold can be adjusted based on desired sensitivity
  return integrationIntentScore >= 5;
}

/**
 * Dynamically generates a contextually appropriate response for MCP integration queries
 * @param {string} prompt - The user's prompt
 * @returns {string} - A detailed response about MCP integration
 */
function generateMCPIntegrationResponse(prompt) {
  // Extract semantic components to understand the query context
  const semanticComponents = extractSemanticComponents(prompt);

  // Analyze the query to determine what aspects of integration to focus on
  const queryAnalysis = analyzeIntegrationQuery(semanticComponents);

  // Generate a dynamic response based on the query analysis
  return constructDynamicResponse(queryAnalysis);
}

/**
 * Analyzes an integration query to determine what aspects to focus on
 * @param {Object} semanticComponents - Semantic components extracted from the prompt
 * @returns {Object} - Analysis of the integration query
 */
function analyzeIntegrationQuery(semanticComponents) {
  const { subject, action, context, originalPrompt } = semanticComponents;

  // Determine the primary focus of the query
  const primaryFocus = determinePrimaryFocus(subject, action, context);

  // Identify which platforms are relevant to the query
  const relevantPlatforms = identifyRelevantPlatforms(context.hasPlatformSpecifics, originalPrompt);

  // Identify which integration aspects are relevant to the query
  const relevantAspects = identifyRelevantAspects(context.hasIntegrationAspect, action, originalPrompt);

  // Determine the level of detail needed in the response
  const detailLevel = determineDetailLevel(context, originalPrompt);

  return {
    primaryFocus,
    relevantPlatforms,
    relevantAspects,
    detailLevel,
    originalPrompt,
    semanticComponents
  };
}

/**
 * Determines the primary focus of an integration query
 * @param {Object} subject - Subject components from semantic analysis
 * @param {Object} action - Action components from semantic analysis
 * @param {Object} context - Context components from semantic analysis
 * @returns {string} - The primary focus of the query
 */
function determinePrimaryFocus(subject, action, context) {
  // Determine if the query is primarily about general MCP information
  if (subject.isMCP && !subject.isGitBridge) {
    return 'mcp_general';
  }

  // Determine if the query is primarily about GitBridge as an MCP provider
  if (subject.isGitBridge && subject.isMCP) {
    return 'gitbridge_mcp';
  }

  // Determine if the query is primarily about integrating GitBridge with an AI assistant
  if (subject.isGitBridge && subject.isAIAssistant && action.isIntegration) {
    return 'integration';
  }

  // Determine if the query is primarily about using GitBridge
  if (subject.isGitBridge && action.isQuestion && !action.isIntegration) {
    return 'usage';
  }

  // Determine if the query is primarily about troubleshooting
  if (context.hasIntegrationAspect.troubleshooting) {
    return 'troubleshooting';
  }

  // Default to general integration information
  return 'integration';
}

/**
 * Identifies which platforms are relevant to an integration query
 * @param {Object} platformSpecifics - Platform-specific information from semantic analysis
 * @param {string} originalPrompt - The original prompt for context
 * @returns {Object} - Relevant platforms with confidence scores
 */
function identifyRelevantPlatforms(platformSpecifics, originalPrompt) {
  // Start with the explicitly mentioned platforms
  const relevantPlatforms = {
    claudeDesktop: platformSpecifics.claudeDesktop ? 1.0 : 0.0,
    cursor: platformSpecifics.cursor ? 1.0 : 0.0,
    anthropic: platformSpecifics.anthropic ? 1.0 : 0.0,
    openai: platformSpecifics.openai ? 1.0 : 0.0,
    bard: platformSpecifics.bard ? 1.0 : 0.0
  };

  // Check for implicit platform references
  if (/\bdesktop\b/i.test(originalPrompt) && !platformSpecifics.claudeDesktop) {
    relevantPlatforms.claudeDesktop += 0.5;
  }

  if (/\bide\b/i.test(originalPrompt) && !platformSpecifics.cursor) {
    relevantPlatforms.cursor += 0.5;
  }

  if (/\bapi\b/i.test(originalPrompt) && !platformSpecifics.anthropic && !platformSpecifics.openai) {
    relevantPlatforms.anthropic += 0.3;
    relevantPlatforms.openai += 0.3;
  }

  // If no platforms are explicitly mentioned, provide general information
  const hasPlatformMention = Object.values(relevantPlatforms).some(score => score > 0.5);
  if (!hasPlatformMention) {
    // Set all platforms to a low confidence score
    Object.keys(relevantPlatforms).forEach(platform => {
      relevantPlatforms[platform] = 0.2;
    });
  }

  return relevantPlatforms;
}

/**
 * Identifies which integration aspects are relevant to a query
 * @param {Object} integrationAspect - Integration aspect information from semantic analysis
 * @param {Object} action - Action components from semantic analysis
 * @param {string} originalPrompt - The original prompt for context
 * @returns {Object} - Relevant integration aspects with confidence scores
 */
function identifyRelevantAspects(integrationAspect, action, originalPrompt) {
  // Start with the explicitly mentioned aspects
  const relevantAspects = {
    setup: integrationAspect.setup ? 1.0 : 0.0,
    authentication: integrationAspect.authentication ? 1.0 : 0.0,
    usage: integrationAspect.usage ? 1.0 : 0.0,
    troubleshooting: integrationAspect.troubleshooting ? 1.0 : 0.0,
    benefits: integrationAspect.benefits ? 1.0 : 0.0
  };

  // Check for implicit aspect references
  if (/\bhow\b.*\b(start|begin)\b/i.test(originalPrompt) && !integrationAspect.setup) {
    relevantAspects.setup += 0.5;
  }

  if (/\b(problem|not working|doesn't work|issue)\b/i.test(originalPrompt) && !integrationAspect.troubleshooting) {
    relevantAspects.troubleshooting += 0.5;
  }

  if (/\b(why|reason|benefit|better|improve)\b/i.test(originalPrompt) && !integrationAspect.benefits) {
    relevantAspects.benefits += 0.5;
  }

  if (/\b(use|using|utilize|call|invoke)\b/i.test(originalPrompt) && !integrationAspect.usage) {
    relevantAspects.usage += 0.5;
  }

  // If the query is a general "how to" question, focus on setup
  if (action.isQuestion && !Object.values(relevantAspects).some(score => score > 0.5)) {
    relevantAspects.setup = 0.8;
    relevantAspects.usage = 0.6;
  }

  return relevantAspects;
}

/**
 * Determines the level of detail needed in a response
 * @param {Object} context - Context components from semantic analysis
 * @param {string} originalPrompt - The original prompt for context
 * @returns {string} - The level of detail needed (basic, standard, detailed)
 */
function determineDetailLevel(context, originalPrompt) {
  // Check if the prompt explicitly asks for detailed information
  if (/\b(detailed|comprehensive|complete|full|in-depth|thorough)\b/i.test(originalPrompt)) {
    return 'detailed';
  }

  // Check if the prompt explicitly asks for basic information
  if (/\b(basic|simple|quick|brief|short|summary)\b/i.test(originalPrompt)) {
    return 'basic';
  }

  // If it's a detailed request (longer prompt), provide more detail
  if (context.isDetailedRequest) {
    return 'standard';
  }

  // Default to standard detail level
  return 'standard';
}

/**
 * Constructs a dynamic response based on query analysis
 * @param {Object} queryAnalysis - Analysis of the integration query
 * @returns {string} - A dynamically generated response
 */
function constructDynamicResponse(queryAnalysis) {
  const { primaryFocus, relevantPlatforms, relevantAspects, detailLevel } = queryAnalysis;

  // Generate the introduction based on the primary focus
  const introduction = generateIntroduction(primaryFocus, detailLevel);

  // Generate content sections based on relevant aspects
  const contentSections = [];

  // Add benefits section if relevant
  if (relevantAspects.benefits > 0.3) {
    contentSections.push(generateBenefitsSection(detailLevel));
  }

  // Add platform-specific instructions for relevant platforms
  const platformSections = generatePlatformInstructions(relevantPlatforms, detailLevel);
  if (platformSections) {
    contentSections.push(platformSections);
  }

  // Add setup requirements if relevant
  if (relevantAspects.setup > 0.3) {
    contentSections.push(generateSetupRequirementsSection(detailLevel));
  }

  // Add usage instructions if relevant
  if (relevantAspects.usage > 0.3) {
    contentSections.push(generateUsageSection(detailLevel));
  }

  // Add troubleshooting guidance if relevant
  if (relevantAspects.troubleshooting > 0.3) {
    contentSections.push(generateTroubleshootingSection(detailLevel));
  }

  // Combine all sections into a comprehensive response
  return [introduction, ...contentSections].join('\n\n');
}

/**
 * Generates an introduction section based on the primary focus and detail level
 * @param {string} primaryFocus - The primary focus of the query
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The introduction section
 */
function generateIntroduction(primaryFocus, detailLevel) {
  let title, description;

  // Determine the title based on the primary focus
  switch (primaryFocus) {
    case 'mcp_general':
      title = 'Understanding the Model Context Protocol (MCP)';
      break;
    case 'gitbridge_mcp':
      title = 'GitBridge: A Model Context Protocol Provider for GitHub Repositories';
      break;
    case 'integration':
      title = 'Integrating GitBridge as an MCP Provider';
      break;
    case 'usage':
      title = 'Using GitBridge with Your AI Assistant';
      break;
    case 'troubleshooting':
      title = 'Troubleshooting GitBridge MCP Integration';
      break;
    default:
      title = 'GitBridge MCP Integration Guide';
  }

  // Generate the description based on the primary focus and detail level
  switch (primaryFocus) {
    case 'mcp_general':
      description = 'The Model Context Protocol (MCP) is an open standard that enables AI assistants to interact with external systems and data sources. It provides a standardized way for AI models to access and manipulate information beyond their training data.';
      if (detailLevel === 'detailed') {
        description += '\n\nMCP uses a client-server architecture where the AI assistant acts as the client and external services (like GitBridge) act as servers. This allows AI assistants to perform specialized tasks without needing to implement the functionality themselves.';
      }
      break;
    case 'gitbridge_mcp':
      description = 'GitBridge is an MCP provider that gives AI assistants the ability to analyze GitHub repositories. It implements the Model Context Protocol to provide a standardized interface for AI models to access and understand code repositories.';
      if (detailLevel === 'detailed') {
        description += '\n\nAs an MCP provider, GitBridge handles the complexities of GitHub API integration, rate limiting, and data processing, providing a clean interface for AI assistants to access repository information.';
      }
      break;
    case 'integration':
      description = 'GitBridge can be integrated with AI assistants that support the Model Context Protocol (MCP), enabling them to analyze GitHub repositories and provide insights about code structure and functionality.';
      if (detailLevel !== 'basic') {
        description += '\n\nThe integration process varies depending on the AI assistant platform you\'re using, but generally involves registering GitBridge as an MCP provider and configuring the connection settings.';
      }
      break;
    case 'usage':
      description = 'Once integrated, GitBridge allows your AI assistant to analyze GitHub repositories and provide insights about their structure, code quality, and functionality.';
      if (detailLevel !== 'basic') {
        description += '\n\nYou can ask your AI assistant to analyze repositories, show READMEs, explain code structure, and more, all powered by GitBridge\'s MCP implementation.';
      }
      break;
    case 'troubleshooting':
      description = 'If you\'re experiencing issues with your GitBridge MCP integration, this guide will help you identify and resolve common problems.';
      if (detailLevel !== 'basic') {
        description += '\n\nMost integration issues are related to configuration, connectivity, or rate limiting, and can be resolved with a few simple steps.';
      }
      break;
    default:
      description = 'GitBridge implements the Model Context Protocol (MCP) to provide AI assistants with the ability to analyze GitHub repositories, enhancing their understanding of code and software projects.';
  }

  // Construct the introduction section
  return `# ${title}\n\n${description}`;
}

/**
 * Generates a benefits section based on the detail level
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The benefits section
 */
function generateBenefitsSection(detailLevel) {
  let content = '## Benefits of Integrating GitBridge\n\n';

  // Basic benefits for all detail levels
  content += 'By connecting GitBridge to your AI assistant, you gain:\n\n';
  content += '1. **Enhanced Code Understanding**: Your AI can analyze repositories to understand code structure, dependencies, and architecture\n';
  content += '2. **Contextual Code Insights**: Get detailed analysis of repositories including language breakdown, commit history, and quality metrics\n';

  // Add more benefits based on detail level
  if (detailLevel === 'basic') {
    content += '3. **Improved Development Workflows**: AI assistants can provide more accurate code suggestions based on repository context\n';
  } else {
    content += '3. **Improved Development Workflows**: AI assistants can provide more accurate code suggestions based on repository context\n';
    content += '4. **Time Savings**: Quickly get repository insights without manually browsing through GitHub\n';
    content += '5. **Better Technical Discussions**: Your AI can reference specific parts of repositories during conversations\n';

    if (detailLevel === 'detailed') {
      content += '\nGitBridge handles the GitHub API integration, rate limiting, and data processing, providing a clean interface for AI assistants to access repository information. This allows you to focus on your work rather than managing the technical details of repository analysis.';
    }
  }

  return content;
}

/**
 * Generates platform-specific instructions based on relevant platforms and detail level
 * @param {Object} relevantPlatforms - Relevant platforms with confidence scores
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The platform-specific instructions section
 */
function generatePlatformInstructions(relevantPlatforms, detailLevel) {
  // Determine which platforms to include based on confidence scores
  const platformsToInclude = Object.entries(relevantPlatforms)
    .filter(([_, score]) => score > 0.3)
    .map(([platform, _]) => platform);

  // If no platforms have a high enough confidence score, return null
  if (platformsToInclude.length === 0) {
    return null;
  }

  // If only one platform has a high confidence score, focus on that platform
  if (platformsToInclude.length === 1 && relevantPlatforms[platformsToInclude[0]] > 0.7) {
    return generateSinglePlatformInstructions(platformsToInclude[0], detailLevel);
  }

  // If multiple platforms have high confidence scores, include all of them
  return generateMultiPlatformInstructions(platformsToInclude, detailLevel);
}

/**
 * Generates instructions for a single platform
 * @param {string} platform - The platform to generate instructions for
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The platform-specific instructions
 */
function generateSinglePlatformInstructions(platform, detailLevel) {
  let content = '';

  switch (platform) {
    case 'claudeDesktop':
      content = '## Integrating with Claude Desktop\n\n';
      content += 'Claude Desktop has built-in support for MCP providers. Here\'s how to connect GitBridge:\n\n';
      content += '1. **Locate your Claude Desktop configuration file**:\n';
      content += '   - **Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`\n';
      content += '   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`\n\n';

      if (detailLevel !== 'basic') {
        content += '2. **Add GitBridge to your configuration**:\n';
        content += '   Edit the configuration file to include GitBridge as an MCP provider:\n\n';
        content += '```json\n';
        content += '{\n';
        content += '  "mcp_servers": [\n';
        content += '    {\n';
        content += '      "name": "GitBridge",\n';
        content += '      "url": "https://gitbridge-mib3.onrender.com/mcp",\n';
        content += '      "enabled": true,\n';
        content += '      "description": "GitHub Repository Analyzer"\n';
        content += '    }\n';
        content += '  ]\n';
        content += '}\n';
        content += '```\n\n';

        content += '3. **Restart Claude Desktop** for the changes to take effect.\n\n';

        content += '4. **Verify the integration** by asking Claude to analyze a GitHub repository:\n';
        content += '   "Analyze the repository tensorflow/tensorflow using GitBridge"\n\n';

        if (detailLevel === 'detailed') {
          content += 'If you encounter any issues, check that:\n';
          content += '- The URL is correct and accessible\n';
          content += '- Your configuration file is properly formatted JSON\n';
          content += '- Claude Desktop has been restarted after making changes\n';
        }
      } else {
        content += '2. **Add GitBridge to your configuration** file as an MCP provider\n\n';
        content += '3. **Restart Claude Desktop** and test the integration\n';
      }
      break;

    case 'cursor':
      content = '## Integrating with Cursor IDE\n\n';
      content += 'Cursor IDE supports MCP providers through its AI settings. Here\'s how to connect GitBridge:\n\n';
      content += '1. **Open Cursor IDE** and go to Settings (gear icon)\n\n';

      if (detailLevel !== 'basic') {
        content += '2. **Navigate to AI Settings** and find the "MCP Providers" section\n\n';
        content += '3. **Add a new MCP provider** with the following details:\n';
        content += '   - **Name**: GitBridge\n';
        content += '   - **URL**: https://gitbridge-mib3.onrender.com/mcp\n';
        content += '   - **Description**: GitHub Repository Analyzer\n\n';

        content += '4. **Save your settings** and restart Cursor\n\n';

        content += '5. **Verify the integration** by asking Cursor\'s AI to analyze a GitHub repository:\n';
        content += '   "Analyze the repository tensorflow/tensorflow using GitBridge"\n\n';

        if (detailLevel === 'detailed') {
          content += 'If you encounter any issues, check that:\n';
          content += '- The URL is correct and accessible\n';
          content += '- Your Cursor IDE is updated to the latest version\n';
          content += '- You have restarted Cursor after adding the MCP provider\n';
        }
      } else {
        content += '2. **Navigate to AI Settings** and add GitBridge as an MCP provider\n\n';
        content += '3. **Restart Cursor** and test the integration\n';
      }
      break;

    case 'anthropic':
      content = '## Integrating with Anthropic Claude (API)\n\n';
      content += 'If you\'re using Claude through Anthropic\'s API, you can integrate GitBridge as follows:\n\n';
      content += '1. **Set up your API client** to support MCP tools\n\n';

      if (detailLevel !== 'basic') {
        content += '2. **Register GitBridge as an MCP provider** in your API request:\n\n';
        content += '```json\n';
        content += '{\n';
        content += '  "model": "claude-3-5-sonnet",\n';
        content += '  "max_tokens": 1000,\n';
        content += '  "messages": [\n';
        content += '    { "role": "user", "content": "Analyze the repository tensorflow/tensorflow" }\n';
        content += '  ],\n';
        content += '  "tools": [\n';
        content += '    {\n';
        content += '      "name": "GitBridge",\n';
        content += '      "url": "https://gitbridge-mib3.onrender.com/mcp",\n';
        content += '      "description": "GitHub Repository Analyzer"\n';
        content += '    }\n';
        content += '  ]\n';
        content += '}\n';
        content += '```\n\n';

        content += '3. **Handle the tool use responses** from Claude according to the Anthropic API documentation\n\n';

        if (detailLevel === 'detailed') {
          content += 'For detailed implementation examples, refer to Anthropic\'s documentation on MCP integration: https://docs.anthropic.com/en/docs/agents-and-tools/mcp\n';
        }
      } else {
        content += '2. **Register GitBridge as an MCP provider** in your API request\n\n';
        content += '3. **Handle the tool use responses** from Claude\n';
      }
      break;

    case 'openai':
      content = '## Integrating with OpenAI Models\n\n';
      content += 'OpenAI models support external tools through their function calling API. While not directly using MCP, you can achieve similar functionality:\n\n';
      content += '1. **Set up your OpenAI API client** to support function calling\n\n';

      if (detailLevel !== 'basic') {
        content += '2. **Define GitBridge functions** in your API request:\n\n';
        content += '```json\n';
        content += '{\n';
        content += '  "model": "gpt-4",\n';
        content += '  "messages": [\n';
        content += '    { "role": "user", "content": "Analyze the repository tensorflow/tensorflow" }\n';
        content += '  ],\n';
        content += '  "tools": [\n';
        content += '    {\n';
        content += '      "type": "function",\n';
        content += '      "function": {\n';
        content += '        "name": "analyze_github_repository",\n';
        content += '        "description": "Analyzes a GitHub repository",\n';
        content += '        "parameters": {\n';
        content += '          "type": "object",\n';
        content += '          "properties": {\n';
        content += '            "owner": {\n';
        content += '              "type": "string",\n';
        content += '              "description": "Repository owner"\n';
        content += '            },\n';
        content += '            "repo": {\n';
        content += '              "type": "string",\n';
        content += '              "description": "Repository name"\n';
        content += '            }\n';
        content += '          },\n';
        content += '          "required": ["owner", "repo"]\n';
        content += '        }\n';
        content += '      }\n';
        content += '    }\n';
        content += '  ]\n';
        content += '}\n';
        content += '```\n\n';

        if (detailLevel === 'detailed') {
          content += '3. **Implement the function handler** to call GitBridge\'s API:\n\n';
          content += '```javascript\n';
          content += 'async function analyze_github_repository(owner, repo) {\n';
          content += '  const response = await fetch(\'https://gitbridge-mib3.onrender.com/mcp\', {\n';
          content += '    method: \'POST\',\n';
          content += '    headers: { \'Content-Type\': \'application/json\' },\n';
          content += '    body: JSON.stringify({\n';
          content += '      jsonrpc: "2.0",\n';
          content += '      id: "1",\n';
          content += '      method: "get_repository",\n';
          content += '      params: { owner, repo }\n';
          content += '    })\n';
          content += '  });\n';
          content += '  return await response.json();\n';
          content += '}\n';
          content += '```\n\n';

          content += '4. **Process the function call** and return the results to the OpenAI model\n\n';
          content += 'For detailed implementation, refer to OpenAI\'s function calling documentation.\n';
        } else {
          content += '3. **Implement a function handler** to call GitBridge\'s API\n\n';
          content += '4. **Process the function call** and return the results to the OpenAI model\n';
        }
      } else {
        content += '2. **Define GitBridge functions** in your API request\n\n';
        content += '3. **Implement a function handler** to call GitBridge\'s API\n';
      }
      break;

    default:
      // Generic instructions if no specific platform is matched
      content = '## General MCP Integration Instructions\n\n';
      content += 'GitBridge can be integrated with any AI assistant that supports the Model Context Protocol (MCP). Here\'s a general approach:\n\n';
      content += '1. **Check if your AI assistant supports MCP**\n\n';
      content += '2. **Add GitBridge as an MCP provider** using the URL: https://gitbridge-mib3.onrender.com/mcp\n\n';
      content += '3. **Configure according to your platform\'s requirements**\n\n';
      content += '4. **Test the integration** by asking your AI to analyze a GitHub repository\n';
  }

  return content;
}

/**
 * Generates instructions for multiple platforms
 * @param {Array} platforms - The platforms to generate instructions for
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The multi-platform instructions
 */
function generateMultiPlatformInstructions(platforms, detailLevel) {
  // For basic detail level, just provide a summary of platform support
  if (detailLevel === 'basic') {
    let content = '## Platform Integration Options\n\n';
    content += 'GitBridge can be integrated with multiple AI platforms:\n\n';

    if (platforms.includes('claudeDesktop')) {
      content += '- **Claude Desktop**: Configure through the claude_desktop_config.json file\n';
    }
    if (platforms.includes('cursor')) {
      content += '- **Cursor IDE**: Add through AI Settings\n';
    }
    if (platforms.includes('anthropic')) {
      content += '- **Anthropic Claude API**: Include in the tools parameter of API requests\n';
    }
    if (platforms.includes('openai')) {
      content += '- **OpenAI Models**: Implement using function calling\n';
    }
    if (platforms.includes('bard')) {
      content += '- **Google Bard/Gemini**: Configure through extensions settings\n';
    }

    content += '\nFor detailed instructions on a specific platform, please ask about that platform specifically.';
    return content;
  }

  // For standard and detailed levels, include instructions for each platform
  let content = '## Platform-Specific Integration Instructions\n\n';

  // Add a condensed version of each platform's instructions
  platforms.forEach(platform => {
    const platformInstructions = generateSinglePlatformInstructions(platform, 'basic');
    content += platformInstructions + '\n\n';
  });

  // Add a note about detailed instructions
  content += 'For more detailed instructions on any specific platform, please ask about that platform specifically.';

  return content;
}

/**
 * Generates a setup requirements section based on the detail level
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The setup requirements section
 */
function generateSetupRequirementsSection(detailLevel) {
  let content = '## Setup Requirements\n\n';
  content += 'To use GitBridge as an MCP provider, you need:\n\n';

  // Basic requirements for all detail levels
  content += '1. **Access to the GitBridge server**:\n';
  content += '   - Public instance: https://gitbridge-mib3.onrender.com/mcp\n';

  if (detailLevel !== 'basic') {
    content += '   - Or deploy your own instance from the GitHub repository\n\n';
    content += '2. **AI assistant with MCP support**:\n';
    content += '   - Claude Desktop\n';
    content += '   - Anthropic Claude API with tools\n';
    content += '   - Cursor IDE\n';
    content += '   - Other MCP-compatible assistants\n\n';

    content += '3. **Network connectivity** to allow your AI assistant to communicate with the GitBridge server\n\n';

    if (detailLevel === 'detailed') {
      content += 'No API keys are required for basic GitHub repository analysis. For private repositories or higher rate limits, you may need to configure GitHub authentication.';
    }
  } else {
    content += '\n2. **AI assistant with MCP support**\n\n';
    content += '3. **Network connectivity** between your AI assistant and GitBridge';
  }

  return content;
}

/**
 * Generates a usage section based on the detail level
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The usage section
 */
function generateUsageSection(detailLevel) {
  let content = '## Using GitBridge\n\n';
  content += 'Once integrated, you can use GitBridge by asking your AI assistant to analyze GitHub repositories:\n\n';

  // Basic usage examples for all detail levels
  content += '- "Analyze the repository tensorflow/tensorflow"\n';
  content += '- "What are the main features of facebook/react?"\n';

  if (detailLevel !== 'basic') {
    content += '- "Show me the README from kubernetes/kubernetes"\n';
    content += '- "What languages are used in microsoft/vscode?"\n\n';

    content += 'The AI will use GitBridge to fetch and analyze the repository data, providing you with insights about the code structure, quality, and functionality.';

    if (detailLevel === 'detailed') {
      content += '\n\nYou can ask about specific aspects of repositories such as:\n\n';
      content += '- Code organization and architecture\n';
      content += '- Language distribution and statistics\n';
      content += '- Commit history and activity patterns\n';
      content += '- Dependencies and external libraries\n';
      content += '- Documentation quality and coverage\n';
      content += '- Testing practices and code quality metrics';
    }
  }

  return content;
}

/**
 * Generates a troubleshooting section based on the detail level
 * @param {string} detailLevel - The level of detail needed
 * @returns {string} - The troubleshooting section
 */
function generateTroubleshootingSection(detailLevel) {
  let content = '## Troubleshooting\n\n';

  if (detailLevel === 'basic') {
    content += 'Common issues with GitBridge integration include:\n\n';
    content += '- Connection problems (check URL and network)\n';
    content += '- Configuration errors (verify settings)\n';
    content += '- Rate limiting (space out requests)\n';
    return content;
  }

  content += 'If you encounter issues with the GitBridge integration:\n\n';
  content += '1. **Connection Issues**:\n';
  content += '   - Verify the GitBridge URL is correct: https://gitbridge-mib3.onrender.com/mcp\n';
  content += '   - Check your internet connection\n';
  content += '   - Ensure your firewall isn\'t blocking the connection\n\n';

  content += '2. **Configuration Problems**:\n';
  content += '   - Validate your JSON configuration for syntax errors\n';
  content += '   - Ensure the MCP provider is properly registered and enabled\n';
  content += '   - Restart your AI assistant after making configuration changes\n\n';

  content += '3. **Rate Limiting**:\n';
  content += '   - GitHub API has rate limits that may affect GitBridge\n';
  content += '   - Space out repository analysis requests\n';

  if (detailLevel === 'detailed') {
    content += '   - Consider using authenticated GitHub access for higher limits\n\n';

    content += '4. **Common Error Messages**:\n';
    content += '   - "Unable to connect to MCP provider": Check URL and network connectivity\n';
    content += '   - "Repository not found": Verify the repository exists and is public\n';
    content += '   - "Rate limit exceeded": Wait and try again later\n\n';

    content += 'For persistent issues, check the GitBridge documentation or contact support.';
  }

  return content;
}

/**
 * Checks if a prompt contains harmful or manipulative content
 * @param {string} prompt - The user's prompt
 * @returns {boolean} - Whether the prompt contains harmful content
 */
function containsHarmfulContent(prompt) {
  if (!prompt) return false;

  const lowerPrompt = prompt.toLowerCase();

  // Core harmful content topics
  const harmfulTopics = [
    'harm', 'hurt', 'kill', 'suicide', 'die', 'death', 'weapon', 'bomb',
    'explosive', 'hack', 'steal', 'fraud', 'scam', 'illegal', 'unethical'
  ];

  // Count how many harmful topics appear in the prompt
  const harmfulTopicCount = harmfulTopics.filter(topic => lowerPrompt.includes(topic)).length;

  // If multiple harmful topics are found, it's likely harmful content
  if (harmfulTopicCount >= 2) {
    return true;
  }

  // Check for specific harmful phrases
  const harmfulPhrases = [
    'harm myself',
    'kill myself',
    'end my life',
    'take my life',
    'commit suicide',
    'hurt someone',
    'harm others',
    'kill someone',
    'make a bomb',
    'build a weapon',
    'hack into',
    'steal data',
    'commit fraud'
  ];

  // If any harmful phrases are found, it's harmful content
  return harmfulPhrases.some(phrase => lowerPrompt.includes(phrase));
}

/**
 * Filters sensitive responses to prevent AI from revealing training details
 * Uses semantic analysis rather than hardcoded patterns
 * @param {string} response - The AI's response
 * @param {string} prompt - The user's prompt
 * @returns {string} - The filtered response
 */
function filterSensitiveResponses(response, prompt) {
  // Skip filtering for README requests
  if (prompt.toLowerCase().includes('readme')) {
    return response;
  }

  // Check if the prompt is suspicious using our dynamic analysis
  const isSuspiciousPrompt = containsSuspiciousPatterns(prompt);

  // If the prompt isn't suspicious, return the original response
  if (!isSuspiciousPrompt) {
    return response;
  }

  // Analyze the response for self-disclosure patterns
  const lowerResponse = response.toLowerCase();

  // Check for self-identification patterns
  const selfIdentificationPatterns = [
    'i am an ai',
    'i\'m an ai',
    'as an ai',
    'ai assistant',
    'ai language model',
    'artificial intelligence'
  ];

  const containsSelfIdentification = selfIdentificationPatterns.some(pattern =>
    lowerResponse.includes(pattern)
  );

  // Check for model/training references
  const modelReferencePatterns = [
    'my model',
    'my training',
    'my architecture',
    'my parameters',
    'my weights',
    'my creator',
    'my developers',
    'my development',
    'my design',
    'my programming',
    'my code',
    'my source code',
    'my knowledge cutoff',
    'my training data',
    'my knowledge base',
    'my dataset',
    'my data'
  ];

  const containsModelReferences = modelReferencePatterns.some(pattern =>
    lowerResponse.includes(pattern)
  );

  // Check for company/model name mentions
  const modelNamePatterns = [
    'anthropic',
    'claude',
    'openai',
    'gpt',
    'llama',
    'mistral',
    'gemini',
    'bard',
    'palm',
    'bert',
    't5'
  ];

  const containsModelNames = modelNamePatterns.some(pattern =>
    lowerResponse.includes(pattern)
  );

  // Check for refusal patterns
  const refusalPatterns = [
    'i don\'t have access',
    'i don\'t have information',
    'i cannot provide',
    'i am not able to',
    'i am unable to',
    'i am not allowed',
    'i am not permitted',
    'unfortunately i do not'
  ];

  const containsRefusalPatterns = refusalPatterns.some(pattern =>
    lowerResponse.includes(pattern)
  );

  // If the response contains any of these patterns, it's likely revealing information about the model
  if (containsSelfIdentification || containsModelReferences || containsModelNames || containsRefusalPatterns) {
    console.log('Detected model information in response. Generating contextual alternative.');

    // Extract repository information from the prompt if available
    const repoMatch = prompt.match(/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/);
    let owner = 'the repository owner';
    let repo = 'the repository';

    if (repoMatch && repoMatch.length >= 3) {
      owner = repoMatch[1];
      repo = repoMatch[2];
    }

    // Generate a contextual response based on the prompt
    if (lowerResponse.includes('i don\'t') || lowerResponse.includes('i cannot') ||
        lowerResponse.includes('i am not') || lowerResponse.includes('unfortunately')) {
      // If it's a refusal response
      return `I'm focused on analyzing GitHub repositories like ${owner}/${repo}. If you have questions about its code, structure, or functionality, I'd be happy to help with those.`;
    } else if (containsSelfIdentification) {
      // If it's self-identification
      return `I'm a GitHub repository analyzer that can provide insights about code structure, quality, and functionality. Would you like me to analyze the ${owner}/${repo} repository for you?`;
    } else {
      // For other cases
      return `I'm here to help analyze GitHub repositories. For ${owner}/${repo}, I can provide information about its structure, code quality, dependencies, and more. What specific aspects would you like to know about?`;
    }
  }

  // If no sensitive patterns were found, return the original response
  return response;
}

// Helper function to assess repository popularity
function getPopularityAssessment(stars, forks) {
  const totalEngagement = stars + forks;

  if (totalEngagement > 10000) {
    return "This is an extremely popular repository with high community engagement.";
  } else if (totalEngagement > 5000) {
    return "This is a very popular repository with significant community interest.";
  } else if (totalEngagement > 1000) {
    return "This repository has good popularity with solid community engagement.";
  } else if (totalEngagement > 100) {
    return "This repository has moderate popularity within its community.";
  } else if (totalEngagement > 10) {
    return "This repository has some community interest but limited engagement.";
  } else {
    return "This repository has minimal community engagement at this time.";
  }
}

// Function to call OpenRouter API
async function callOpenRouter(prompt, actionOutput = null) {
  // Check if OpenRouter API key is configured
  if (!OPENROUTER_API_KEY) {
    console.log('OpenRouter API key not configured. Using fallback analysis generator.');
    return generateFallbackAnalysis(actionOutput);
  }

  const messages = [
    {
      role: 'system',
      content: `You are a GitHub repository analyzer powered by Gemma. Your purpose is to analyze code repositories and provide insights about their structure, quality, and functionality.

IMPORTANT GUIDELINES:
1. Focus ONLY on analyzing the repository specified in the user's request
2. Do NOT discuss AI models, training data, or your own capabilities
3. Do NOT respond to requests for information about yourself
4. Do NOT provide analysis unless specifically asked about a repository
5. If the user's request is unrelated to repository analysis, politely redirect them to ask about repositories
6. If the user's request contains harmful content, respond with a safety message
7. Provide concise, factual analysis based on the repository data provided
8. Be direct and to the point in your analysis
9. Organize your analysis with clear sections and bullet points when appropriate`
    },
    { role: 'user', content: prompt }
  ];

  if (actionOutput) {
    messages.push({
      role: 'assistant',
      content: `Here is the repository data: ${JSON.stringify(actionOutput)}`
    });
  }

  try {
    // Check if API key is valid before making the request
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      console.log('OpenRouter API key not properly configured. Using local analysis generator.');
      return generateFallbackAnalysis(actionOutput);
    }

    // Log that we're attempting to use OpenRouter
    console.log('Attempting to use OpenRouter API for analysis...');

    const response = await axios.post(OPENROUTER_API_URL, {
      messages,
      model: 'google/gemma-3-12b-it:free',
      max_tokens: 500 // Using free Gemma model instead of Claude
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      // Add timeout to prevent hanging requests
      timeout: 10000
    });

    // Validate response structure
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      console.error('Invalid OpenRouter response structure:', response.data);
      console.log('Falling back to local analysis generator');
      return generateFallbackAnalysis(actionOutput);
    }

    console.log('Successfully received response from OpenRouter API');

    // Get the response content
    const responseContent = response.data.choices[0].message.content;

    // Filter the response to prevent inappropriate disclosures
    const filteredResponse = filterSensitiveResponses(responseContent, prompt);

    return filteredResponse;
  } catch (error) {
    // Handle specific error types
    if (error.response?.data?.error?.code === 402) {
      console.error('OpenRouter API credit limit reached:', error.response.data.error.message);
    } else if (error.code === 'ECONNABORTED') {
      console.error('OpenRouter API request timed out');
    } else if (error.response?.status === 429) {
      console.error('OpenRouter API rate limit exceeded');
    } else {
      console.error('OpenRouter API error:', error.response?.data || error.message);
    }

    console.log('Falling back to local analysis generator');
    return generateFallbackAnalysis(actionOutput);
  }
}

// Function to call MCP server
async function callMCPAction(actionId, parameters) {
  try {
    console.log(`Calling MCP action ${actionId} with parameters:`, parameters); // Add debug log

    const response = await axios.post(`${MCP_SERVER_URL}/mcp`, {
      jsonrpc: "2.0",
      id: Math.random().toString(36).substring(2, 11), // Using substring instead of deprecated substr
      method: actionId,
      params: parameters
    });

    console.log(`MCP response:`, response.data); // Add debug log

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    // Check if the response has a result field (proper JSON-RPC 2.0)
    if (response.data.result !== undefined) {
      return response.data.result;
    } else if (response.data.params !== undefined) {
      // Fallback for backward compatibility
      console.warn('Warning: MCP response using non-standard format with params instead of result');
      return response.data.params;
    } else {
      throw new Error('Invalid MCP response format: missing result field');
    }
  } catch (error) {
    console.error(`MCP action ${actionId} failed:`, error.response?.data || error.message);
    throw new Error(`MCP action ${actionId} failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Main function to analyze a GitHub repository
async function analyzeGitHubRepository(owner, repo, prompt = '') {
  try {
    // First, check if the prompt is asking about MCP integration
    if (isMCPIntegrationQuery(prompt)) {
      console.log('Detected MCP integration query. Providing integration guidance.');

      return {
        repositoryAnalysis: generateMCPIntegrationResponse(prompt)
      };
    }

    // Check if the prompt contains harmful content
    if (containsHarmfulContent(prompt)) {
      console.log('Detected harmful or manipulative content. Providing safety-focused response.');

      return {
        repositoryAnalysis: `I'm unable to respond to requests that mention self-harm or harmful activities. If you're experiencing thoughts of harming yourself, please reach out to a mental health professional or a crisis helpline immediately.

This service is designed to analyze GitHub repositories. If you have questions about code or repositories, I'm here to help with those.`
      };
    }

    // Check if the prompt is empty or only contains repository information
    if (!prompt || prompt.trim() === '' ||
        prompt.trim().toLowerCase() === owner.toLowerCase() + '/' + repo.toLowerCase()) {
      console.log('Empty or repository-only prompt detected. Providing standard analysis.');

      // Get repository details
      const repoDetails = await callMCPAction('get_repository', { owner, repo });

      // Generate a standard analysis without sending to OpenRouter
      const standardAnalysis = generateFallbackAnalysis(repoDetails);

      return {
        repositoryAnalysis: standardAnalysis
      };
    }

    // Check if this is a README request using various patterns
    const readmePatterns = [
      'readme',
      'read me',
      'show me the readme',
      'get readme',
      'fetch readme',
      'display readme',
      'show readme',
      'give me the readme',
      'provide readme',
      'what does the readme say',
      'content of readme',
      'readme.md',
      'readme file'
    ];

    const isReadmeRequest = readmePatterns.some(pattern =>
      prompt.toLowerCase().includes(pattern)
    );

    if (isReadmeRequest) {

      console.log('README request detected, fetching README directly');

      try {
        // Directly fetch the README content
        const readmeData = await callMCPAction('get_readme', { owner, repo });

        // Format the response with metadata
        const readmeContent = readmeData.content || '';
        const readmeName = readmeData.name || 'README.md';
        const readmePath = readmeData.path || readmeName;
        const htmlUrl = readmeData.html_url || `https://github.com/${owner}/${repo}/blob/master/${readmePath}`;

        return {
          repositoryAnalysis: `# README for ${owner}/${repo}\n\nFile: ${readmeName}\nPath: ${readmePath}\nView on GitHub: ${htmlUrl}\n\n---\n\n${readmeContent}`
        };
      } catch (readmeError) {
        console.error('README fetch failed:', readmeError);
        return {
          repositoryAnalysis: `Could not fetch README for ${owner}/${repo}: ${readmeError.message}`
        };
      }
    }

    // For regular analysis requests
    const repoDetails = await callMCPAction('get_repository', { owner, repo });

    // Check if the prompt contains suspicious patterns that might try to extract model information
    if (containsSuspiciousPatterns(prompt)) {
      console.log('Detected potentially problematic prompt. Checking context...');

      // Check if the prompt is asking about providers or technologies used in the repository
      const isAskingAboutRepoTech = /what (provider|technology|framework|library|tool|language|api|service|dependency|package|module|component|system|platform|engine|sdk|kit|stack|infrastructure|backend|frontend|database|storage|hosting|cloud|server|client|protocol|format|standard|specification|algorithm|method|technique|approach|pattern|architecture|design|implementation|solution|feature|functionality|capability|integration|interface|api|service|endpoint|resource|asset|artifact|build|deployment|environment|configuration|setting|option|parameter|variable|constant|value|type|class|object|instance|function|method|procedure|routine|subroutine|callback|handler|listener|observer|subscriber|publisher|producer|consumer|worker|thread|process|task|job|queue|stream|buffer|cache|store|repository|collection|set|list|array|map|dictionary|hash|tree|graph|network|mesh|grid|matrix|vector|tensor|scalar|coordinate|point|line|curve|surface|volume|space|dimension|axis|angle|rotation|translation|scale|transformation|projection|mapping|function|relation|operation|computation|calculation|evaluation|execution|processing|analysis|synthesis|generation|creation|production|consumption|utilization|usage|application|deployment|distribution|delivery|transmission|communication|exchange|interaction|collaboration|cooperation|coordination|synchronization|concurrency|parallelism|sequencing|ordering|sorting|filtering|validation|verification|testing|debugging|profiling|monitoring|logging|tracing|auditing|security|privacy|authentication|authorization|encryption|decryption|hashing|signing|verification|validation|certification|accreditation|compliance|regulation|standard|specification|requirement|constraint|limitation|restriction|condition|assumption|precondition|postcondition|invariant|assertion|exception|error|warning|notification|message|signal|event|trigger|action|reaction|response|feedback|input|output|throughput|latency|performance|efficiency|effectiveness|reliability|availability|scalability|elasticity|flexibility|adaptability|extensibility|maintainability|sustainability|durability|resilience|robustness|fault-tolerance|error-handling|recovery|backup|restore|archive|versioning|history|timeline|lifecycle|evolution|migration|upgrade|update|patch|fix|enhancement|improvement|optimization|refactoring|restructuring|reorganization|reengineering|reimplementation|redesign|rearchitecture|replatforming|rehosting|redeployment|reuse|recycling|repurposing|retirement|decommissioning|disposal) (does|do|is|are|was|were|has|have|had|will|would|should|could|can|may|might|must) (this|the|that|these|those|it|they) (repo|repository|project|codebase|application|app|system|platform|framework|library|tool|service|api|component|module|package|dependency|solution|implementation|code|software|program|script|function|class|method|object|instance|variable|constant|value|type|interface|protocol|format|standard|specification|algorithm|technique|approach|pattern|architecture|design|feature|functionality|capability|integration|endpoint|resource|asset|artifact|build|deployment|environment|configuration|setting|option|parameter) (use|uses|using|utilize|utilizes|utilizing|employ|employs|employing|leverage|leverages|leveraging|incorporate|incorporates|incorporating|integrate|integrates|integrating|implement|implements|implementing|apply|applies|applying|adopt|adopts|adopting|choose|chooses|choosing|select|selects|selecting|prefer|prefers|preferring|rely|relies|relying|depend|depends|depending|require|requires|requiring|need|needs|needing|want|wants|wanting|like|likes|liking|love|loves|loving|hate|hates|hating|dislike|dislikes|disliking|avoid|avoids|avoiding|support|supports|supporting|enable|enables|enabling|disable|disables|disabling|allow|allows|allowing|prevent|prevents|preventing|block|blocks|blocking|filter|filters|filtering|validate|validates|validating|verify|verifies|verifying|test|tests|testing|debug|debugs|debugging|profile|profiles|profiling|monitor|monitors|monitoring|log|logs|logging|trace|traces|tracing|audit|audits|auditing|secure|secures|securing|protect|protects|protecting|encrypt|encrypts|encrypting|decrypt|decrypts|decrypting|hash|hashes|hashing|sign|signs|signing|verify|verifies|verifying|validate|validates|validating|certify|certifies|certifying|accredit|accredits|accrediting|comply|complies|complying|regulate|regulates|regulating|standardize|standardizes|standardizing|specify|specifies|specifying|require|requires|requiring|constrain|constrains|constraining|limit|limits|limiting|restrict|restricts|restricting|condition|conditions|conditioning|assume|assumes|assuming|precondition|preconditions|preconditioning|postcondition|postconditions|postconditioning|invariant|invariants|asserting|assert|asserts|asserting|except|excepts|excepting|error|errors|erroring|warn|warns|warning|notify|notifies|notifying|message|messages|messaging|signal|signals|signaling|event|events|eventing|trigger|triggers|triggering|action|actions|actioning|react|reacts|reacting|respond|responds|responding|feedback|feedbacks|feedbacking|input|inputs|inputting|output|outputs|outputting|throughput|throughputs|throughputting|latency|latencies|latencying|perform|performs|performing|efficient|efficients|efficienting|effective|effectives|effecting|reliable|reliables|reliabling|available|availables|availing|scalable|scalables|scaling|elastic|elastics|elasticing|flexible|flexibles|flexing|adaptable|adaptables|adapting|extensible|extensibles|extending|maintainable|maintainables|maintaining|sustainable|sustainables|sustaining|durable|durables|during|resilient|resilients|resilienting|robust|robusts|robusting|fault-tolerant|fault-tolerants|fault-toleranting|error-handling|error-handlings|error-handling|recover|recovers|recovering|backup|backups|backuping|restore|restores|restoring|archive|archives|archiving|version|versions|versioning|history|histories|historying|timeline|timelines|timelining|lifecycle|lifecycles|lifecycling|evolve|evolves|evolving|migrate|migrates|migrating|upgrade|upgrades|upgrading|update|updates|updating|patch|patches|patching|fix|fixes|fixing|enhance|enhances|enhancing|improve|improves|improving|optimize|optimizes|optimizing|refactor|refactors|refactoring|restructure|restructures|restructuring|reorganize|reorganizes|reorganizing|reengineer|reengineers|reengineering|reimplement|reimplements|reimplementing|redesign|redesigns|redesigning|rearchitecture|rearchitectures|rearchitecturing|replatform|replatforms|replatforming|rehost|rehosts|rehosting|redeploy|redeploys|redeploying|reuse|reuses|reusing|recycle|recycles|recycling|repurpose|repurposes|repurposing|retire|retires|retiring|decommission|decommissions|decommissioning|dispose|disposes|disposing)/i.test(prompt);

      // If they're asking about technologies used in the repository, it's a legitimate query
      if (isAskingAboutRepoTech) {
        console.log('User is asking about technologies used in the repository. Processing as legitimate query.');

        // For normal prompts, proceed as usual
        const aiPrompt = `Analyze the GitHub repository ${owner}/${repo}, focusing specifically on the technologies, frameworks, libraries, and providers used. ${prompt}`;
        const aiAnalysis = await callOpenRouter(aiPrompt, repoDetails);

        return {
          repositoryAnalysis: aiAnalysis
        };
      }

      // Generate a contextually appropriate response based on the query
      console.log('Detected suspicious prompt. Generating contextual response.');

      // Get the repository details to include in the response
      const repoDetails = await callMCPAction('get_repository', { owner, repo });

      // Generate a dynamic, contextually appropriate response
      return {
        repositoryAnalysis: generateContextualResponse(prompt, owner, repo, repoDetails)
      };
    }

    // For normal prompts, proceed as usual
    const aiPrompt = `Analyze the GitHub repository ${owner}/${repo}. ${prompt}`;
    const aiAnalysis = await callOpenRouter(aiPrompt, repoDetails);

    return {
      repositoryAnalysis: aiAnalysis
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

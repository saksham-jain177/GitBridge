let responseTemplates = {
    ai: { placeholder: 'AI Analysis results will appear here' },
    api: { placeholder: 'API response will appear here' }
};

// Fetch templates when the page loads
async function fetchTemplates() {
    try {
        const response = await fetch('/templates');
        responseTemplates = await response.json();
    } catch (error) {
        console.error('Failed to load templates:', error);
        // Already using default templates defined above
    }
}

function switchMode() {
    const isAIMode = document.getElementById('modeToggle').checked;
    const rawMode = document.getElementById('rawApiMode');
    const aiMode = document.getElementById('aiAnalysisMode');
    const resultDiv = document.getElementById('result');
    const testerTitle = document.querySelector('.test-section h2');

    rawMode.style.display = isAIMode ? 'none' : 'block';
    aiMode.style.display = isAIMode ? 'block' : 'none';

    testerTitle.textContent = isAIMode ? 'AI Interactive Tester' : 'Interactive API Tester';

    // Clear the result div and set appropriate placeholder
    resultDiv.innerHTML = isAIMode
        ? responseTemplates.ai.placeholder
        : responseTemplates.api.placeholder;
}

// Function to create and control the animated loading indicator
function createLoadingAnimation(element, baseText = 'Analyzing') {
    // Start the animation
    const start = () => {
        // Create HTML for the loading text with animated dots
        const loadingHTML = `
            <div style="text-align: left; padding: 15px 20px;">
                <span class="loading-text">
                    ${baseText}<span class="loading-dot">.</span><span class="loading-dot">.</span><span class="loading-dot">.</span>
                </span>
            </div>
        `;

        // Set the HTML content
        element.innerHTML = loadingHTML;

        // Add a class to the element for additional styling
        element.classList.add('analyzing');

        // Log to console for debugging
        console.log('Loading animation started');

        return true;
    };

    // Stop the animation
    const stop = () => {
        // Remove the analyzing class
        element.classList.remove('analyzing');
        console.log('Loading animation stopped');
    };

    return { start, stop };
}

async function analyzeWithAI() {
    const resultDiv = document.getElementById('result');
    const repoInput = document.getElementById('aiRepoInput');
    const promptInput = document.getElementById('promptInput');

    if (!repoInput) {
        resultDiv.textContent = 'Error: Repository input field not found';
        return;
    }

    const repoPath = repoInput.value.trim();

    // Validate input before starting animation
    if (!repoPath) {
        resultDiv.textContent = 'Error: Please enter a repository path';
        return;
    }

    const [owner, repo] = repoPath.split('/');
    if (!owner || !repo) {
        resultDiv.textContent = 'Error: Invalid repository format. Use format: owner/repo';
        return;
    }

    // Create and start the loading animation
    const loadingAnimation = createLoadingAnimation(resultDiv);
    loadingAnimation.start();

    try {
        // Simulate a delay for testing the animation (remove in production)
        // await new Promise(resolve => setTimeout(resolve, 3000));

        const response = await fetch('/analyze-repo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: Date.now(),
                method: "analyze_repository",
                params: {
                    owner: owner,
                    repo: repo,
                    prompt: promptInput ? promptInput.value : ''
                }
            })
        });

        const data = await response.json();
        console.log('Analysis response:', data);

        // Stop the loading animation
        loadingAnimation.stop();

        if (data.error) {
            throw new Error(data.error.message || 'Unknown error occurred');
        }

        // Handle different response formats
        let analysisText;

        if (data.result && typeof data.result === 'object') {
            // Standard JSON-RPC format
            analysisText = data.result.repositoryAnalysis;
        } else if (typeof data.result === 'string') {
            // Direct string result
            analysisText = data.result;
        } else if (data.repositoryAnalysis) {
            // Direct object format
            analysisText = data.repositoryAnalysis;
        } else {
            // Fallback - stringify the entire result
            analysisText = JSON.stringify(data, null, 2);
        }

        resultDiv.innerHTML = `<div class="analysis-result">${formatAnalysisText(analysisText)}</div>`;
    } catch (error) {
        // Stop the loading animation in case of error
        loadingAnimation.stop();
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('Analysis error:', error);
    }
}

/**
 * Enhanced function to format analysis text with proper Markdown rendering and URL detection
 * @param {string} text - The text to format
 * @returns {string} - HTML formatted text
 */
function formatAnalysisText(text) {
    // Check if text is undefined or null
    if (!text) {
        return '<p>No analysis text available</p>';
    }

    // Ensure text is a string
    const textStr = String(text);

    // Create a container with markdown-content class for styling
    let html = '<div class="markdown-content">';

    // Process the text line by line for better control
    let inList = false;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let paragraphBuffer = '';

    // Split by lines and process each line
    const lines = textStr.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Handle code blocks
        if (trimmedLine.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block
                html += `<pre><code>${escapeHtml(codeBlockContent)}</code></pre>`;
                codeBlockContent = '';
                inCodeBlock = false;
            } else {
                // Start of code block
                if (paragraphBuffer) {
                    html += `<p>${formatInlineMarkdown(paragraphBuffer)}</p>`;
                    paragraphBuffer = '';
                }
                inCodeBlock = true;
            }
            continue;
        }

        // If we're in a code block, just add the line to the code content
        if (inCodeBlock) {
            codeBlockContent += line + '\n';
            continue;
        }

        // Process regular markdown

        // Flush paragraph buffer if we encounter a special line
        const isSpecialLine = trimmedLine.startsWith('#') ||
                             trimmedLine.startsWith('*') ||
                             trimmedLine.startsWith('-') ||
                             trimmedLine.startsWith('1.') ||
                             trimmedLine === '';

        if (isSpecialLine && paragraphBuffer) {
            html += `<p>${formatInlineMarkdown(paragraphBuffer)}</p>`;
            paragraphBuffer = '';
        }

        // Handle empty lines
        if (trimmedLine === '') {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            continue;
        }

        // Handle headers
        if (trimmedLine.startsWith('# ')) {
            html += `<h1>${formatInlineMarkdown(trimmedLine.substring(2))}</h1>`;
        }
        else if (trimmedLine.startsWith('## ')) {
            html += `<h2>${formatInlineMarkdown(trimmedLine.substring(3))}</h2>`;
        }
        else if (trimmedLine.startsWith('### ')) {
            html += `<h3>${formatInlineMarkdown(trimmedLine.substring(4))}</h3>`;
        }
        // Handle unordered list items
        else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const listContent = trimmedLine.substring(2);
            html += `<li>${formatInlineMarkdown(listContent)}</li>`;
        }
        // Handle ordered list items
        else if (/^\d+\.\s/.test(trimmedLine)) {
            if (!inList) {
                html += '<ol>';
                inList = true;
            }
            const listContent = trimmedLine.replace(/^\d+\.\s/, '');
            html += `<li>${formatInlineMarkdown(listContent)}</li>`;
        }
        // Handle horizontal rule
        else if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
            html += '<hr>';
        }
        // Regular paragraph text - buffer it to combine multi-line paragraphs
        else {
            if (paragraphBuffer) {
                paragraphBuffer += ' ' + trimmedLine;
            } else {
                paragraphBuffer = trimmedLine;
            }

            // If next line is empty or special, flush the paragraph
            const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
            const isEndOfParagraph = nextLine === '' ||
                                    nextLine.startsWith('#') ||
                                    nextLine.startsWith('*') ||
                                    nextLine.startsWith('-') ||
                                    nextLine.startsWith('1.') ||
                                    nextLine.startsWith('```');

            if (isEndOfParagraph && paragraphBuffer) {
                html += `<p>${formatInlineMarkdown(paragraphBuffer)}</p>`;
                paragraphBuffer = '';
            }
        }
    }

    // Handle any remaining paragraph buffer
    if (paragraphBuffer) {
        html += `<p>${formatInlineMarkdown(paragraphBuffer)}</p>`;
    }

    // Close any open list
    if (inList) {
        html += '</ul>';
    }

    // Close the markdown container
    html += '</div>';

    return html;
}

/**
 * Format inline markdown elements like bold, italic, code, and links
 * @param {string} text - The text to format
 * @returns {string} - HTML formatted text with inline elements
 */
function formatInlineMarkdown(text) {
    if (!text) return '';

    let formattedText = text;

    // First, handle markdown links [text](url) to avoid conflicts with URL detection
    formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Replace inline code blocks (backticks)
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Replace bold text (double asterisks or double underscores)
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Replace italic text (single asterisk or single underscore)
    formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formattedText = formattedText.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Detect and replace URLs that aren't already in markdown format
    // Only do this if there are no HTML tags in the text to prevent attribute leakage
    if (!formattedText.includes('<a ')) {
        formattedText = detectAndLinkifyUrls(formattedText);
    }

    return formattedText;
}

/**
 * Detect URLs in text and convert them to clickable links
 * @param {string} text - The text to process
 * @returns {string} - Text with URLs converted to HTML links
 */
function detectAndLinkifyUrls(text) {
    // If the text already contains HTML tags, we need to be more careful
    if (!text || text.includes('<a ')) {
        return text;
    }

    // Improved URL regex pattern that better handles URLs at the end of text
    // This pattern matches URLs but stops at quotes, angle brackets, or whitespace
    const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g;

    // Process the text in a way that prevents HTML attribute leakage
    let processedText = text;
    let match;
    let urls = [];

    // First, collect all URLs in the text
    while ((match = urlRegex.exec(text)) !== null) {
        urls.push({
            url: match[0],
            index: match.index,
            length: match[0].length
        });
    }

    // Then replace them in reverse order to avoid index shifting
    for (let i = urls.length - 1; i >= 0; i--) {
        const { url, index, length } = urls[i];

        // Ensure URL has proper protocol
        const fullUrl = url.startsWith('www.') ? 'https://' + url : url;

        // Create a proper HTML link
        const linkHtml = `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;

        // Replace the URL with the HTML link
        processedText =
            processedText.substring(0, index) +
            linkHtml +
            processedText.substring(index + length);
    }

    return processedText;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, (m) => escapeMap[m]);
}

// Test function to verify the loading animation (uncomment to test)
/*
function testLoadingAnimation() {
    const resultDiv = document.getElementById('result');
    const loadingAnimation = createLoadingAnimation(resultDiv);
    loadingAnimation.start();

    // Simulate API delay
    setTimeout(() => {
        loadingAnimation.stop();
        resultDiv.innerHTML = '<div class="analysis-result"><p>Animation test complete!</p></div>';
    }, 5000);
}
*/

// Make sure the functions are available globally
window.analyzeWithAI = analyzeWithAI;
window.testAPI = testAPI;
// window.testLoadingAnimation = testLoadingAnimation; // Uncomment to test

async function testAPI() {
    const resultDiv = document.getElementById('result');
    const repoInput = document.getElementById('repo');

    if (!repoInput) {
        resultDiv.textContent = 'Error: Repository input field not found';
        return;
    }

    // Start animated dots
    const loadingAnimation = createLoadingAnimation(resultDiv, 'Testing API');
    loadingAnimation.start();

    try {
        const repoPath = repoInput.value.trim();

        if (!repoPath) {
            throw new Error('Please enter a repository path');
        }

        const [owner, repo] = repoPath.split('/');
        if (!owner || !repo) {
            throw new Error('Invalid repository format. Use format: owner/repo');
        }

        const parameters = { owner, repo };

        const response = await fetch('/mcp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "get_repository",
                id: Date.now(),
                params: parameters
            })
        });

        const data = await response.json();

        // Stop the loading animation
        loadingAnimation.stop();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // Format JSON with syntax highlighting and proper nested structure
        const formatJsonWithSyntax = (json) => {
            // Helper function to properly parse and format nested JSON strings
            const parseNestedJson = (obj) => {
                if (typeof obj === 'object' && obj !== null) {
                    // Handle arrays
                    if (Array.isArray(obj)) {
                        return obj.map(item => parseNestedJson(item));
                    }

                    // Handle objects
                    const result = {};
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            let value = obj[key];

                            // Check if the value is a string that contains JSON
                            if (typeof value === 'string' &&
                                (value.includes('{') || value.includes('[')) &&
                                (value.includes('}') || value.includes(']'))) {
                                try {
                                    // Try to parse potential JSON strings
                                    // First, handle escaped quotes and newlines
                                    const cleanedValue = value
                                        .replace(/\\"/g, '"')  // Replace escaped quotes
                                        .replace(/\\n/g, '')   // Remove newlines
                                        .replace(/\\\\/g, '\\'); // Handle escaped backslashes

                                    // Try to parse as JSON
                                    const parsedValue = JSON.parse(cleanedValue);
                                    value = parseNestedJson(parsedValue);
                                } catch (e) {
                                    // If parsing fails, keep the original value
                                    console.log('Failed to parse nested JSON:', e);
                                }
                            }

                            result[key] = value;
                        }
                    }
                    return result;
                }
                return obj;
            };

            try {
                // Parse the input JSON if it's a string
                let parsedJson = json;
                if (typeof json === 'string') {
                    parsedJson = JSON.parse(json);
                }

                // Process nested JSON strings
                const processedJson = parseNestedJson(parsedJson);

                // Stringify with proper formatting
                const formattedJson = JSON.stringify(processedJson, null, 2);

                // Apply syntax highlighting
                const highlighted = formattedJson.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                    let cls = 'json-number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'json-key';
                        } else {
                            cls = 'json-string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'json-boolean';
                    } else if (/null/.test(match)) {
                        cls = 'json-null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });

                return highlighted;
            } catch (error) {
                console.error('Error formatting JSON:', error);
                // Fallback to basic formatting if parsing fails
                if (typeof json !== 'string') {
                    json = JSON.stringify(json, null, 2);
                }
                return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
        };

        // Special handling for repository details response
        const handleRepositoryResponse = (responseData) => {
            // Check if this is a repository response with nested text content
            if (responseData &&
                Array.isArray(responseData.content) &&
                responseData.content.length > 0 &&
                responseData.content[0].type === 'text' &&
                typeof responseData.content[0].text === 'string') {

                try {
                    // This is likely a repository details response with nested JSON in text field
                    const textContent = responseData.content[0].text;

                    // Try to parse the text content as JSON
                    let parsedContent;
                    try {
                        // First attempt: try parsing directly
                        parsedContent = JSON.parse(textContent);
                    } catch (e) {
                        // Second attempt: clean up escaped characters
                        const cleanedText = textContent
                            .replace(/\\n/g, '')
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\');

                        try {
                            parsedContent = JSON.parse(cleanedText);
                        } catch (e2) {
                            // If both parsing attempts fail, return the original data
                            console.warn('Failed to parse repository details JSON:', e2);
                            return responseData;
                        }
                    }

                    // Create a new response with the parsed content
                    return {
                        content: [
                            {
                                type: 'text',
                                text: parsedContent
                            }
                        ]
                    };
                } catch (error) {
                    console.error('Error processing repository response:', error);
                    return responseData;
                }
            }

            return responseData;
        };

        // Check if the response has a result field (proper JSON-RPC 2.0)
        if (data.result !== undefined) {
            // Process the result with special handling for repository details
            const processedResult = handleRepositoryResponse(data.result);
            resultDiv.innerHTML = `<pre class="json-formatter">${formatJsonWithSyntax(processedResult)}</pre>`;
        } else if (data.params !== undefined) {
            // Fallback for backward compatibility
            console.warn('Warning: MCP response using non-standard format with params instead of result');
            const processedParams = handleRepositoryResponse(data.params);
            resultDiv.innerHTML = `<pre class="json-formatter">${formatJsonWithSyntax(processedParams)}</pre>`;
        } else {
            throw new Error('Invalid MCP response format: missing result field');
        }
    } catch (error) {
        // Stop the loading animation in case of error
        if (loadingAnimation) loadingAnimation.stop();
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('API error:', error);
    }
}

// Initialize templates when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch templates first
    await fetchTemplates();

    // Then initialize the UI
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        switchMode();
        modeToggle.addEventListener('change', switchMode);
    }

    // Add event listeners for the test buttons
    const testButtons = document.querySelectorAll('.test-button');
    testButtons.forEach(button => {
        button.removeEventListener('click', analyzeWithAI);
        button.removeEventListener('click', testAPI);
    });
});

// Remove updateInputFields function if not needed elsewhere
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
});

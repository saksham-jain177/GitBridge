let responseTemplates;

// Fetch templates when the page loads
async function fetchTemplates() {
    try {
        const response = await fetch('/templates');
        responseTemplates = await response.json();
    } catch (error) {
        console.error('Failed to load templates:', error);
        // Fallback to basic templates if fetch fails
        responseTemplates = {
            ai: { placeholder: 'AI Analysis results will appear here' },
            api: { placeholder: 'API response will appear here' }
        };
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
    
    resultDiv.textContent = isAIMode 
        ? responseTemplates.ai.placeholder 
        : responseTemplates.api.placeholder;
}

async function analyzeWithAI() {
    const resultDiv = document.getElementById('result');
    const repoPath = document.getElementById('repoInput').value;
    
    try {
        resultDiv.textContent = 'Analyzing...';
        
        // Validate repo format
        const [owner, repo] = repoPath.split('/');
        if (!owner || !repo) {
            throw new Error('Invalid repository format. Use format: owner/repo');
        }

        const response = await fetch('/analyze-repo', {
            method: 'POST',  // Ensure this is POST
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                owner, 
                repo,
                prompt: document.getElementById('promptInput')?.value || ''
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Analysis failed');
        }

        const data = await response.json();
        resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('Analysis error:', error);
    }
}

async function testAPI() {
    const resultDiv = document.getElementById('result');
    const endpoint = document.getElementById('endpointInput').value;
    
    resultDiv.textContent = 'Testing API...';
    
    try {
        // Rate limiting check
        if (!checkRateLimit()) {
            resultDiv.textContent = 'Rate limit exceeded. Please try again later.';
            return;
        }

        const response = await fetch(endpoint);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || response.statusText);
        }

        const data = await response.json();
        resultDiv.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
    }
}

// Initialize templates when page loads
document.addEventListener('DOMContentLoaded', fetchTemplates);

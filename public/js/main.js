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
    const prompt = document.getElementById('promptInput').value;
    
    resultDiv.textContent = 'Analyzing...';
    
    try {
        // Rate limiting check
        if (!checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        const [owner, repo] = repoPath.split('/');
        if (!owner || !repo) {
            throw new Error('Invalid repository format. Use format: owner/repo');
        }

        const response = await fetch('/analyze-repo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                owner: owner,
                repo: repo,
                prompt: prompt
            })
        });
        
        const data = await response.json();
        resultDiv.textContent = data.analysis;
        
    } catch (error) {
        resultDiv.textContent = 'Error: ' + error.message;
    }
}

// Initialize templates when page loads
document.addEventListener('DOMContentLoaded', fetchTemplates);

const responseTemplates = {
    ai: {
        placeholder: `AI Analysis results will appear here after clicking "Analyze"

Example response format:
{
    "analysis": {
        "repository_overview": "...",
        "code_quality": "...",
        "activity_metrics": "...",
        "recommendations": "..."
    }
}`
    },
    api: {
        placeholder: `API response will appear here after clicking "Test API"

Example response format:
{
    "status": "success",
    "data": {
        // Repository details or search results
    }
}`
    }
};

module.exports = responseTemplates;
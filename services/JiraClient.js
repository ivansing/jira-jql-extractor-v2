const axios = require('axios');

/**
 * Jira API client for executing queries
 */
class JiraClient {
    constructor(config) {
        this.config = config;
        this.axios = axios.create({
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            }
        });
    }

    /**
     * Execute JQL query
     * @param {string} jql - JQL query string
     * @param {object} options - Query options
     * @returns {Promise<object>} API response data
     */
    async executeQuery(jql, options = {}) {
        const requestBody = {
            jql,
            maxResults: options.maxResults || 100,
            startAt: options.startAt || 0,
            fieldsByKeys: true,
            fields: options.fields || [
                'summary',
                'status',
                'assignee',
                'reporter',
                'created',
                'updated',
                'priority',
                'issuetype'
            ]
        };

        try {
            const response = await this.axios.post(
                this.config.getApiUrl(),
                requestBody
            );
            
            return response.data;
            
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Search issues by fix version
     * @param {string} fixVersion - Fix version to search
     * @returns {Promise<object>} Search results
     */
    async searchByFixVersion(fixVersion) {
        const jql = `fixVersion = "${fixVersion}"`;
        console.log(`Executing JQL query: ${jql}`);
        
        const results = await this.executeQuery(jql, { maxResults: 500 });
        console.log(`Query successful. Found ${results.total} issues.`);
        
        return results;
    }

    /**
     * Handle API errors with detailed messages
     * @param {Error} error - Axios error object
     * @returns {Error} Formatted error
     * @private
     */
    _handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.errorMessages?.[0] || error.response.statusText;
            
            const errorMessages = {
                401: 'Authentication failed. Check your API key.',
                403: 'Access denied. Insufficient permissions.',
                404: 'Jira instance not found. Check your URL.',
                429: 'Rate limit exceeded. Please try again later.'
            };
            
            return new Error(errorMessages[status] || `API Error ${status}: ${message}`);
        }
        
        if (error.request) {
            return new Error('Network error. Check your internet connection and Jira URL.');
        }
        
        return new Error(`Request setup error: ${error.message}`);
    }
}

module.exports = JiraClient;
// Configuration management with validation
class Config {
    constructor() {
        this.jiraUrl = null;
        this.apiKey = null;
        this.fixVersion = null;
    }

    /**
     * Load configuration from command line arguments
     * @param {string[]} args - Command line arguments
     * @returns {Config} Configuration instance
     */
    static fromArgs(args = process.argv.slice(2)) {
        const config = new Config();
        
        if (args.length < 2) {
            throw new Error(
                'Usage: node index.js <jira-url> <fix-version> [api-key]\n' +
                'API key can be provided via JIRA_API_TOKEN env variable\n' +
                'Example: node index.js https://your-domain.atlassian.net "1.0.0"'
            );
        }

        config.jiraUrl = args[0].replace(/\/$/, '');
        config.fixVersion = args[1];
        config.apiKey = args[2] || process.env.JIRA_API_TOKEN;

        config.validate();
        return config;
    }

    /**
     * Validate configuration parameters
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.jiraUrl || !this.jiraUrl.includes('atlassian.net')) {
            throw new Error('Invalid Jira URL. Must be an Atlassian domain.');
        }

        if (!this.apiKey || this.apiKey.length < 10) {
            throw new Error('Invalid API key. Provide via argument or JIRA_API_TOKEN environment variable.');
        }

        if (!this.fixVersion || !this.fixVersion.trim()) {
            throw new Error('Fix version cannot be empty.');
        }
    }

    /**
     * Get API endpoint URL
     * @returns {string} Full API URL
     */
    getApiUrl() {
        return `${this.jiraUrl}/rest/api/3/search/jql`;
    }
}

module.exports = Config;
const fs = require('fs').promises;
const path = require('path');

/**
 * HTML report generator for Jira issues
 */
class ReportGenerator {
    constructor(config) {
        this.config = config;
    }

    /**
     * Generate HTML report from Jira data
     * @param {object} data - Jira API response data
     * @returns {Promise<string>} Generated file path
     */
    async generate(data) {
        const htmlContent = this._buildHTML(data);
        const filepath = await this._saveToFile(htmlContent);
        return filepath;
    }

    /**
     * Build HTML content
     * @param {object} data - Jira data
     * @returns {string} HTML content
     * @private
     */
    _buildHTML(data) {
        const timestamp = new Date().toISOString();
        const issueRows = this._generateIssueRows(data.issues || []);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jira Issues - Fix Version: ${this._escapeHtml(this.config.fixVersion)}</title>
    ${this._getStyles()}
</head>
<body>
    <div class="container">
        ${this._getHeader()}
        ${this._getSummary(data.total)}
        ${this._getTable(issueRows)}
        ${this._getFooter(timestamp)}
    </div>
</body>
</html>`;
    }

    /**
     * Generate table rows for issues
     * @param {Array} issues - Array of Jira issues
     * @returns {string} HTML table rows
     * @private
     */
    _generateIssueRows(issues) {
        if (!issues.length) {
            return '<tr><td colspan="8" class="no-data">No issues found for this fix version</td></tr>';
        }

        return issues.map(issue => {
            const fields = issue.fields || {};
            return `
                <tr>
                    <td><a href="${this.config.jiraUrl}/browse/${issue.key}" target="_blank">${issue.key}</a></td>
                    <td>${this._escapeHtml(fields.summary || 'N/A')}</td>
                    <td><span class="status-${this._getStatusClass(fields.status?.name)}">${fields.status?.name || 'Unknown'}</span></td>
                    <td>${this._escapeHtml(fields.assignee?.displayName || 'Unassigned')}</td>
                    <td>${fields.priority?.name || 'None'}</td>
                    <td>${fields.issuetype?.name || 'Unknown'}</td>
                    <td>${this._formatDate(fields.created)}</td>
                    <td>${this._formatDate(fields.updated)}</td>
                </tr>`;
        }).join('');
    }

    /**
     * Get header HTML
     * @private
     */
    _getHeader() {
        return `
        <div class="header">
            <h1>Jira Issues Report</h1>
            <div class="subtitle">Fix Version: ${this._escapeHtml(this.config.fixVersion)}</div>
        </div>`;
    }

    /**
     * Get summary section HTML
     * @private
     */
    _getSummary(total) {
        return `
        <div class="summary">
            <div class="summary-item">
                <span class="number">${total}</span>
                <span class="label">Total Issues</span>
            </div>
            <div class="summary-item">
                <span class="number">${this._escapeHtml(this.config.fixVersion)}</span>
                <span class="label">Fix Version</span>
            </div>
            <div class="summary-item">
                <span class="number">${new Date().toLocaleDateString()}</span>
                <span class="label">Generated</span>
            </div>
        </div>`;
    }

    /**
     * Get table HTML
     * @private
     */
    _getTable(rows) {
        return `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Issue Key</th>
                        <th>Summary</th>
                        <th>Status</th>
                        <th>Assignee</th>
                        <th>Priority</th>
                        <th>Type</th>
                        <th>Created</th>
                        <th>Updated</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>`;
    }

    /**
     * Get footer HTML
     * @private
     */
    _getFooter(timestamp) {
        return `
        <div class="footer">
            Generated on ${timestamp} | Jira Data Extraction Tool
        </div>`;
    }

    /**
     * Get CSS styles
     * @private
     */
    _getStyles() {
        return `<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #0052cc, #0065ff);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e1e5e9;
        }
        
        .summary-item {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .summary-item .number {
            font-size: 2.5em;
            font-weight: bold;
            color: #0052cc;
            display: block;
        }
        
        .summary-item .label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .table-container {
            padding: 0;
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        th {
            background: #f1f3f4;
            color: #333;
            font-weight: 600;
            padding: 15px 12px;
            text-align: left;
            border-bottom: 2px solid #e1e5e9;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #e1e5e9;
            vertical-align: top;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 40px !important;
        }
        
        a {
            color: #0052cc;
            text-decoration: none;
            font-weight: 500;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .status-to-do, .status-open { background: #dfe1e6; color: #42526e; }
        .status-in-progress { background: #0052cc; color: white; }
        .status-done, .status-closed { background: #00875a; color: white; }
        
        [class*="status-"] {
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
        }
        
        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            border-top: 1px solid #e1e5e9;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            body { padding: 10px; }
            .header h1 { font-size: 2em; }
            .summary { grid-template-columns: 1fr; }
            table { font-size: 12px; }
            th, td { padding: 8px; }
        }
    </style>`;
    }

    /**
     * Save HTML content to file
     * @param {string} content - HTML content
     * @returns {Promise<string>} File path
     * @private
     */
    async _saveToFile(content) {
        const safeVersion = this.config.fixVersion.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `jira-issues-${safeVersion}-${Date.now()}.html`;
        const filepath = path.join(process.cwd(), 'reports', filename);
        
        // Ensure reports directory exists
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        
        await fs.writeFile(filepath, content, 'utf8');
        
        console.log(`Report generated successfully: ${filename}`);
        console.log(`File location: ${filepath}`);
        
        return filepath;
    }

    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     * @private
     */
    _formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Get status class name for styling
     * @param {string} status - Status name
     * @returns {string} CSS class name
     * @private
     */
    _getStatusClass(status) {
        if (!status) return 'unknown';
        return status.toLowerCase().replace(/\s+/g, '-');
    }
}

module.exports = ReportGenerator;
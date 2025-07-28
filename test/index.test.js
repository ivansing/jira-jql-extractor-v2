const Config = require('../config');
const JiraClient = require('../services/JiraClient');
const ReportGenerator = require('../services/ReportGenerator');
const fs = require('fs').promises;
const path = require('path');

/**
 * Test runner with enhanced capabilities
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.beforeEach = null;
        this.afterEach = null;
    }

    /**
     * Register a test case
     */
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Set up function to run before each test
     */
    setBeforeEach(fn) {
        this.beforeEach = fn;
    }

    /**
     * Set up function to run after each test
     */
    setAfterEach(fn) {
        this.afterEach = fn;
    }

    /**
     * Assertion helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Deep equality assertion
     */
    assertEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(
                message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
            );
        }
    }

    /**
     * Run all tests
     */
    async run() {
        console.log('Running Jira Extractor Test Suite\n');
        console.log('='.repeat(50));

        for (const { name, testFn } of this.tests) {
            try {
                if (this.beforeEach) await this.beforeEach();
                await testFn();
                if (this.afterEach) await this.afterEach();
                
                console.log(`✓ ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`✗ ${name}: ${error.message}`);
                this.failed++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`Tests passed: ${this.passed}`);
        console.log(`Tests failed: ${this.failed}`);
        console.log(`Total: ${this.tests.length}`);

        if (this.failed > 0) {
            process.exit(1);
        }
    }
}

// Initialize test runner
const runner = new TestRunner();

// Store original values
let originalArgv;
let originalEnv;
let originalExit;

runner.setBeforeEach(() => {
    originalArgv = process.argv;
    originalEnv = { ...process.env };
    originalExit = process.exit;
    process.exit = (code) => { throw new Error(`EXIT_${code}`); };
});

runner.setAfterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    process.exit = originalExit;
});

// Configuration tests
runner.test('Config: Valid configuration from args', () => {
    process.argv = ['node', 'test.js', 'https://test.atlassian.net', '1.0.0', 'test-api-key'];
    
    const config = Config.fromArgs();
    runner.assert(config.jiraUrl === 'https://test.atlassian.net', 'Should set Jira URL');
    runner.assert(config.fixVersion === '1.0.0', 'Should set fix version');
    runner.assert(config.apiKey === 'test-api-key', 'Should set API key');
});

runner.test('Config: Use environment variable for API key', () => {
    process.env.JIRA_API_TOKEN = 'env-api-key';
    process.argv = ['node', 'test.js', 'https://test.atlassian.net', '1.0.0'];
    
    const config = Config.fromArgs();
    runner.assert(config.apiKey === 'env-api-key', 'Should use env variable');
});

runner.test('Config: CLI overrides environment variable', () => {
    process.env.JIRA_API_TOKEN = 'env-api-key';
    process.argv = ['node', 'test.js', 'https://test.atlassian.net', '1.0.0', 'cli-api-key'];
    
    const config = Config.fromArgs();
    runner.assert(config.apiKey === 'cli-api-key', 'Should prefer CLI argument');
});

runner.test('Config: Missing arguments throws error', () => {
    process.argv = ['node', 'test.js'];
    
    try {
        Config.fromArgs();
        runner.assert(false, 'Should throw error for missing arguments');
    } catch (error) {
        runner.assert(error.message.includes('Usage:'), 'Should show usage message');
    }
});

runner.test('Config: Invalid Jira URL throws error', () => {
    process.argv = ['node', 'test.js', 'https://invalid.com', '1.0.0', 'test-key'];
    
    try {
        Config.fromArgs();
        runner.assert(false, 'Should throw error for invalid URL');
    } catch (error) {
        runner.assert(error.message.includes('Invalid Jira URL'), 'Should validate URL');
    }
});

runner.test('Config: Missing API key throws error', () => {
    delete process.env.JIRA_API_TOKEN;
    process.argv = ['node', 'test.js', 'https://test.atlassian.net', '1.0.0'];
    
    try {
        Config.fromArgs();
        runner.assert(false, 'Should throw error for missing API key');
    } catch (error) {
        runner.assert(error.message.includes('Invalid API key'), 'Should validate API key');
    }
});

runner.test('Config: Empty fix version throws error', () => {
    process.env.JIRA_API_TOKEN = 'test-api-key';
    process.argv = ['node', 'test.js', 'https://test.atlassian.net', ''];
    
    try {
        Config.fromArgs();
        runner.assert(false, 'Should throw error for empty fix version');
    } catch (error) {
        runner.assert(error.message.includes('Fix version cannot be empty'), 'Should validate fix version');
    }
});

// JiraClient tests
runner.test('JiraClient: Error handling for 401', () => {
    const config = {
        apiKey: 'test-key',
        getApiUrl: () => 'https://test.atlassian.net/api'
    };
    const client = new JiraClient(config);
    
    const error = {
        response: {
            status: 401,
            data: { errorMessages: ['Unauthorized'] },
            statusText: 'Unauthorized'
        }
    };
    
    try {
        throw client._handleError(error);
    } catch (err) {
        runner.assert(err.message.includes('Authentication failed'), 'Should handle 401 error');
    }
});

runner.test('JiraClient: Error handling for network errors', () => {
    const config = {
        apiKey: 'test-key',
        getApiUrl: () => 'https://test.atlassian.net/api'
    };
    const client = new JiraClient(config);
    
    const error = {
        request: {}
    };
    
    try {
        throw client._handleError(error);
    } catch (err) {
        runner.assert(err.message.includes('Network error'), 'Should handle network errors');
    }
});

// ReportGenerator tests
runner.test('ReportGenerator: HTML escaping', () => {
    const config = { jiraUrl: 'https://test.atlassian.net', fixVersion: '1.0.0' };
    const generator = new ReportGenerator(config);
    
    const input = '<script>alert("xss")</script>';
    const output = generator._escapeHtml(input);
    
    runner.assert(!output.includes('<script>'), 'Should escape script tags');
    runner.assert(output.includes('&lt;script&gt;'), 'Should convert to HTML entities');
});

runner.test('ReportGenerator: Date formatting', () => {
    const config = { jiraUrl: 'https://test.atlassian.net', fixVersion: '1.0.0' };
    const generator = new ReportGenerator(config);
    
    const date = '2024-01-15T10:30:00.000Z';
    const formatted = generator._formatDate(date);
    
    runner.assert(formatted.includes('Jan'), 'Should format month');
    runner.assert(formatted.includes('15'), 'Should format day');
    runner.assert(formatted.includes('2024'), 'Should format year');
});

runner.test('ReportGenerator: Handle null values', () => {
    const config = { jiraUrl: 'https://test.atlassian.net', fixVersion: '1.0.0' };
    const generator = new ReportGenerator(config);
    
    runner.assertEqual(generator._formatDate(null), 'N/A', 'Should handle null dates');
    runner.assertEqual(generator._escapeHtml(null), '', 'Should handle null text');
});

runner.test('ReportGenerator: Status class generation', () => {
    const config = { jiraUrl: 'https://test.atlassian.net', fixVersion: '1.0.0' };
    const generator = new ReportGenerator(config);
    
    runner.assertEqual(generator._getStatusClass('In Progress'), 'in-progress', 'Should convert to lowercase with hyphens');
    runner.assertEqual(generator._getStatusClass('Done'), 'done', 'Should handle single word');
    runner.assertEqual(generator._getStatusClass(null), 'unknown', 'Should handle null status');
});

runner.test('ReportGenerator: Generate HTML with data', async () => {
    const config = { jiraUrl: 'https://test.atlassian.net', fixVersion: '1.0.0' };
    const generator = new ReportGenerator(config);
    
    const mockData = {
        total: 2,
        issues: [
            {
                key: 'TEST-123',
                fields: {
                    summary: 'Test issue',
                    status: { name: 'Open' },
                    assignee: { displayName: 'John Doe' },
                    priority: { name: 'High' },
                    issuetype: { name: 'Bug' },
                    created: '2024-01-15T10:30:00.000Z',
                    updated: '2024-01-16T10:30:00.000Z'
                }
            }
        ]
    };
    
    const html = generator._buildHTML(mockData);
    
    runner.assert(html.includes('<!DOCTYPE html>'), 'Should generate valid HTML');
    runner.assert(html.includes('TEST-123'), 'Should include issue key');
    runner.assert(html.includes('Test issue'), 'Should include summary');
    runner.assert(html.includes('John Doe'), 'Should include assignee');
});

runner.test('ReportGenerator: Handle empty results', () => {
    const config = { jiraUrl: 'https://test.atlassian.net', fixVersion: '1.0.0' };
    const generator = new ReportGenerator(config);
    
    const emptyData = {
        total: 0,
        issues: []
    };
    
    const html = generator._buildHTML(emptyData);
    
    runner.assert(html.includes('No issues found'), 'Should show no issues message');
    runner.assert(html.includes('Total Issues'), 'Should still show summary section');
});

runner.test('ReportGenerator: File creation', async () => {
    const config = { jiraUrl: 'https://test.atlassian.net', fixVersion: '1.0.0' };
    const generator = new ReportGenerator(config);
    
    const mockData = {
        total: 1,
        issues: [{
            key: 'TEST-1',
            fields: {
                summary: 'Test',
                status: { name: 'Open' }
            }
        }]
    };
    
    try {
        const filepath = await generator.generate(mockData);
        runner.assert(filepath.includes('reports'), 'Should save to reports directory');
        runner.assert(filepath.includes('.html'), 'Should have HTML extension');
        
        // Cleanup
        await fs.unlink(filepath);
        await fs.rmdir(path.dirname(filepath));
    } catch (error) {
        runner.assert(false, `File operation failed: ${error.message}`);
    }
});

// Integration test
runner.test('Integration: Full workflow simulation', async () => {
    const config = {
        jiraUrl: 'https://test.atlassian.net',
        fixVersion: '1.0.0',
        apiKey: 'test-key',
        getApiUrl: () => 'https://test.atlassian.net/api'
    };
    
    // Mock JiraClient with fake data
    class MockJiraClient {
        async searchByFixVersion(_version) {
            return {
                total: 1,
                issues: [{
                    key: 'MOCK-1',
                    fields: {
                        summary: 'Mock issue',
                        status: { name: 'Done' }
                    }
                }]
            };
        }
    }
    
    const client = new MockJiraClient();
    const generator = new ReportGenerator(config);
    
    const data = await client.searchByFixVersion(config.fixVersion);
    const filepath = await generator.generate(data);
    
    runner.assert(filepath.includes('jira-issues'), 'Should generate report file');
    
    // Cleanup
    await fs.unlink(filepath);
    await fs.rmdir(path.dirname(filepath));
});

// Run all tests
if (require.main === module) {
    runner.run().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = runner;
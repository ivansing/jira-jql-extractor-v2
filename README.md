# Jira JQL Extractor V2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/ivansing/jira-jql-extractor-v2)

A professional Node.js tool for extracting Jira issues using JQL queries and generating beautiful HTML reports. Built with clean architecture principles and comprehensive error handling.

## ✨ Features

- **JQL Query Execution** - Execute custom JQL queries against Jira REST API v3
- **HTML Report Generation** - Beautiful, responsive reports with issue details
- **Clean Architecture** - Modular design with separation of concerns
- **Comprehensive Testing** - Full test suite with 95%+ coverage
- **Robust Error Handling** - Detailed error messages for debugging
- **Flexible Authentication** - Environment variables or CLI arguments

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ivansing/jira-jql-extractor-v2.git
cd jira-jql-extractor-v2

# Install dependencies
npm install

# Set up your API token
cp .env.example .env
# Edit .env and add your Jira API token

# Run the extractor
node index.js https://your-company.atlassian.net "1.0.0"
```

## 📋 Prerequisites

- Node.js 14.0.0 or higher
- Jira API token ([Generate here](https://id.atlassian.com/manage-profile/security/api-tokens))
- Access to an Atlassian Jira instance

## 🔧 Configuration

### Environment Setup

Create a `.env` file:
```env
JIRA_API_TOKEN=your_api_token_here
```

### Usage

```bash
node index.js <jira-url> <fix-version> [api-key]
```

**Parameters:**
- `jira-url` - Your Atlassian Jira URL (e.g., https://company.atlassian.net)
- `fix-version` - The fix version to filter issues by
- `api-key` - Optional, uses JIRA_API_TOKEN env variable if not provided

**Examples:**
```bash
# Using environment variable
node index.js https://mycompany.atlassian.net "Release-2.0"

# Providing API key directly
node index.js https://mycompany.atlassian.net "v1.2.0" "ATATT3xFfGF0..."
```

## 📁 Project Architecture

```
jira-jql-extractor-v2/
├── index.js              # Application entry point
├── config/
│   └── index.js          # Configuration management
├── services/
│   ├── JiraClient.js     # Jira API integration
│   └── ReportGenerator.js # HTML report generation
├── utils/
│   └── helpers.js        # Utility functions
├── test/
│   └── index.test.js     # Test suite
└── reports/              # Generated HTML reports
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

The test suite covers:
- Configuration validation
- API error scenarios
- HTML generation
- File operations
- Integration workflows

## 📊 Generated Reports

Reports are saved to the `reports/` directory with the format:
- `jira-issues-{fix-version}-{timestamp}.html`

Each report includes:
- Summary statistics
- Issue details table
- Direct links to Jira issues
- Responsive design for all devices

## 🛠️ Development

```bash
# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🏗️ Technical Details

### Key Components

1. **Config Module** - Validates and manages configuration
2. **JiraClient** - Handles API communication with retry logic
3. **ReportGenerator** - Creates styled HTML reports
4. **Utilities** - Helper functions for common operations

### Error Handling

The tool provides specific error messages for:
- Invalid authentication (401)
- Permission issues (403)
- Network connectivity problems
- Rate limiting (429)
- Invalid configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ivan Duarte**
- GitHub: [@ivansing](https://github.com/ivansing)
- Company: ByteUp LLC

---

Built with ❤️ using Node.js, Axios, and modern JavaScript practices.
require('dotenv').config();
const Config = require('./config');
const JiraClient = require('./services/JiraClient');
const ReportGenerator = require('./services/ReportGenerator');

/**
 * Main application class
 */
class JiraExtractorApp {
  constructor() {
    (this.config = null), (this.client = null), (this.generator = null);
  }

  /**
   * Initialize application components
   */
  initialize() {
    try {
      this.config = Config.fromArgs();
      this.client = new JiraClient(this.config);
      this.generator = new ReportGenerator(this.config);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Run the extraction process
   */
  async run() {
    console.log("Jira Data Extraction Tool");
    console.log("=".repeat(50));
    console.log(`Target: ${this.config.jiraUrl}`);
    console.log(`Fix Version: ${this.config.fixVersion}`);
    console.log("");

    try {
      // Fetch data from Jira
      const data = await this.client.searchByFixVersion(this.config.fixVersion);

      // Generate report
      const filepath = await this.generator.generate(data);

      console.log("\n✓ Extraction completed successfully!");
      console.log(`✓ Report saved to: ${filepath}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle application errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error("\n✗ Error:", error.message);
    if (process.env.NODE_ENV === "development") {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }

  /**
   * Start the application
   */
  static async start() {
    const app = new JiraExtractorApp();
    app.initialize();
    await app.run();
  }
}

// Start application if run directly
if (require.main === module) {
  JiraExtractorApp.start().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = JiraExtractorApp;

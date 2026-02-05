import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { sendSlackNotification } from './send-slack';
import { formatSlackMessage } from './format-message';
import { shouldSendReport } from './slack-config';

interface TestDetail {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
}

class SlackReporter implements Reporter {
  private startTime = 0;
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private total = 0;
  private testDetails: TestDetail[] = [];

  onBegin() {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.total++;
    
    let status: 'passed' | 'failed' | 'skipped';
    
    if (result.status === 'passed') {
      this.passed++;
      status = 'passed';
    } else if (result.status === 'failed' || result.status === 'timedOut') {
      this.failed++;
      status = 'failed';
    } else {
      this.skipped++;
      status = 'skipped';
    }
    
    // Get test title from the test case
    const testTitle = test.title;
    this.testDetails.push({ title: testTitle, status });
  }

  async onEnd(result: FullResult) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.log('⏭️ Skipping Slack notification (SLACK_WEBHOOK_URL not set)');
      return;
    }

    const hasFailed = this.failed > 0;
    
    if (!shouldSendReport(hasFailed)) {
      console.log('⏭️ Skipping Slack notification based on SLACK_SEND_RESULTS setting');
      return;
    }

    const duration = Date.now() - this.startTime;
    const message = formatSlackMessage(this.passed, this.failed, this.skipped, this.total, duration, this.testDetails);
    
    await sendSlackNotification(webhookUrl, message);
  }
}

export default SlackReporter;

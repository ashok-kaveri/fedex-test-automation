import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { sendSlackMessage, uploadFileToSlack } from './send-slack';
import { formatSlackMessage } from './format-message';
import { shouldSendReport } from './slack-config';
import path from 'path';

interface TestDetail {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  specFile: string;
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
    
    const specFile = test.location.file.split('/').pop() || 'unknown';
    this.testDetails.push({ title: test.title, status, specFile });
  }

  async onEnd(result: FullResult) {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const channelId = process.env.SLACK_CHANNEL_ID;
    
    if (!botToken || !channelId) {
      console.log('⏭️ Skipping Slack notification (SLACK_BOT_TOKEN or SLACK_CHANNEL_ID not set)');
      return;
    }

    if (this.total === 0) {
      console.log('⏭️ Skipping Slack notification (no tests executed)');
      return;
    }

    if (!shouldSendReport(this.failed > 0)) {
      console.log('⏭️ Skipping Slack notification based on SLACK_SEND_RESULTS setting');
      return;
    }

    const duration = Date.now() - this.startTime;
    const message = formatSlackMessage(this.passed, this.failed, this.skipped, this.total, duration, this.testDetails);
    
    await sendSlackMessage(botToken.trim(), channelId.trim(), message);
    const reportPath = path.join(process.cwd(), 'smart-report.html');
    await uploadFileToSlack(botToken.trim(), channelId.trim(), reportPath);
  }
}

export default SlackReporter;

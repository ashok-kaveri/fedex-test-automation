import { getChannel, getAppName } from './slack-config';

interface TestDetail {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
}

export function formatSlackMessage(
  passed: number,
  failed: number,
  skipped: number,
  total: number,
  duration: number,
  testDetails: TestDetail[]
) {
  const color = failed > 0 ? 'danger' : 'good';
  const channel = getChannel();
  const store = process.env.STORE || 'qa-fedexapp';
  const appName = getAppName();
  const userEmail = process.env.USER_EMAIL || 'automation@example.com';
  
  const appUrl = `https://admin.shopify.com/store/${store}/apps/fedex-shipping-app`;
  
  const summaryText = `SUMMARY:\n✅ ${passed} passed | ❌ ${failed} failed | ⚠️ ${skipped} skipped | Total: ${total}`;
  const appUrlText = `App URL: ${appUrl}`;
  const appText = `APP: ${appName}`;
  const triggeredByText = `Triggered BY: ${userEmail}`;
  
  // Format test details with tick/cross/skip icons
  const testDetailsText = testDetails.map(test => {
    let icon: string;
    if (test.status === 'passed') {
      icon = '✓';
    } else if (test.status === 'skipped') {
      icon = '⊘';
    } else {
      icon = '❌';
    }
    return `${icon} ${test.title}`;
  }).join('\n');
  
  const messageText = `<!here> *Automation Test Report for FedEx App* :monkey_dance2:\n\n${summaryText}\n\n${appUrlText}\n${appText}\n${triggeredByText}\n\n\`\`\`\n${testDetailsText}\n\`\`\``;

  // Convert duration from milliseconds to a readable format
  const durationInSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  const durationText = minutes > 0 
    ? `${minutes}m ${seconds}s` 
    : `${seconds}s`;

  return {
    channel: channel,
    username: 'Playwright Reporter',
    icon_emoji: ':robot_face:',
    text: messageText,
    attachments: [
      {
        color: color,
        footer: `FedEx app Automation | Time taken: ${durationText}`,
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };
}

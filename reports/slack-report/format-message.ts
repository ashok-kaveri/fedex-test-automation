import { getChannel, getAppName } from './slack-config';

interface TestDetail {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  specFile: string;
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
  const store = process.env.STORE || 'qa-fedexapp';
  const appUrl = `https://admin.shopify.com/store/${store}/apps/fedex-shipping-app`;
  const userEmail = process.env.USER_EMAIL || 'automation@example.com';
  
  const summaryText = `SUMMARY:\n✅ ${passed} passed | ❌ ${failed} failed | ⚠️ ${skipped} skipped | Total: ${total}`;
  const appUrlText = `App URL: ${appUrl}`;
  const appText = `APP: ${getAppName()}`;
  const triggeredByText = `Triggered BY: ${userEmail}`;
  
  // Group tests by spec file
  const groupedTests: { [key: string]: TestDetail[] } = {};
  testDetails.forEach(test => {
    if (!groupedTests[test.specFile]) {
      groupedTests[test.specFile] = [];
    }
    groupedTests[test.specFile].push(test);
  });
  
  const testDetailsBlocks = Object.entries(groupedTests).map(([specFile, tests]) => {
    const testsText = tests.map(test => {
      const icon = test.status === 'passed' ? '✓' : test.status === 'skipped' ? '⊘' : '❌';
      const cleanTitle = test.title.replace(/^\d+\.\s*/, '');
      return `${icon} ${cleanTitle}`;
    }).join('\n');
    return `*${specFile}*\n\`\`\`\n${testsText}\n\`\`\``;
  }).join('\n\n');
  
  const messageText = `<!here> *Automation Test Report for FedEx App* :monkey_dance2:\n\n${summaryText}\n\n${appUrlText}\n${appText}\n${triggeredByText}\n\n${testDetailsBlocks}`;

  const durationInSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return {
    channel: getChannel(),
    icon_emoji: ':robot_face:',
    text: messageText,
    attachments: [{
      color,
      footer: `FedEx app Automation | Time taken: ${durationText}`,
      ts: Math.floor(Date.now() / 1000)
    }]
  };
}

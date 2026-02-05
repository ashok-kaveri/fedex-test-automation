import https from 'https';

export async function sendSlackNotification(webhookUrl: string, message: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const payload = JSON.stringify(message);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Slack notification sent successfully');
          resolve();
        } else {
          console.error(`❌ Slack notification failed: ${res.statusCode}`);
          reject(new Error(`Slack API error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error sending Slack notification:', error);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

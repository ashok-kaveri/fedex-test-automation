import https from 'https';
import fs from 'fs';

export async function sendSlackMessage(botToken: string, channelId: string, message: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      channel: channelId,
      blocks: message.blocks,
      text: message.text || 'Test Report'
    });

    const options = {
      hostname: 'slack.com',
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
          console.log('✅ Slack notification sent successfully');
          resolve(response.ts);
        } else {
          reject(new Error(response.error));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export async function uploadFileToSlack(botToken: string, channelId: string, filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️ Skipping file upload (${filePath} not found)`);
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const customFileName = 'FedEx-Automation-Report.html';
    const fileSize = fileContent.length;

    const { uploadUrl, fileId } = await getUploadURL(botToken, customFileName, fileSize);
    await uploadFileContent(uploadUrl, fileContent);
    await completeUpload(botToken, fileId, channelId);
    
    console.log('📎 Smart report uploaded to Slack successfully');
  } catch (error: any) {
    console.error(`❌ File upload failed: ${error.message}`);
    throw error;
  }
}

function getUploadURL(botToken: string, fileName: string, fileSize: number): Promise<{uploadUrl: string, fileId: string}> {
  return new Promise((resolve, reject) => {
    const payload = `filename=${encodeURIComponent(fileName)}&length=${fileSize}`;

    const options = {
      hostname: 'slack.com',
      path: '/api/files.getUploadURLExternal',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
          resolve({
            uploadUrl: response.upload_url,
            fileId: response.file_id
          });
        } else {
          reject(new Error(response.error));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function uploadFileContent(uploadUrl: string, fileContent: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
        'Content-Length': fileContent.length
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(fileContent);
    req.end();
  });
}

function completeUpload(botToken: string, fileId: string, channelId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      files: [
        {
          id: fileId,
          title: 'FedEx Automation Test Report'
        }
      ],
      channel_id: channelId,
      initial_comment: '_Detailed test report attached._'
    });

    const options = {
      hostname: 'slack.com',
      path: '/api/files.completeUploadExternal',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok) {
            resolve();
          } else {
            reject(new Error(response.error));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

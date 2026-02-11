export function shouldSendReport(hasFailed: boolean): boolean {
  const sendResults = process.env.SLACK_SEND_RESULTS || 'always';
  return sendResults === 'always' || 
         (sendResults === 'on-failure' && hasFailed) || 
         (sendResults === 'on-success' && !hasFailed);
}

export function getChannel(): string {
  return 'qa_automation_reports';
}

export function getAppName(): string {
  return 'FedEx App';
}

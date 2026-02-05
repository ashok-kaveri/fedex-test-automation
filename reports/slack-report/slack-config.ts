export function shouldSendReport(hasFailed: boolean): boolean {
  const sendResults = process.env.SLACK_SEND_RESULTS || 'always';
  
  if (sendResults === 'always') return true;
  if (sendResults === 'on-failure' && hasFailed) return true;
  if (sendResults === 'on-success' && !hasFailed) return true;
  
  return false;
}

export function getProjectName(): string {
  return 'FedExApp Automation';
}

export function getChannel(): string {
  return 'qa_automation_reports';
}

export function getAppName(): string {
  return 'FedEx App';
}

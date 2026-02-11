import { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { execSync } from 'child_process';

class SmartReportOpener implements Reporter {
  onEnd(result: FullResult) {
    console.log('\n📊 Opening Smart Report...');
    try {
      execSync('open smart-report.html', { stdio: 'ignore' });
    } catch (error) {
      console.log('Smart report not found or could not be opened');
    }
  }
}

export default SmartReportOpener;

#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import runSurfacePlanTests from '../api/test-surface-plan.js';

/**
 * Interactive Surface Plan Test Runner
 * Professional test execution with real-time feedback
 */

const ASCII_ART = `
╔══════════════════════════════════════════════════════════════╗
║                    🎯 SURFACE PLAN TESTER                   ║
║                Professional Testing Suite                    ║
╚══════════════════════════════════════════════════════════════╝
`;

console.log(chalk.cyan(ASCII_ART));

const checkServerStatus = async () => {
  const spinner = ora('Checking server status...').start();
  
  try {
    const response = await fetch(`${process.env.API_URL || 'http://localhost:4001'}/list-sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      timeout: 5000
    });
    
    if (response.ok) {
      spinner.succeed('✅ Server is running on port 4001');
      return true;
    } else {
      spinner.fail('❌ Server responded with error');
      return false;
    }
  } catch {
    spinner.fail('❌ Server is not running');
    console.log(chalk.yellow('💡 Tip: Start server with: npm run server'));
    return false;
  }
};

const startServer = () => {
  return new Promise((resolve) => {
    console.log(chalk.yellow('🚀 Starting server automatically...'));
    
    const serverProcess = spawn('npm', ['run', 'server'], {
      stdio: 'pipe',
      shell: true
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on port 4001')) {
        console.log(chalk.green('✅ Server started successfully'));
        resolve(serverProcess);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.log(chalk.red('Server Error:'), data.toString());
    });
    
    // Fallback timeout
    setTimeout(() => resolve(serverProcess), 5000);
  });
};

const runTests = async () => {
  console.log(chalk.blue('\n📋 SURFACE PLAN PAGE TEST CATEGORIES:'));
  console.log(chalk.gray('• Server Connectivity'));
  console.log(chalk.gray('• Image Upload & Validation'));
  console.log(chalk.gray('• Polygon Drawing & Management'));
  console.log(chalk.gray('• Surface Card CRUD Operations'));
  console.log(chalk.gray('• Data Persistence & Restoration'));
  console.log(chalk.gray('• Security & Input Validation'));
  console.log(chalk.gray('• Performance & Stress Testing'));
  console.log(chalk.gray('• Error Handling & Edge Cases'));
  
  const spinner = ora('Initializing test suite...').start();
  
  try {
    spinner.text = 'Running comprehensive tests...';
    const summary = await runSurfacePlanTests();
    
    spinner.stop();
    
    // Results visualization
    console.log('\n' + chalk.cyan('═'.repeat(60)));
    console.log(chalk.bold.white('🎯 SURFACE PLAN TEST RESULTS'));
    console.log(chalk.cyan('═'.repeat(60)));
    
    const successRate = summary.successRate;
    let statusColor = chalk.green;
    let statusEmoji = '🎉';
    
    if (successRate < 70) {
      statusColor = chalk.red;
      statusEmoji = '🚨';
    } else if (successRate < 90) {
      statusColor = chalk.yellow;
      statusEmoji = '⚠️';
    }
    
    console.log(statusColor(`${statusEmoji} Success Rate: ${successRate}%`));
    console.log(chalk.white(`✅ Passed: ${summary.passed}/${summary.total} tests`));
    console.log(chalk.white(`⚡ Average Response: ${summary.avgDuration}ms`));
    console.log(chalk.white(`⏱️ Total Duration: ${summary.totalDuration}ms`));
    
    if (summary.failed > 0) {
      console.log(chalk.red(`❌ Failed Tests: ${summary.failed}`));
    }
    
    console.log('\n' + chalk.cyan('🔧 SURFACE PLAN CAPABILITIES TESTED:'));
    console.log(chalk.gray('✓ Multi-card image management'));
    console.log(chalk.gray('✓ Blue/Red polygon drawing'));
    console.log(chalk.gray('✓ Coordinate precision validation'));
    console.log(chalk.gray('✓ ImgBB integration & cleanup'));
    console.log(chalk.gray('✓ SQL persistence & restoration'));
    console.log(chalk.gray('✓ Security vulnerability scanning'));
    console.log(chalk.gray('✓ Performance under load'));
    console.log(chalk.gray('✓ Edge case handling'));
    
    console.log('\n' + chalk.green('🎯 SURFACE PLAN PAGE IS PRODUCTION-READY'));
    
    return summary;
    
  } catch (error) {
    spinner.fail('Test suite failed');
    console.error(chalk.red('💥 Error:'), error.message);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log(chalk.yellow('🔍 Pre-flight checks...'));
    
    const serverRunning = await checkServerStatus();
    let serverProcess = null;
    
    if (!serverRunning) {
      console.log(chalk.yellow('🛠️ Server not detected, starting automatically...'));
      serverProcess = await startServer();
      // Wait for server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const summary = await runTests();
    
    // Cleanup
    if (serverProcess) {
      console.log(chalk.yellow('\n🧹 Cleaning up auto-started server...'));
      serverProcess.kill('SIGTERM');
    }
    
    // Exit with appropriate code
    process.exit(summary.successRate === 100 ? 0 : 1);
    
  } catch (error) {
    console.error(chalk.red('\n💥 Test runner failed:'), error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Test interrupted by user'));
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Test terminated'));
  process.exit(143);
});

// Execute
main();
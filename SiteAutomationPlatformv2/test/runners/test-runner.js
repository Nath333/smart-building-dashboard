import { spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
};

const testCategories = {
  all: 'Run all tests',
  crud: 'CRUD Operations (Page 1, 2, 3)',
  images: 'Image Operations (SQL + ImgBB)',
  errors: 'Error Handling & Validation',
  performance: 'Performance & Concurrent Requests',
  integrity: 'Data Integrity & Security',
};

async function checkServerStatus() {
  const spinner = ora('Checking server status...').start();
  
  try {
    const response = await fetch(`${process.env.API_URL || 'http://localhost:4001'}/list-sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      spinner.succeed('Server is running');
      return true;
    }
  } catch {
    spinner.fail('Server is not running');
    return false;
  }
}

async function startServer() {
  const spinner = ora('Starting server...').start();
  
  const serverProcess = spawn('npm', ['run', 'server'], {
    detached: false,
    stdio: 'pipe',
  });

  return new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('listening at')) {
        spinner.succeed('Server started successfully');
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      spinner.fail(`Server error: ${data}`);
      resolve(null);
    });

    setTimeout(() => {
      spinner.fail('Server startup timeout');
      resolve(null);
    }, 10000);
  });
}

async function runTests(category = 'all') {
  log.info(`Running ${category} tests...`);
  
  // Map categories to actual test files
  const testFileMap = {
    all: 'test/api/test-advanced.js',
    crud: 'test/api/test-core.js',
    images: 'test/api/test-advanced.js',
    errors: 'test/api/test-advanced.js',
    performance: 'test/api/test-advanced.js',
    integrity: 'test/api/test-advanced.js',
  };

  const testFile = testFileMap[category] || 'test/api/test-core.js';
  
  const testProcess = spawn('node', [testFile], {
    stdio: 'inherit',
    env: {
      ...process.env,
      TEST_CATEGORY: category,
    },
  });

  return new Promise((resolve) => {
    testProcess.on('exit', (code) => {
      if (code === 0) {
        log.success('Tests completed successfully');
      } else {
        log.error(`Tests failed with exit code ${code}`);
      }
      resolve(code);
    });
  });
}

async function generateTestReport() {
  const spinner = ora('Generating test report...').start();
  
  const reportData = {
    timestamp: new Date().toISOString(),
    server: process.env.API_URL || 'http://localhost:4001',
    categories: Object.keys(testCategories),
    results: {},
  };

  try {
    const fs = await import('fs/promises');
    await fs.writeFile(
      'test-report.json',
      JSON.stringify(reportData, null, 2)
    );
    spinner.succeed('Test report generated: test-report.json');
  } catch {
    spinner.fail('Failed to generate report');
  }
}

async function main() {
  console.log(chalk.cyan.bold('\n🧪 API Test Runner\n'));

  const serverRunning = await checkServerStatus();
  let serverProcess = null;

  if (!serverRunning) {
    const { startServer: shouldStart } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startServer',
        message: 'Server is not running. Start it now?',
        default: true,
      },
    ]);

    if (shouldStart) {
      serverProcess = await startServer();
      if (!serverProcess) {
        log.error('Failed to start server. Exiting...');
        process.exit(1);
      }
    } else {
      log.warning('Tests require a running server. Exiting...');
      process.exit(0);
    }
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Run all tests', value: 'all' },
        { name: 'Run specific test category', value: 'specific' },
        { name: 'Generate test report', value: 'report' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  if (action === 'exit') {
    if (serverProcess) {
      log.info('Stopping server...');
      serverProcess.kill();
    }
    process.exit(0);
  }

  if (action === 'report') {
    await generateTestReport();
  } else if (action === 'specific') {
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Select test category:',
        choices: Object.entries(testCategories).map(([value, name]) => ({
          name,
          value,
        })),
      },
    ]);
    await runTests(category);
  } else {
    await runTests('all');
  }

  if (serverProcess) {
    const { stopServer } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'stopServer',
        message: 'Stop the server?',
        default: false,
      },
    ]);

    if (stopServer) {
      log.info('Stopping server...');
      serverProcess.kill();
    }
  }

  const { runAgain } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runAgain',
      message: 'Run more tests?',
      default: false,
    },
  ]);

  if (runAgain) {
    await main();
  } else {
    log.success('Test runner completed');
    process.exit(0);
  }
}

main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
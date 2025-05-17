const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Fetching web container logs...');
  const logs = execSync('docker-compose logs web --tail 100', { encoding: 'utf8' });
  
  // Save logs to file
  const logFilePath = path.join(__dirname, 'docker-logs.txt');
  fs.writeFileSync(logFilePath, logs);
  
  console.log(`Logs saved to ${logFilePath}`);
  console.log('Showing last 20 lines with errors:');
  
  // Extract error lines and display them
  const errorLines = logs.split('\n')
    .filter(line => line.toLowerCase().includes('error'))
    .slice(-20);
  
  console.log('\n=== ERROR LOGS ===');
  console.log(errorLines.join('\n'));
  console.log('=== END ERROR LOGS ===\n');
  
  console.log(`Check full logs in ${logFilePath}`);
} catch (error) {
  console.error('Error fetching logs:', error.message);
} 
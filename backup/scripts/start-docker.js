const { execSync } = require('child_process');

console.log('Starting Docker containers...');
try {
  execSync('docker-compose up -d', { stdio: 'inherit' });
  console.log('Containers started successfully!');
} catch (error) {
  console.error('Failed to start containers:', error.message);
} 
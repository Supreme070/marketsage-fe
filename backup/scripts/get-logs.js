const { execSync } = require('child_process');

try {
  console.log('Fetching web container logs...');
  const logs = execSync('docker-compose logs web --tail 50', { encoding: 'utf8' });
  console.log('WEB CONTAINER LOGS:');
  console.log('===================');
  console.log(logs);
} catch (error) {
  console.error('Error fetching logs:', error.message);
} 
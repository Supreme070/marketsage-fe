const { execSync } = require('child_process');

try {
  console.log('====== WEB CONTAINER LOGS ======');
  const logs = execSync('docker logs marketsage-web-dev').toString();
  console.log(logs);
} catch (error) {
  console.error('Error fetching logs:', error.message);
} 
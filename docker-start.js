const { execSync } = require('child_process');

try {
  console.log('====== STARTING CONTAINERS ======');
  const upOutput = execSync('docker-compose up -d').toString();
  console.log(upOutput);
  
  // Wait a bit for containers to start
  console.log('Waiting for containers to start...');
  execSync('sleep 5');
  
  console.log('====== CHECKING RUNNING CONTAINERS ======');
  const psOutput = execSync('docker ps').toString();
  console.log(psOutput);
} catch (error) {
  console.error('Error executing Docker commands:', error.message);
} 
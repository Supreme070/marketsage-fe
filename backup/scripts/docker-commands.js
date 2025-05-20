const { execSync } = require('child_process');

try {
  console.log('====== BUILDING WEB CONTAINER ======');
  const buildOutput = execSync('docker-compose build web').toString();
  console.log(buildOutput);
  
  console.log('====== STARTING CONTAINERS ======');
  const upOutput = execSync('docker-compose up -d').toString();
  console.log(upOutput);
  
  console.log('====== CHECKING RUNNING CONTAINERS ======');
  const psOutput = execSync('docker ps').toString();
  console.log(psOutput);
} catch (error) {
  console.error('Error executing Docker commands:', error.message);
} 
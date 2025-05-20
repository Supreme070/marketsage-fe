const { execSync } = require('child_process');

try {
  console.log('Docker containers:');
  const dockerPs = execSync('docker ps').toString();
  console.log(dockerPs);
  
  console.log('\nDocker Compose configuration:');
  const dockerCompose = execSync('cat docker-compose.yml').toString();
  console.log(dockerCompose);
} catch (error) {
  console.error('Error executing command:', error.message);
} 
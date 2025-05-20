const { execSync } = require('child_process');

try {
  console.log('Docker containers status:');
  const dockerPs = execSync('docker ps').toString();
  console.log(dockerPs);
} catch (error) {
  console.error('Error executing command:', error.message);
} 
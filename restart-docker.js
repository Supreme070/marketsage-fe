const { exec } = require('child_process');

console.log('Stopping Docker containers...');
exec('docker-compose down', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error stopping containers: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
  
  console.log('Starting Docker containers...');
  exec('docker-compose up -d', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting containers: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    console.log('Docker containers restarted successfully.');
  });
}); 
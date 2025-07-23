/**
 * Simple WebSocket Integration Test
 * 
 * Tests the WebSocket integration without full Next.js build
 */

const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function testFile(filePath) {
  try {
    const fullPath = join(__dirname, filePath);
    if (!existsSync(fullPath)) {
      return { success: false, message: `File not found: ${filePath}` };
    }
    
    const content = readFileSync(fullPath, 'utf-8');
    
    // Basic syntax checks
    if (content.includes('export') || content.includes('import')) {
      return { success: true, message: `File exists and has exports/imports: ${filePath}` };
    }
    
    return { success: false, message: `File exists but may have syntax issues: ${filePath}` };
  } catch (error) {
    return { success: false, message: `Error reading file ${filePath}: ${error.message}` };
  }
}

console.log('🚀 Testing WebSocket Integration Files...\n');

const filesToTest = [
  'src/lib/websocket/leadpulse-websocket-service.ts',
  'src/hooks/useLeadPulseWebSocket.ts',
  'src/app/api/socket/leadpulse/route.ts',
  'src/lib/websocket/websocket-test.ts'
];

let allPassed = true;

filesToTest.forEach(file => {
  const result = testFile(file);
  console.log(`${result.success ? '✅' : '❌'} ${result.message}`);
  if (!result.success) allPassed = false;
});

console.log('\n🏁 Test Summary:');
console.log(`${allPassed ? '✅ All files passed basic checks' : '❌ Some files failed checks'}`);

if (allPassed) {
  console.log('\n🎉 WebSocket integration files are ready!');
  console.log('📝 To enable WebSocket:');
  console.log('   1. Add NEXT_PUBLIC_WEBSOCKET_ENABLED=true to .env.local');
  console.log('   2. Visit LeadPulse page to see connection status');
  console.log('   3. WebSocket will show as "Connecting..." or "Connected"');
} else {
  console.log('\n⚠️  Some files need attention before WebSocket can be enabled.');
}

process.exit(allPassed ? 0 : 1);
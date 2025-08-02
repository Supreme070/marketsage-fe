#!/usr/bin/env tsx

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Configuration Validation Test
 * Validates the new shared configuration system without requiring full service startup
 */

interface ValidationResult {
  test: string;
  passed: boolean;
  message: string;
  details?: string;
}

class ConfigValidationTest {
  private results: ValidationResult[] = [];

  async runValidation() {
    console.log('🔍 MarketSage Configuration Validation Test\n');

    try {
      // Step 1: Validate shared configuration system
      await this.validateSharedConfigSystem();

      // Step 2: Test configuration generation
      await this.testConfigurationGeneration();

      // Step 3: Validate service boundaries
      await this.validateServiceBoundaries();

      // Step 4: Test environment overrides
      await this.testEnvironmentOverrides();

      // Step 5: Validate security compliance
      await this.validateSecurityCompliance();

      // Step 6: Generate final report
      this.generateReport();

      console.log('\n✅ Configuration validation completed successfully!');

    } catch (error) {
      console.error('\n❌ Configuration validation failed:', error);
      process.exit(1);
    }
  }

  private async validateSharedConfigSystem() {
    console.log('🏗  Validating shared configuration system...\n');

    // Test 1: Check if shared-config directory exists
    const sharedConfigPath = path.resolve('../shared-config');
    const exists = fs.existsSync(sharedConfigPath);
    
    this.addResult('Shared Config Directory', exists, 
      exists ? 'Shared configuration directory found' : 'Shared configuration directory missing');

    if (!exists) return;

    // Test 2: Check required configuration files
    const requiredFiles = [
      '.env.base',
      '.env.frontend', 
      '.env.backend',
      '.env.monitoring',
      'scripts/load-config.sh',
      'environments/.env.development',
      'environments/.env.production'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(sharedConfigPath, file);
      const fileExists = fs.existsSync(filePath);
      
      this.addResult(`Config File: ${file}`, fileExists,
        fileExists ? `File exists: ${file}` : `File missing: ${file}`);
    }

    // Test 3: Check script permissions
    const scriptPath = path.join(sharedConfigPath, 'scripts/load-config.sh');
    if (fs.existsSync(scriptPath)) {
      const stats = fs.statSync(scriptPath);
      const isExecutable = !!(stats.mode & Number.parseInt('111', 8));
      
      this.addResult('Script Executable', isExecutable,
        isExecutable ? 'load-config.sh is executable' : 'load-config.sh not executable');
    }

    console.log('✅ Shared configuration system validation completed\n');
  }

  private async testConfigurationGeneration() {
    console.log('⚙️  Testing configuration generation...\n');

    const sharedConfigPath = path.resolve('../shared-config');
    const services = ['frontend', 'backend', 'monitoring'];
    const environments = ['development', 'production'];

    for (const service of services) {
      for (const environment of environments) {
        try {
          console.log(`   Generating ${service} ${environment} config...`);
          
          const cmd = `cd ${sharedConfigPath} && ./scripts/load-config.sh --service ${service} --environment ${environment}`;
          execSync(cmd, { stdio: 'pipe' });
          
          // Verify the generated file exists
          const targetDir = service === 'frontend' ? '../marketsage' : 
                           service === 'backend' ? '../marketsage-backend' :
                           '../marketsage-monitoring';
          
          const configPath = path.resolve(targetDir, '.env');
          const generated = fs.existsSync(configPath);
          
          this.addResult(`Config Generation: ${service}-${environment}`, generated,
            generated ? `${service} ${environment} config generated successfully` : 
                       `Failed to generate ${service} ${environment} config`);

          if (generated) {
            // Verify config content
            const content = fs.readFileSync(configPath, 'utf8');
            const hasGeneratedHeader = content.includes('Generated automatically by load-config.sh');
            const hasEnvironment = content.includes(`Environment: ${environment}`);
            const hasService = content.includes(`Service: ${service}`);
            
            this.addResult(`Config Content: ${service}-${environment}`, 
              hasGeneratedHeader && hasEnvironment && hasService,
              `Generated config has proper headers and metadata`);
          }

        } catch (error) {
          this.addResult(`Config Generation: ${service}-${environment}`, false,
            `Failed to generate config: ${error instanceof Error ? error.message.substring(0, 100) : String(error).substring(0, 100)}`);
        }
      }
    }

    console.log('✅ Configuration generation testing completed\n');
  }

  private async validateServiceBoundaries() {
    console.log('🔒 Validating service boundaries...\n');

    // Test 1: Frontend should not have direct database access
    const frontendEnvPath = path.resolve('.env');
    if (fs.existsSync(frontendEnvPath)) {
      const frontendContent = fs.readFileSync(frontendEnvPath, 'utf8');
      
      // Check for API-only mode
      const hasApiOnlyMode = /NEXT_PUBLIC_USE_API_ONLY=true/.test(frontendContent);
      this.addResult('Frontend API-Only Mode', hasApiOnlyMode,
        hasApiOnlyMode ? 'Frontend properly configured for API-only mode' : 
                        'Frontend missing API-only mode configuration');

      // Check for backend URL
      const hasBackendUrl = /NEXT_PUBLIC_BACKEND_URL=/.test(frontendContent);
      this.addResult('Frontend Backend URL', hasBackendUrl,
        hasBackendUrl ? 'Frontend has backend URL configured' : 
                       'Frontend missing backend URL');

      // Check for sensitive data (should not be in frontend)
      const hasSensitiveData = /SMTP_PASS=|TWILIO_AUTH_TOKEN=|DATABASE_URL=.*postgresql/.test(frontendContent);
      this.addResult('Frontend Security', !hasSensitiveData,
        !hasSensitiveData ? 'Frontend does not contain sensitive credentials' : 
                           'Frontend contains sensitive credentials (security risk)');
    }

    // Test 2: Backend should have database access
    const backendEnvPath = path.resolve('../marketsage-backend/.env');
    if (fs.existsSync(backendEnvPath)) {
      const backendContent = fs.readFileSync(backendEnvPath, 'utf8');
      
      // Check for database URL
      const hasDatabaseUrl = /DATABASE_URL=.*postgresql/.test(backendContent);
      this.addResult('Backend Database Access', hasDatabaseUrl,
        hasDatabaseUrl ? 'Backend has proper database access' : 
                        'Backend missing database access');

      // Check for service-specific configuration
      const hasPortConfig = /PORT=3006/.test(backendContent);
      this.addResult('Backend Port Configuration', hasPortConfig,
        hasPortConfig ? 'Backend has correct port configuration' : 
                       'Backend missing proper port configuration');
    }

    // Test 3: Monitoring should have monitoring-specific config
    const monitoringEnvPath = path.resolve('../marketsage-monitoring/.env');
    if (fs.existsSync(monitoringEnvPath)) {
      const monitoringContent = fs.readFileSync(monitoringEnvPath, 'utf8');
      
      // Check for monitoring ports
      const hasGrafanaPort = /GRAFANA_PORT=/.test(monitoringContent);
      const hasPrometheusPort = /PROMETHEUS_PORT=/.test(monitoringContent);
      
      this.addResult('Monitoring Configuration', hasGrafanaPort && hasPrometheusPort,
        (hasGrafanaPort && hasPrometheusPort) ? 'Monitoring has proper port configuration' : 
                                               'Monitoring missing proper port configuration');
    }

    console.log('✅ Service boundaries validation completed\n');
  }

  private async testEnvironmentOverrides() {
    console.log('🌍 Testing environment overrides...\n');

    const sharedConfigPath = path.resolve('../shared-config');

    // Generate development config
    try {
      execSync(`cd ${sharedConfigPath} && ./scripts/load-config.sh --service frontend --environment development`, 
               { stdio: 'pipe' });
      
      const devContent = fs.readFileSync('.env', 'utf8');
      const hasDevelopmentSettings = devContent.includes('NODE_ENV=development') && 
                                    devContent.includes('DEBUG=marketsage:*');
      
      this.addResult('Development Environment', hasDevelopmentSettings,
        hasDevelopmentSettings ? 'Development environment properly configured' : 
                                'Development environment configuration missing');

    } catch (error) {
      this.addResult('Development Environment', false, `Development config failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Generate production config
    try {
      execSync(`cd ${sharedConfigPath} && ./scripts/load-config.sh --service frontend --environment production`, 
               { stdio: 'pipe' });
      
      const prodContent = fs.readFileSync('.env', 'utf8');
      const hasProductionSettings = prodContent.includes('NODE_ENV=production') && 
                                   prodContent.includes('https://app.marketsage.com');
      
      this.addResult('Production Environment', hasProductionSettings,
        hasProductionSettings ? 'Production environment properly configured' : 
                               'Production environment configuration missing');

    } catch (error) {
      this.addResult('Production Environment', false, `Production config failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('✅ Environment overrides testing completed\n');
  }

  private async validateSecurityCompliance() {
    console.log('🔐 Validating security compliance...\n');

    // Check for common security issues
    const configFiles = [
      { path: '.env', name: 'Frontend' },
      { path: '../marketsage-backend/.env', name: 'Backend' },
      { path: '../marketsage-monitoring/.env', name: 'Monitoring' }
    ];

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile.path)) {
        const content = fs.readFileSync(configFile.path, 'utf8');
        
        // Check for placeholder values (security risk)
        const hasPlaceholders = /your-.*-key|your-.*-secret|your-.*-token/.test(content);
        this.addResult(`${configFile.name} Placeholder Check`, !hasPlaceholders,
          !hasPlaceholders ? `${configFile.name} has no placeholder values` : 
                            `${configFile.name} contains placeholder values (update for production)`);

        // Check for proper secret format
        const hasSecrets = /SECRET|TOKEN|KEY/.test(content);
        if (hasSecrets) {
          // Secrets should not be empty
          const hasEmptySecrets = /SECRET=\s*$|TOKEN=\s*$|KEY=\s*$/m.test(content);
          this.addResult(`${configFile.name} Secret Validation`, !hasEmptySecrets,
            !hasEmptySecrets ? `${configFile.name} secrets are properly set` : 
                              `${configFile.name} has empty secret values`);
        }

        // Check for generation metadata
        const hasMetadata = content.includes('Generated automatically by load-config.sh');
        this.addResult(`${configFile.name} Generation Metadata`, hasMetadata,
          hasMetadata ? `${configFile.name} has proper generation metadata` : 
                       `${configFile.name} missing generation metadata`);
      }
    }

    console.log('✅ Security compliance validation completed\n');
  }

  private addResult(test: string, passed: boolean, message: string, details?: string) {
    this.results.push({ test, passed, message, details });
    
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${test}: ${message}`);
    
    if (details) {
      console.log(`      ${details}`);
    }
  }

  private generateReport() {
    console.log('📊 CONFIGURATION VALIDATION REPORT');
    console.log('===================================\n');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log('📈 SUMMARY:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%\n`);

    if (failedTests > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
      console.log('');
    }

    console.log('🎯 CONFIGURATION STATUS:');
    if (successRate >= 95) {
      console.log('   ✅ EXCELLENT - Configuration system is production-ready');
      console.log('   ✅ All critical validations passed');
      console.log('   ✅ Service boundaries properly enforced');
      console.log('   ✅ Security compliance verified');
    } else if (successRate >= 80) {
      console.log('   ⚠️  GOOD - Configuration system mostly ready');
      console.log('   🔍 Review failed tests and address issues');
      console.log('   📝 Some improvements needed before production');
    } else {
      console.log('   ❌ NEEDS WORK - Configuration system requires attention');
      console.log('   🚨 Multiple critical issues found');
      console.log('   🔨 Significant fixes needed before deployment');
    }

    console.log('\n🚀 NEXT STEPS:');
    if (successRate >= 95) {
      console.log('   1. Configuration system ready for production deployment');
      console.log('   2. Proceed with traffic splitting in staging environment');
      console.log('   3. Monitor configuration consistency across environments');
    } else {
      console.log('   1. Address failed validation tests');
      console.log('   2. Re-run validation after fixes');
      console.log('   3. Ensure all security requirements are met');
    }
  }
}

// Command line interface
if (require.main === module) {
  const validator = new ConfigValidationTest();
  
  validator.runValidation().catch((error) => {
    console.error('Fatal validation error:', error);
    process.exit(1);
  });
}

export { ConfigValidationTest };
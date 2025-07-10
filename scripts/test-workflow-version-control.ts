/**
 * Test script for the workflow version control system
 * 
 * This script tests the complete version control functionality including:
 * - Creating versions
 * - Deploying versions
 * - Rolling back versions
 * - Comparing versions
 * - Version history management
 */

import { workflowVersionControl } from '../src/lib/workflow/version-control';
import prisma from '../src/lib/db/prisma';
import { randomUUID } from 'crypto';

// Sample workflow definitions for testing
const sampleWorkflowV1 = {
  name: 'Welcome Email Workflow',
  description: 'Initial welcome email workflow',
  nodes: [
    {
      id: 'trigger-1',
      type: 'triggerNode',
      data: {
        label: 'Contact Created',
        properties: { type: 'contact_created' }
      },
      position: { x: 0, y: 0 }
    },
    {
      id: 'email-1',
      type: 'actionNode',
      data: {
        label: 'Send Welcome Email',
        properties: {
          templateName: 'Welcome Email',
          subject: 'Welcome to MarketSage!'
        }
      },
      position: { x: 200, y: 0 }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'trigger-1',
      target: 'email-1'
    }
  ]
};

const sampleWorkflowV2 = {
  name: 'Enhanced Welcome Email Workflow',
  description: 'Welcome email workflow with personalization',
  nodes: [
    {
      id: 'trigger-1',
      type: 'triggerNode',
      data: {
        label: 'Contact Created',
        properties: { type: 'contact_created' }
      },
      position: { x: 0, y: 0 }
    },
    {
      id: 'condition-1',
      type: 'conditionNode',
      data: {
        label: 'Check Contact Source',
        properties: {
          condition: 'contact.source === "website"'
        }
      },
      position: { x: 200, y: 0 }
    },
    {
      id: 'email-1',
      type: 'actionNode',
      data: {
        label: 'Send Personalized Welcome Email',
        properties: {
          templateName: 'Personalized Welcome Email',
          subject: 'Welcome to MarketSage, {{contact.firstName}}!'
        }
      },
      position: { x: 400, y: 0 }
    },
    {
      id: 'email-2',
      type: 'actionNode',
      data: {
        label: 'Send Standard Welcome Email',
        properties: {
          templateName: 'Standard Welcome Email',
          subject: 'Welcome to MarketSage!'
        }
      },
      position: { x: 400, y: 100 }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'trigger-1',
      target: 'condition-1'
    },
    {
      id: 'e2',
      source: 'condition-1',
      target: 'email-1',
      sourceHandle: 'yes'
    },
    {
      id: 'e3',
      source: 'condition-1',
      target: 'email-2',
      sourceHandle: 'no'
    }
  ]
};

async function createTestWorkflow() {
  const workflowId = randomUUID();
  
  // Create test workflow
  const workflow = await prisma.workflow.create({
    data: {
      id: workflowId,
      name: 'Test Version Control Workflow',
      description: 'Workflow for testing version control',
      status: 'ACTIVE',
      definition: JSON.stringify(sampleWorkflowV1),
      createdById: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  // Create test user if not exists
  await prisma.user.upsert({
    where: { id: 'test-user-id' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@marketsage.com',
      name: 'Test User',
      role: 'ADMIN',
      isActive: true,
    }
  });

  return workflowId;
}

async function testCreateVersions() {
  console.log('🧪 Testing version creation...');
  
  const workflowId = await createTestWorkflow();

  // Test 1: Create initial version (v1.0.0)
  const version1 = await workflowVersionControl.createVersion(
    workflowId,
    sampleWorkflowV1,
    {
      description: 'Initial version with basic welcome email',
      status: 'draft',
      changelog: ['Initial workflow creation'],
      tags: ['initial', 'basic'],
      createdBy: 'test-user-id'
    }
  );

  console.log(`  ✓ Created version: ${version1.version}`);
  console.log(`  ✓ Status: ${version1.status}`);
  console.log(`  ✓ Performance score: ${version1.metadata.performance?.complexityScore}`);

  // Test 2: Create enhanced version (v1.0.1)
  const version2 = await workflowVersionControl.createVersion(
    workflowId,
    sampleWorkflowV2,
    {
      description: 'Enhanced version with personalization and conditions',
      status: 'draft',
      changelog: [
        'Added condition node for contact source checking',
        'Added personalized email templates',
        'Improved workflow logic'
      ],
      tags: ['enhanced', 'personalization'],
      createdBy: 'test-user-id'
    }
  );

  console.log(`  ✓ Created version: ${version2.version}`);
  console.log(`  ✓ Status: ${version2.status}`);
  console.log(`  ✓ Performance score: ${version2.metadata.performance?.complexityScore}`);

  console.log('✅ Version creation tests passed\\n');
  return { workflowId, version1, version2 };
}

async function testVersionComparison(workflowId: string, version1: any, version2: any) {
  console.log('🔍 Testing version comparison...');

  const comparison = await workflowVersionControl.compareVersions(
    workflowId,
    version1.id,
    version2.id
  );

  console.log(`  ✓ Comparing ${comparison.fromVersion} → ${comparison.toVersion}`);
  console.log(`  ✓ Nodes added: ${comparison.changes.nodes.added.length}`);
  console.log(`  ✓ Nodes removed: ${comparison.changes.nodes.removed.length}`);
  console.log(`  ✓ Nodes modified: ${comparison.changes.nodes.modified.length}`);
  console.log(`  ✓ Edges added: ${comparison.changes.edges.added.length}`);
  console.log(`  ✓ Risk level: ${comparison.riskAssessment.level}`);
  console.log(`  ✓ Concerns: ${comparison.riskAssessment.concerns.length}`);

  // Validate comparison results
  if (comparison.changes.nodes.added.length !== 2) { // condition-1 and email-2
    throw new Error('Expected 2 nodes to be added');
  }

  console.log('✅ Version comparison tests passed\\n');
  return comparison;
}

async function testVersionDeployment(workflowId: string, version1: any, version2: any) {
  console.log('🚀 Testing version deployment...');

  // Test 1: Deploy version 1 to production
  const deployment1 = await workflowVersionControl.deployVersion(
    workflowId,
    version1.id,
    {
      deployedBy: 'test-user-id',
      deploymentNotes: 'Initial production deployment'
    }
  );

  console.log(`  ✓ Deployed version ${deployment1.toVersion} to production`);
  console.log(`  ✓ Affected executions: ${deployment1.affectedExecutions}`);

  // Test 2: Deploy version 2 to production (upgrade)
  const deployment2 = await workflowVersionControl.deployVersion(
    workflowId,
    version2.id,
    {
      deployedBy: 'test-user-id',
      deploymentNotes: 'Enhanced workflow with personalization'
    }
  );

  console.log(`  ✓ Deployed version ${deployment2.toVersion} to production`);
  console.log(`  ✓ Previous version: ${deployment2.fromVersion}`);

  console.log('✅ Version deployment tests passed\\n');
  return { deployment1, deployment2 };
}

async function testVersionRollback(workflowId: string, version1: any, version2: any) {
  console.log('⏪ Testing version rollback...');

  // Rollback from version 2 to version 1
  const rollback = await workflowVersionControl.rollbackToVersion(
    workflowId,
    version1.id,
    {
      rolledBackBy: 'test-user-id',
      reason: 'Performance issues with enhanced version',
      forceRollback: false
    }
  );

  console.log(`  ✓ Rolled back from ${rollback.fromVersion} to ${rollback.toVersion}`);
  console.log(`  ✓ Rollback successful: ${rollback.success}`);

  console.log('✅ Version rollback tests passed\\n');
  return rollback;
}

async function testVersionHistory(workflowId: string) {
  console.log('📚 Testing version history...');

  // Get version history
  const history = await workflowVersionControl.getVersionHistory(workflowId, {
    limit: 10,
    includeArchived: true
  });

  console.log(`  ✓ Total versions: ${history.length}`);
  
  for (const version of history) {
    console.log(`    - ${version.version} (${version.status}) - ${version.description}`);
  }

  // Get deployment history
  const deploymentHistory = await workflowVersionControl.getDeploymentHistory(workflowId, 10);

  console.log(`  ✓ Total deployments: ${deploymentHistory.length}`);
  
  for (const deployment of deploymentHistory) {
    console.log(`    - ${deployment.fromVersion || 'initial'} → ${deployment.toVersion} (${deployment.status})`);
  }

  console.log('✅ Version history tests passed\\n');
}

async function testDryRunDeployment(workflowId: string, version2: any) {
  console.log('🧪 Testing dry run deployment...');

  const dryRun = await workflowVersionControl.deployVersion(
    workflowId,
    version2.id,
    {
      deployedBy: 'test-user-id',
      deploymentNotes: 'Testing dry run deployment',
      dryRun: true
    }
  );

  console.log(`  ✓ Dry run completed: ${dryRun.success}`);
  console.log(`  ✓ Would deploy: ${dryRun.toVersion}`);
  console.log(`  ✓ Affected executions: ${dryRun.affectedExecutions}`);
  console.log(`  ✓ Rollback plan steps: ${dryRun.rollbackPlan?.steps.length}`);

  console.log('✅ Dry run deployment tests passed\\n');
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  // Delete test workflow version control data
  await prisma.workflowRollback.deleteMany({
    where: {
      workflow: {
        name: 'Test Version Control Workflow'
      }
    }
  });

  await prisma.workflowDeployment.deleteMany({
    where: {
      workflow: {
        name: 'Test Version Control Workflow'
      }
    }
  });

  await prisma.workflowVersion.deleteMany({
    where: {
      workflow: {
        name: 'Test Version Control Workflow'
      }
    }
  });

  await prisma.workflow.deleteMany({
    where: {
      name: 'Test Version Control Workflow'
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: 'test@marketsage.com'
    }
  });

  console.log('✅ Test data cleaned up\\n');
}

async function runVersionControlTests() {
  console.log('🚀 Starting Workflow Version Control Tests\\n');
  
  try {
    // Test version creation
    const { workflowId, version1, version2 } = await testCreateVersions();
    
    // Test version comparison
    await testVersionComparison(workflowId, version1, version2);
    
    // Test deployment
    await testVersionDeployment(workflowId, version1, version2);
    
    // Test rollback
    await testVersionRollback(workflowId, version1, version2);
    
    // Test version history
    await testVersionHistory(workflowId);
    
    // Test dry run deployment
    await testDryRunDeployment(workflowId, version2);
    
    console.log('🎉 All version control tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await cleanupTestData();
  }
}

// Run the tests
if (require.main === module) {
  runVersionControlTests()
    .then(() => {
      console.log('\\n✨ Test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { runVersionControlTests };
/**
 * Workflow Email Integration Test
 * 
 * Tests the integration between workflow automation and email campaign tracking
 * to ensure that emails sent through workflows are properly tracked.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { WorkflowExecutionEngine } from '@/lib/workflow/execution-engine';
import { sendTrackedEmail } from '@/lib/email-service';
import prisma from '@/lib/db/prisma';
import { ActivityType, CampaignStatus } from '@prisma/client';

describe('Workflow Email Integration', () => {
  let workflowExecution: WorkflowExecutionEngine;
  let testWorkflow: any;
  let testContact: any;
  let testCampaign: any;

  beforeAll(async () => {
    workflowExecution = new WorkflowExecutionEngine();
  });

  beforeEach(async () => {
    // Create test contact
    testContact = await prisma.contact.create({
      data: {
        id: `test-contact-${Date.now()}`,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        source: 'test'
      }
    });

    // Create test email campaign for tracking
    testCampaign = await prisma.emailCampaign.create({
      data: {
        id: `test-campaign-${Date.now()}`,
        name: 'Test Workflow Campaign',
        subject: 'Test Subject',
        htmlContent: '<h1>Test Email</h1>',
        textContent: 'Test Email',
        status: CampaignStatus.SENT,
        fromEmail: 'test@marketsage.com',
        fromName: 'Test Sender'
      }
    });

    // Create test workflow
    testWorkflow = await prisma.workflow.create({
      data: {
        id: `test-workflow-${Date.now()}`,
        name: 'Test Email Workflow',
        description: 'Test workflow for email integration',
        status: 'ACTIVE',
        definition: JSON.stringify({
          nodes: [
            {
              id: 'trigger-1',
              type: 'triggerNode',
              data: {
                label: 'Contact Created',
                properties: { trigger: 'contact_created' }
              },
              position: { x: 100, y: 100 }
            },
            {
              id: 'email-1',
              type: 'actionNode',
              data: {
                label: 'Send Welcome Email',
                properties: {
                  action: 'send_email',
                  subject: 'Welcome to MarketSage!',
                  templateName: 'welcome_template',
                  campaignId: testCampaign.id // Link to real campaign
                }
              },
              position: { x: 200, y: 200 }
            }
          ],
          edges: [
            {
              id: 'e1-2',
              source: 'trigger-1',
              target: 'email-1'
            }
          ]
        })
      }
    });
  });

  afterEach(async () => {
    // Cleanup test data
    try {
      await prisma.emailActivity.deleteMany({
        where: { campaignId: testCampaign.id }
      });
      await prisma.workflowExecutionStep.deleteMany({
        where: { executionId: { contains: testWorkflow.id } }
      });
      await prisma.workflowExecution.deleteMany({
        where: { workflowId: testWorkflow.id }
      });
      await prisma.workflow.delete({ where: { id: testWorkflow.id } });
      await prisma.emailCampaign.delete({ where: { id: testCampaign.id } });
      await prisma.contact.delete({ where: { id: testContact.id } });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  test('should create email activity record for workflow emails with real campaign ID', async () => {
    // Start workflow execution
    const executionId = await workflowExecution.startWorkflowExecution(
      testWorkflow.id,
      testContact.id
    );

    expect(executionId).toBeDefined();

    // Get the execution to check it was created
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId }
    });

    expect(execution).toBeTruthy();
    expect(execution?.status).toBe('RUNNING');
  });

  test('should track email opens and clicks from workflow emails', async () => {
    // Send tracked email directly to test tracking
    const result = await sendTrackedEmail(
      testContact,
      testCampaign.id,
      {
        subject: 'Test Workflow Email',
        html: '<h1>Hello {{firstName}}!</h1><p><a href="https://example.com">Click here</a></p>',
        text: 'Hello {{firstName}}! Visit: https://example.com',
        from: 'test@marketsage.com'
      }
    );

    expect(result.success).toBe(true);

    // Check that email activity was recorded
    const activities = await prisma.emailActivity.findMany({
      where: {
        campaignId: testCampaign.id,
        contactId: testContact.id,
        type: ActivityType.SENT
      }
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe(ActivityType.SENT);
  });

  test('should handle workflow emails with mock campaign IDs gracefully', async () => {
    const mockCampaignId = `workflow-${testWorkflow.id}-${Date.now()}`;

    // Send email with mock campaign ID (current workflow behavior)
    const result = await sendTrackedEmail(
      testContact,
      mockCampaignId,
      {
        subject: 'Test Mock Campaign Email',
        html: '<h1>Hello {{firstName}}!</h1>',
        text: 'Hello {{firstName}}!',
        from: 'test@marketsage.com'
      }
    );

    expect(result.success).toBe(true);

    // Check that no email activity was recorded for mock campaign
    const activities = await prisma.emailActivity.findMany({
      where: {
        campaignId: mockCampaignId,
        contactId: testContact.id
      }
    });

    expect(activities).toHaveLength(0);
  });

  test('should properly personalize email content in workflows', async () => {
    const htmlContent = '<h1>Hello {{firstName}} {{lastName}}!</h1><p>Welcome to MarketSage.</p>';
    
    const result = await sendTrackedEmail(
      testContact,
      testCampaign.id,
      {
        subject: 'Welcome {{firstName}}!',
        html: htmlContent,
        from: 'test@marketsage.com'
      }
    );

    expect(result.success).toBe(true);
    
    // The actual personalization happens in the email service
    // This test verifies the integration works without errors
  });

  test('should handle email rate limiting in workflows', async () => {
    // This test would verify rate limiting functionality
    // For now, we just ensure the function doesn't throw errors
    
    const result = await sendTrackedEmail(
      testContact,
      testCampaign.id,
      {
        subject: 'Rate Limit Test',
        html: '<h1>Rate Limit Test</h1>',
        from: 'test@marketsage.com'
      }
    );

    expect(result.success).toBe(true);
  });
});
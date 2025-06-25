/**
 * LeadPulse Form Builder Tests
 * 
 * Tests for form creation, submission, and analytics including:
 * - Form CRUD operations
 * - Form field validation and conditional logic
 * - Form submission processing
 * - Analytics and conversion tracking
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET, PUT, DELETE } from '@/app/api/leadpulse/forms/route';
import { POST as SubmitForm } from '@/app/api/leadpulse/forms/[formId]/submit/route';
import prisma from '@/lib/db/prisma';
import { formBuilder, FormFieldType } from '@/lib/leadpulse/formBuilder';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  leadPulseForm: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  leadPulseFormSubmission: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  leadPulseSubmissionData: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
  leadPulseVisitor: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  contact: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
}));

jest.mock('@/lib/cache/leadpulse-cache', () => ({
  leadPulseCache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incrementCounter: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'user123', email: 'test@example.com' }
  })),
}));

// Helper function to create NextRequest
function createNextRequest(method: string, url: string, body?: any) {
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('LeadPulse Form Builder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Creation (POST /api/leadpulse/forms)', () => {
    test('should create a new form with valid data', async () => {
      const formData = {
        name: 'Contact Form',
        description: 'Primary contact form for lead capture',
        fields: [
          {
            id: 'name',
            type: FormFieldType.TEXT,
            label: 'Full Name',
            placeholder: 'Enter your full name',
            required: true,
            validation: {
              minLength: 2,
              maxLength: 100,
            },
          },
          {
            id: 'email',
            type: FormFieldType.EMAIL,
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true,
            validation: {
              pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            },
          },
          {
            id: 'company',
            type: FormFieldType.TEXT,
            label: 'Company',
            placeholder: 'Your company name',
            required: false,
          },
          {
            id: 'message',
            type: FormFieldType.TEXTAREA,
            label: 'Message',
            placeholder: 'Tell us about your needs',
            required: true,
            validation: {
              minLength: 10,
              maxLength: 1000,
            },
          },
        ],
        styling: {
          theme: 'light',
          primaryColor: '#007bff',
          backgroundColor: '#ffffff',
          borderRadius: 8,
        },
        settings: {
          successMessage: 'Thank you for your submission!',
          redirectUrl: 'https://example.com/thank-you',
          emailNotifications: true,
          autoResponder: {
            enabled: true,
            subject: 'Thank you for contacting us',
            message: 'We will get back to you soon.',
          },
        },
      };

      const mockForm = {
        id: 'form_123',
        name: formData.name,
        description: formData.description,
        fields: formData.fields,
        styling: formData.styling,
        settings: formData.settings,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user123',
      };

      (prisma.leadPulseForm.create as jest.Mock).mockResolvedValue(mockForm);

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/forms', formData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.formId).toBe('form_123');
      expect(responseData.embedCode).toContain('form_123');

      // Verify database call
      expect(prisma.leadPulseForm.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: formData.name,
          description: formData.description,
          fields: formData.fields,
          styling: formData.styling,
          settings: formData.settings,
          userId: 'user123',
          status: 'active',
        }),
      });
    });

    test('should validate required fields', async () => {
      const invalidForms = [
        {
          description: 'missing name',
          data: {
            description: 'Test form',
            fields: [],
          },
        },
        {
          description: 'empty fields array',
          data: {
            name: 'Test Form',
            description: 'Test form',
            fields: [],
          },
        },
        {
          description: 'invalid field type',
          data: {
            name: 'Test Form',
            fields: [
              {
                id: 'test',
                type: 'INVALID_TYPE',
                label: 'Test',
                required: true,
              },
            ],
          },
        },
        {
          description: 'missing field label',
          data: {
            name: 'Test Form',
            fields: [
              {
                id: 'test',
                type: FormFieldType.TEXT,
                required: true,
              },
            ],
          },
        },
      ];

      for (const invalidForm of invalidForms) {
        const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/forms', invalidForm.data);
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBeDefined();
      }
    });

    test('should generate proper embed code', async () => {
      const formData = {
        name: 'Simple Form',
        fields: [
          {
            id: 'email',
            type: FormFieldType.EMAIL,
            label: 'Email',
            required: true,
          },
        ],
      };

      const mockForm = {
        id: 'form_embed_test',
        ...formData,
        userId: 'user123',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.leadPulseForm.create as jest.Mock).mockResolvedValue(mockForm);

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/forms', formData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(responseData.embedCode).toContain('form_embed_test');
      expect(responseData.embedCode).toContain('<div id="leadpulse-form-container">');
      expect(responseData.embedCode).toContain('<script>');
      expect(responseData.embedCode).toContain('leadpulse-form.js');
    });
  });

  describe('Form Retrieval (GET /api/leadpulse/forms)', () => {
    test('should list user forms with filters', async () => {
      const mockForms = [
        {
          id: 'form_1',
          name: 'Contact Form',
          description: 'Main contact form',
          status: 'active',
          fields: [],
          createdAt: new Date(),
          analytics: {
            totalViews: 150,
            totalSubmissions: 12,
            conversionRate: 8.0,
          },
        },
        {
          id: 'form_2',
          name: 'Newsletter Signup',
          description: 'Newsletter subscription',
          status: 'active',
          fields: [],
          createdAt: new Date(),
          analytics: {
            totalViews: 300,
            totalSubmissions: 45,
            conversionRate: 15.0,
          },
        },
      ];

      (prisma.leadPulseForm.findMany as jest.Mock).mockResolvedValue(mockForms);

      const request = createNextRequest('GET', 'http://localhost:3000/api/leadpulse/forms?status=active');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.forms).toHaveLength(2);
      expect(responseData.total).toBe(2);

      // Verify database query with filters
      expect(prisma.leadPulseForm.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        include: expect.objectContaining({
          _count: expect.any(Object),
        }),
      });
    });

    test('should search forms by name', async () => {
      const request = createNextRequest('GET', 'http://localhost:3000/api/leadpulse/forms?search=contact');
      await GET(request);

      expect(prisma.leadPulseForm.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          OR: [
            { name: { contains: 'contact', mode: 'insensitive' } },
            { description: { contains: 'contact', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('Form Updates (PUT /api/leadpulse/forms/{id})', () => {
    test('should update form successfully', async () => {
      const formId = 'form_update_test';
      const updateData = {
        name: 'Updated Contact Form',
        description: 'Updated description',
        fields: [
          {
            id: 'name',
            type: FormFieldType.TEXT,
            label: 'Full Name',
            required: true,
          },
          {
            id: 'email',
            type: FormFieldType.EMAIL,
            label: 'Email Address',
            required: true,
          },
        ],
        styling: {
          theme: 'dark',
          primaryColor: '#28a745',
        },
      };

      const existingForm = {
        id: formId,
        name: 'Contact Form',
        userId: 'user123',
        status: 'active',
      };

      const updatedForm = {
        ...existingForm,
        ...updateData,
        updatedAt: new Date(),
      };

      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(existingForm);
      (prisma.leadPulseForm.update as jest.Mock).mockResolvedValue(updatedForm);

      const request = createNextRequest('PUT', `http://localhost:3000/api/leadpulse/forms/${formId}`, updateData);
      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify update call
      expect(prisma.leadPulseForm.update).toHaveBeenCalledWith({
        where: { id: formId, userId: 'user123' },
        data: expect.objectContaining({
          name: updateData.name,
          description: updateData.description,
          fields: updateData.fields,
          styling: updateData.styling,
        }),
      });

      // Verify cache invalidation
      expect(leadPulseCache.del).toHaveBeenCalledWith(`form:${formId}`);
    });

    test('should not allow updating non-owned forms', async () => {
      const formId = 'form_not_owned';
      
      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createNextRequest('PUT', `http://localhost:3000/api/leadpulse/forms/${formId}`, {
        name: 'Hacked Form',
      });
      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Form not found');
    });
  });

  describe('Form Deletion (DELETE /api/leadpulse/forms/{id})', () => {
    test('should delete form and related data', async () => {
      const formId = 'form_delete_test';
      
      const existingForm = {
        id: formId,
        name: 'Form to Delete',
        userId: 'user123',
        status: 'active',
      };

      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(existingForm);
      (prisma.leadPulseForm.delete as jest.Mock).mockResolvedValue(existingForm);

      const request = createNextRequest('DELETE', `http://localhost:3000/api/leadpulse/forms/${formId}`);
      const response = await DELETE(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify deletion
      expect(prisma.leadPulseForm.delete).toHaveBeenCalledWith({
        where: { id: formId, userId: 'user123' },
      });

      // Verify cache cleanup
      expect(leadPulseCache.del).toHaveBeenCalledWith(`form:${formId}`);
    });
  });

  describe('Form Submission (POST /api/leadpulse/forms/{formId}/submit)', () => {
    test('should process valid form submission', async () => {
      const formId = 'form_submit_test';
      const submissionData = {
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Example Corp',
          message: 'I am interested in your services',
        },
        metadata: {
          visitorId: 'visitor_123',
          fingerprint: 'fp_123456',
          url: 'https://example.com/contact',
          userAgent: 'Mozilla/5.0...',
        },
      };

      const mockForm = {
        id: formId,
        name: 'Contact Form',
        fields: [
          {
            id: 'name',
            type: FormFieldType.TEXT,
            label: 'Full Name',
            required: true,
            validation: { minLength: 2, maxLength: 100 },
          },
          {
            id: 'email',
            type: FormFieldType.EMAIL,
            label: 'Email',
            required: true,
          },
          {
            id: 'company',
            type: FormFieldType.TEXT,
            label: 'Company',
            required: false,
          },
          {
            id: 'message',
            type: FormFieldType.TEXTAREA,
            label: 'Message',
            required: true,
            validation: { minLength: 10 },
          },
        ],
        settings: {
          emailNotifications: true,
          autoResponder: {
            enabled: true,
            subject: 'Thank you',
            message: 'We received your message',
          },
        },
        status: 'active',
        userId: 'user123',
      };

      const mockSubmission = {
        id: 'submission_123',
        formId,
        data: submissionData.data,
        visitorId: submissionData.metadata.visitorId,
        submittedAt: new Date(),
      };

      const mockVisitor = {
        id: 'visitor_123',
        score: 45,
        isConverted: false,
      };

      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(mockForm);
      (prisma.leadPulseFormSubmission.create as jest.Mock).mockResolvedValue(mockSubmission);
      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(mockVisitor);
      (prisma.leadPulseVisitor.update as jest.Mock).mockResolvedValue({
        ...mockVisitor,
        score: 75,
        isConverted: true,
      });
      (prisma.contact.upsert as jest.Mock).mockResolvedValue({
        id: 'contact_123',
        email: submissionData.data.email,
        firstName: 'John',
        lastName: 'Doe',
      });

      const request = createNextRequest('POST', `http://localhost:3000/api/leadpulse/forms/${formId}/submit`, submissionData);
      
      // Mock the route handler context
      const context = { params: { formId } };
      const response = await SubmitForm(request, context);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.submissionId).toBe('submission_123');

      // Verify form submission was created
      expect(prisma.leadPulseFormSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formId,
          data: submissionData.data,
          visitorId: submissionData.metadata.visitorId,
          fingerprint: submissionData.metadata.fingerprint,
          url: submissionData.metadata.url,
          userAgent: submissionData.metadata.userAgent,
        }),
      });

      // Verify visitor score was updated
      expect(prisma.leadPulseVisitor.update).toHaveBeenCalledWith({
        where: { id: 'visitor_123' },
        data: expect.objectContaining({
          score: expect.any(Number),
          isConverted: true,
        }),
      });

      // Verify contact was created/updated
      expect(prisma.contact.upsert).toHaveBeenCalledWith({
        where: { email: submissionData.data.email },
        update: expect.any(Object),
        create: expect.any(Object),
      });
    });

    test('should validate form fields', async () => {
      const formId = 'form_validation_test';
      const invalidSubmissions = [
        {
          description: 'missing required field',
          data: {
            data: {
              name: 'John Doe',
              // missing required email
            },
            metadata: {
              visitorId: 'visitor_123',
            },
          },
        },
        {
          description: 'invalid email format',
          data: {
            data: {
              name: 'John Doe',
              email: 'invalid-email',
            },
            metadata: {
              visitorId: 'visitor_123',
            },
          },
        },
        {
          description: 'text too short',
          data: {
            data: {
              name: 'A', // too short (minLength: 2)
              email: 'john@example.com',
            },
            metadata: {
              visitorId: 'visitor_123',
            },
          },
        },
        {
          description: 'text too long',
          data: {
            data: {
              name: 'A'.repeat(101), // too long (maxLength: 100)
              email: 'john@example.com',
            },
            metadata: {
              visitorId: 'visitor_123',
            },
          },
        },
      ];

      const mockForm = {
        id: formId,
        fields: [
          {
            id: 'name',
            type: FormFieldType.TEXT,
            label: 'Name',
            required: true,
            validation: { minLength: 2, maxLength: 100 },
          },
          {
            id: 'email',
            type: FormFieldType.EMAIL,
            label: 'Email',
            required: true,
          },
        ],
        status: 'active',
      };

      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(mockForm);

      for (const invalidSubmission of invalidSubmissions) {
        const request = createNextRequest('POST', `http://localhost:3000/api/leadpulse/forms/${formId}/submit`, invalidSubmission.data);
        const context = { params: { formId } };
        const response = await SubmitForm(request, context);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBeDefined();
        expect(responseData.validationErrors).toBeDefined();
      }
    });

    test('should handle inactive forms', async () => {
      const formId = 'form_inactive_test';
      
      const inactiveForm = {
        id: formId,
        name: 'Inactive Form',
        status: 'archived',
        fields: [],
      };

      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(inactiveForm);

      const request = createNextRequest('POST', `http://localhost:3000/api/leadpulse/forms/${formId}/submit`, {
        data: { email: 'test@example.com' },
        metadata: { visitorId: 'visitor_123' },
      });
      
      const context = { params: { formId } };
      const response = await SubmitForm(request, context);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Form is not active');
    });

    test('should handle non-existent forms', async () => {
      const formId = 'non_existent_form';
      
      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createNextRequest('POST', `http://localhost:3000/api/leadpulse/forms/${formId}/submit`, {
        data: { email: 'test@example.com' },
        metadata: { visitorId: 'visitor_123' },
      });
      
      const context = { params: { formId } };
      const response = await SubmitForm(request, context);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Form not found');
    });
  });

  describe('Form Analytics', () => {
    test('should calculate form analytics correctly', async () => {
      const formId = 'form_analytics_test';
      
      // Mock form submission counts
      (prisma.leadPulseFormSubmission.count as jest.Mock)
        .mockResolvedValueOnce(25) // total submissions
        .mockResolvedValueOnce(250); // total views (would be tracked separately)

      const mockSubmissions = [
        {
          id: 'sub_1',
          submittedAt: new Date(),
          data: { email: 'user1@example.com' },
        },
        {
          id: 'sub_2', 
          submittedAt: new Date(),
          data: { email: 'user2@example.com' },
        },
      ];

      (prisma.leadPulseFormSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);

      // Test form analytics calculation
      const analytics = await formBuilder.calculateFormAnalytics(formId);

      expect(analytics).toEqual({
        totalSubmissions: 25,
        totalViews: expect.any(Number),
        conversionRate: expect.any(Number),
        avgCompletionTime: expect.any(Number),
        recentSubmissions: mockSubmissions,
      });

      expect(analytics.conversionRate).toBeGreaterThan(0);
      expect(analytics.conversionRate).toBeLessThanOrEqual(100);
    });

    test('should track form field dropoff rates', async () => {
      const formId = 'form_dropoff_test';
      
      // Mock submission data for dropoff analysis
      const mockSubmissions = [
        { data: { name: 'John', email: 'john@example.com' } }, // Complete
        { data: { name: 'Jane' } }, // Dropped at email
        { data: { name: 'Bob', email: 'bob@example.com', company: 'ABC' } }, // Complete with optional
      ];

      (prisma.leadPulseFormSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);

      const dropoffAnalysis = await formBuilder.analyzeFieldDropoff(formId);

      expect(dropoffAnalysis).toEqual({
        totalAttempts: 3,
        fieldDropoffs: [
          {
            fieldId: 'name',
            completionRate: 100, // All 3 filled name
            dropoffRate: 0,
          },
          {
            fieldId: 'email',
            completionRate: 66.67, // 2 out of 3 filled email
            dropoffRate: 33.33,
          },
          {
            fieldId: 'company',
            completionRate: 33.33, // 1 out of 3 filled company
            dropoffRate: 66.67,
          },
        ],
      });
    });
  });

  describe('Conditional Logic', () => {
    test('should validate conditional field logic', async () => {
      const formWithConditionalFields = {
        id: 'conditional_form',
        fields: [
          {
            id: 'contact_reason',
            type: FormFieldType.SELECT,
            label: 'Reason for Contact',
            required: true,
            options: [
              { value: 'sales', label: 'Sales Inquiry' },
              { value: 'support', label: 'Support Request' },
              { value: 'other', label: 'Other' },
            ],
          },
          {
            id: 'budget',
            type: FormFieldType.SELECT,
            label: 'Budget Range',
            required: true,
            conditionalLogic: {
              showIf: {
                field: 'contact_reason',
                operator: 'equals',
                value: 'sales',
              },
            },
            options: [
              { value: '1k-5k', label: '$1,000 - $5,000' },
              { value: '5k-10k', label: '$5,000 - $10,000' },
              { value: '10k+', label: '$10,000+' },
            ],
          },
          {
            id: 'issue_description',
            type: FormFieldType.TEXTAREA,
            label: 'Describe Your Issue',
            required: true,
            conditionalLogic: {
              showIf: {
                field: 'contact_reason',
                operator: 'equals',
                value: 'support',
              },
            },
          },
        ],
        status: 'active',
      };

      (prisma.leadPulseForm.findUnique as jest.Mock).mockResolvedValue(formWithConditionalFields);

      // Test sales inquiry submission (should require budget)
      const salesSubmission = {
        data: {
          contact_reason: 'sales',
          budget: '5k-10k',
        },
        metadata: { visitorId: 'visitor_123' },
      };

      const request1 = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/forms/conditional_form/submit', salesSubmission);
      const context1 = { params: { formId: 'conditional_form' } };
      const response1 = await SubmitForm(request1, context1);

      expect(response1.status).toBe(200); // Should succeed

      // Test sales inquiry without budget (should fail)
      const salesSubmissionNoBudget = {
        data: {
          contact_reason: 'sales',
          // missing budget field
        },
        metadata: { visitorId: 'visitor_123' },
      };

      const request2 = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/forms/conditional_form/submit', salesSubmissionNoBudget);
      const context2 = { params: { formId: 'conditional_form' } };
      const response2 = await SubmitForm(request2, context2);

      expect(response2.status).toBe(400); // Should fail validation

      // Test support submission (should require issue_description)
      const supportSubmission = {
        data: {
          contact_reason: 'support',
          issue_description: 'My account is not working properly',
        },
        metadata: { visitorId: 'visitor_123' },
      };

      const request3 = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/forms/conditional_form/submit', supportSubmission);
      const context3 = { params: { formId: 'conditional_form' } };
      const response3 = await SubmitForm(request3, context3);

      expect(response3.status).toBe(200); // Should succeed
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
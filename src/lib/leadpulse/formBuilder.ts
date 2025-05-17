/**
 * LeadPulse Form Builder
 * 
 * This module provides utilities for creating and managing the
 * dynamic form builder functionality and processing form submissions.
 */

import { randomUUID } from 'crypto';
import prisma from '@/lib/db/prisma';

/**
 * Form field type definitions
 */
export enum FieldType {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  NUMBER = 'NUMBER',
  TEXTAREA = 'TEXTAREA',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DATE = 'DATE',
  HIDDEN = 'HIDDEN',
  FILE = 'FILE',
}

/**
 * Form field validation rules
 */
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
}

/**
 * Form field options for select, checkbox, radio
 */
export interface FieldOption {
  label: string;
  value: string;
}

/**
 * Form field definition
 */
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: FieldOption[];
  css?: Record<string, any>;
}

/**
 * Conditional logic for showing/hiding fields
 */
export interface ConditionalLogic {
  fieldId: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
  value: string;
  action: 'SHOW' | 'HIDE';
  targetFieldIds: string[];
}

/**
 * Form design settings
 */
export interface FormDesignSettings {
  theme: 'light' | 'dark' | 'custom';
  fontFamily?: string;
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  buttonText?: string;
  customCSS?: string;
  successMessage?: string;
  width?: string;
  alignment?: 'left' | 'center' | 'right';
  animation?: 'none' | 'fade' | 'slide' | 'bounce';
}

/**
 * Create a new form
 * 
 * @param userId - ID of the user creating the form
 * @param data - Form configuration data
 * @returns The created form record
 */
export async function createForm(
  userId: string,
  data: {
    name: string;
    description?: string;
    formType?: 'STANDARD' | 'EXIT_INTENT' | 'EMBEDDED' | 'POPUP' | 'CHATBOT' | 'PROGRESSIVE';
    fields: FormField[];
    conditionalLogic?: ConditionalLogic[];
    designSettings?: FormDesignSettings;
  }
) {
  // Validate form fields
  if (!data.fields || data.fields.length === 0) {
    throw new Error('Form must have at least one field');
  }
  
  // Create the form
  return prisma.leadPulseForm.create({
    data: {
      id: randomUUID(),
      name: data.name,
      description: data.description,
      formType: data.formType || 'STANDARD',
      fields: JSON.stringify(data.fields),
      conditionalLogic: data.conditionalLogic ? JSON.stringify(data.conditionalLogic) : null,
      designSettings: data.designSettings ? JSON.stringify(data.designSettings) : null,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      conversionRate: 0,
      submissions: 0,
      views: 0
    }
  });
}

/**
 * Update an existing form
 * 
 * @param formId - ID of the form to update
 * @param data - Updated form data
 * @returns The updated form record
 */
export async function updateForm(
  formId: string,
  data: {
    name?: string;
    description?: string;
    formType?: 'STANDARD' | 'EXIT_INTENT' | 'EMBEDDED' | 'POPUP' | 'CHATBOT' | 'PROGRESSIVE';
    fields?: FormField[];
    conditionalLogic?: ConditionalLogic[];
    designSettings?: FormDesignSettings;
    isActive?: boolean;
  }
) {
  // Create update object
  const updateData: Record<string, any> = {
    updatedAt: new Date()
  };
  
  // Add optional fields if provided
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.formType !== undefined) updateData.formType = data.formType;
  if (data.fields !== undefined) updateData.fields = JSON.stringify(data.fields);
  if (data.conditionalLogic !== undefined) {
    updateData.conditionalLogic = data.conditionalLogic 
      ? JSON.stringify(data.conditionalLogic) 
      : null;
  }
  if (data.designSettings !== undefined) {
    updateData.designSettings = data.designSettings 
      ? JSON.stringify(data.designSettings) 
      : null;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  // Update the form
  return prisma.leadPulseForm.update({
    where: { id: formId },
    data: updateData
  });
}

/**
 * Track a form view
 * 
 * @param formId - ID of the form
 * @param visitorId - ID of the visitor viewing the form
 */
export async function trackFormView(formId: string, visitorId: string) {
  // Increment form view count
  await prisma.leadPulseForm.update({
    where: { id: formId },
    data: {
      views: {
        increment: 1
      }
    }
  });
  
  // Associate the visitor with the form
  await prisma.anonymousVisitor.update({
    where: { id: visitorId },
    data: {
      LeadPulseForm: {
        connect: { id: formId }
      }
    }
  });
}

/**
 * Process a form submission
 * 
 * @param formId - ID of the form
 * @param visitorId - ID of the visitor submitting the form
 * @param formData - Submitted form data
 * @returns Success status and any created contact
 */
export async function processFormSubmission(
  formId: string,
  visitorId: string,
  formData: Record<string, any>
) {
  // Get the form configuration
  const form = await prisma.leadPulseForm.update({
    where: { id: formId },
    data: {
      submissions: {
        increment: 1
      }
    }
  });
  
  // Update conversion rate
  const conversionRate = form.submissions / (form.views || 1);
  await prisma.leadPulseForm.update({
    where: { id: formId },
    data: {
      conversionRate
    }
  });
  
  // Get the visitor
  const visitor = await prisma.anonymousVisitor.findUnique({
    where: { id: visitorId }
  });
  
  if (!visitor) {
    throw new Error(`Visitor not found: ${visitorId}`);
  }
  
  // Extract contact information from form data
  const contactData: Record<string, any> = {};
  
  // Parse form fields to map form data to contact fields
  const fields = JSON.parse(form.fields as string) as FormField[];
  
  fields.forEach(field => {
    const value = formData[field.name];
    if (value) {
      // Map form fields to contact properties
      switch (field.type) {
        case FieldType.EMAIL:
          contactData.email = value;
          break;
        case FieldType.PHONE:
          contactData.phone = value;
          break;
        case FieldType.TEXT:
          // Check field name to map to appropriate contact field
          if (field.name.toLowerCase().includes('first') && field.name.toLowerCase().includes('name')) {
            contactData.firstName = value;
          } else if (field.name.toLowerCase().includes('last') && field.name.toLowerCase().includes('name')) {
            contactData.lastName = value;
          } else if (field.name.toLowerCase().includes('company')) {
            contactData.company = value;
          } else if (field.name.toLowerCase().includes('job') || field.name.toLowerCase().includes('title')) {
            contactData.jobTitle = value;
          } else if (field.name.toLowerCase().includes('address')) {
            contactData.address = value;
          } else if (field.name.toLowerCase().includes('city')) {
            contactData.city = value;
          } else if (field.name.toLowerCase().includes('state')) {
            contactData.state = value;
          } else if (field.name.toLowerCase().includes('country')) {
            contactData.country = value;
          } else if (field.name.toLowerCase().includes('zip') || field.name.toLowerCase().includes('postal')) {
            contactData.postalCode = value;
          } else {
            // For any other fields, store in custom metadata
            contactData[field.name] = value;
          }
          break;
        default:
          // Store all other field types in custom metadata
          contactData[field.name] = value;
      }
    }
  });
  
  // If we have contact information, create a contact
  if (contactData.email || contactData.phone) {
    // Check if visitor is already associated with a contact
    if (visitor.contactId) {
      // Update existing contact with new information
      const contact = await prisma.contact.update({
        where: { id: visitor.contactId },
        data: {
          ...contactData,
          updatedAt: new Date()
        }
      });
      
      return { success: true, contact };
    } else {
      // Create a new contact
      const contactId = randomUUID();
      const contact = await prisma.contact.create({
        data: {
          id: contactId,
          ...contactData,
          source: 'LeadPulse Form',
          createdAt: new Date(),
          updatedAt: new Date(),
          // This assumes a system user or requires a user ID to be provided
          createdById: process.env.SYSTEM_USER_ID || 'default-user-id',
        }
      });
      
      // Update visitor with contact ID
      await prisma.anonymousVisitor.update({
        where: { id: visitorId },
        data: {
          contactId: contact.id,
          conversionStatus: 'CONVERTED', // Update conversion status
        }
      });
      
      return { success: true, contact };
    }
  }
  
  return { success: true };
}

/**
 * Generate HTML for a form
 * 
 * @param formId - ID of the form to render
 * @param pixelId - LeadPulse pixel ID for tracking
 * @returns HTML string with the form markup
 */
export async function generateFormHtml(formId: string, pixelId: string): Promise<string> {
  // Get the form configuration
  const form = await prisma.leadPulseForm.findUnique({
    where: { id: formId }
  });
  
  if (!form) {
    throw new Error(`Form not found: ${formId}`);
  }
  
  // Parse form fields and settings
  const fields = JSON.parse(form.fields as string) as FormField[];
  const designSettings = form.designSettings 
    ? JSON.parse(form.designSettings as string) as FormDesignSettings
    : { theme: 'light', buttonText: 'Submit' };
  
  const conditionalLogic = form.conditionalLogic
    ? JSON.parse(form.conditionalLogic as string) as ConditionalLogic[]
    : [];
  
  // Generate CSS for the form
  const formStyles = generateFormCss(designSettings);
  
  // Generate JS for conditional logic
  const conditionalJs = generateConditionalLogicJs(conditionalLogic);
  
  // Generate field HTML
  const fieldHtml = fields.map(field => generateFieldHtml(field)).join('\n');
  
  // Build the complete form HTML
  return `
<div class="lp-form-container" id="lp-form-${formId}">
  <style>${formStyles}</style>
  <form class="lp-form" data-form-id="${formId}" data-pixel-id="${pixelId}">
    ${fieldHtml}
    <div class="lp-form-row">
      <button type="submit" class="lp-submit-button">${designSettings.buttonText || 'Submit'}</button>
    </div>
    <div class="lp-form-message" style="display: none;"></div>
  </form>
  <script>
    // Form submission handler
    (function() {
      const form = document.querySelector('#lp-form-${formId} form');
      const messageEl = document.querySelector('#lp-form-${formId} .lp-form-message');
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });
        
        // Try to get visitor ID from LeadPulse if available
        let visitorId = '';
        if (window.LeadPulse && window.LeadPulse.storage) {
          visitorId = window.LeadPulse.storage.getItem('LP_VID') || '';
        }
        
        // Submit the form data
        fetch('/api/leadpulse/form-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            formId: '${formId}',
            pixelId: '${pixelId}',
            visitorId: visitorId,
            formData: data
          })
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            // Show success message
            messageEl.textContent = '${designSettings.successMessage || 'Thank you for your submission!'}';
            messageEl.className = 'lp-form-message lp-success';
            messageEl.style.display = 'block';
            form.reset();
            
            // Identify the visitor if LeadPulse is available
            if (window.LeadPulse && window.LeadPulse.identify) {
              window.LeadPulse.identify(data);
            }
          } else {
            // Show error message
            messageEl.textContent = result.error || 'An error occurred. Please try again.';
            messageEl.className = 'lp-form-message lp-error';
            messageEl.style.display = 'block';
          }
        })
        .catch(error => {
          console.error('Form submission error:', error);
          messageEl.textContent = 'An error occurred. Please try again.';
          messageEl.className = 'lp-form-message lp-error';
          messageEl.style.display = 'block';
        });
      });
      
      // Initialize conditional logic
      ${conditionalJs}
    })();
  </script>
</div>
  `.trim();
}

/**
 * Generate CSS for a form based on design settings
 * 
 * @param designSettings - Form design configuration
 * @returns CSS string
 */
function generateFormCss(designSettings: FormDesignSettings): string {
  const {
    theme = 'light',
    fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    primaryColor = theme === 'dark' ? '#4e9cf5' : '#0070f3',
    backgroundColor = theme === 'dark' ? '#222222' : '#ffffff',
    borderRadius = 4,
    width = '100%',
    alignment = 'left'
  } = designSettings;
  
  const textColor = theme === 'dark' ? '#ffffff' : '#333333';
  const borderColor = theme === 'dark' ? '#444444' : '#dddddd';
  
  return `
.lp-form-container {
  width: ${width};
  margin: 0 ${alignment === 'center' ? 'auto' : '0'};
  ${alignment === 'right' ? 'margin-left: auto;' : ''}
  font-family: ${fontFamily};
  color: ${textColor};
}

.lp-form {
  background-color: ${backgroundColor};
  border-radius: ${borderRadius}px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.lp-form-row {
  margin-bottom: 15px;
}

.lp-form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.lp-form-input,
.lp-form-textarea,
.lp-form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid ${borderColor};
  border-radius: ${borderRadius}px;
  font-family: inherit;
  font-size: 16px;
  background-color: ${theme === 'dark' ? '#333333' : '#ffffff'};
  color: ${textColor};
}

.lp-form-input:focus,
.lp-form-textarea:focus,
.lp-form-select:focus {
  outline: none;
  border-color: ${primaryColor};
  box-shadow: 0 0 0 2px ${primaryColor}25;
}

.lp-form-checkbox-group,
.lp-form-radio-group {
  margin-top: 5px;
}

.lp-form-checkbox-item,
.lp-form-radio-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.lp-form-checkbox,
.lp-form-radio {
  margin-right: 8px;
}

.lp-form-help-text {
  font-size: 14px;
  color: ${theme === 'dark' ? '#aaaaaa' : '#666666'};
  margin-top: 4px;
}

.lp-submit-button {
  background-color: ${primaryColor};
  color: white;
  border: none;
  border-radius: ${borderRadius}px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.lp-submit-button:hover {
  background-color: ${primaryColor}dd;
}

.lp-form-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: ${borderRadius}px;
  text-align: center;
}

.lp-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.lp-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

${designSettings.customCSS || ''}
  `.trim();
}

/**
 * Generate HTML for a single form field
 * 
 * @param field - Field configuration
 * @returns HTML string for the field
 */
function generateFieldHtml(field: FormField): string {
  const { id, name, label, type, placeholder, defaultValue, helpText, validation, options } = field;
  const required = validation?.required ? 'required' : '';
  
  let fieldHtml = '';
  
  switch (type) {
    case FieldType.TEXT:
    case FieldType.EMAIL:
    case FieldType.PHONE:
    case FieldType.NUMBER:
    case FieldType.DATE:
      fieldHtml = `
        <div class="lp-form-row" data-field-id="${id}">
          <label class="lp-form-label" for="${id}">${label}${required ? ' *' : ''}</label>
          <input
            class="lp-form-input"
            type="${type.toLowerCase()}"
            id="${id}"
            name="${name}"
            placeholder="${placeholder || ''}"
            value="${defaultValue || ''}"
            ${required}
            ${validation?.minLength ? `minlength="${validation.minLength}"` : ''}
            ${validation?.maxLength ? `maxlength="${validation.maxLength}"` : ''}
            ${validation?.pattern ? `pattern="${validation.pattern}"` : ''}
          />
          ${helpText ? `<div class="lp-form-help-text">${helpText}</div>` : ''}
        </div>
      `;
      break;
      
    case FieldType.TEXTAREA:
      fieldHtml = `
        <div class="lp-form-row" data-field-id="${id}">
          <label class="lp-form-label" for="${id}">${label}${required ? ' *' : ''}</label>
          <textarea
            class="lp-form-textarea"
            id="${id}"
            name="${name}"
            placeholder="${placeholder || ''}"
            ${required}
            ${validation?.minLength ? `minlength="${validation.minLength}"` : ''}
            ${validation?.maxLength ? `maxlength="${validation.maxLength}"` : ''}
          >${defaultValue || ''}</textarea>
          ${helpText ? `<div class="lp-form-help-text">${helpText}</div>` : ''}
        </div>
      `;
      break;
      
    case FieldType.SELECT:
      const optionsHtml = (options || []).map(option => 
        `<option value="${option.value}" ${defaultValue === option.value ? 'selected' : ''}>${option.label}</option>`
      ).join('\n');
      
      fieldHtml = `
        <div class="lp-form-row" data-field-id="${id}">
          <label class="lp-form-label" for="${id}">${label}${required ? ' *' : ''}</label>
          <select
            class="lp-form-select"
            id="${id}"
            name="${name}"
            ${required}
          >
            <option value="" disabled ${!defaultValue ? 'selected' : ''}>${placeholder || 'Select an option'}</option>
            ${optionsHtml}
          </select>
          ${helpText ? `<div class="lp-form-help-text">${helpText}</div>` : ''}
        </div>
      `;
      break;
      
    case FieldType.CHECKBOX:
      const checkboxItems = (options || []).map(option => {
        const optionId = `${id}_${option.value}`;
        const isChecked = defaultValue?.split(',').includes(option.value) ? 'checked' : '';
        
        return `
          <div class="lp-form-checkbox-item">
            <input
              class="lp-form-checkbox"
              type="checkbox"
              id="${optionId}"
              name="${name}[]"
              value="${option.value}"
              ${isChecked}
            />
            <label for="${optionId}">${option.label}</label>
          </div>
        `;
      }).join('\n');
      
      fieldHtml = `
        <div class="lp-form-row" data-field-id="${id}">
          <label class="lp-form-label">${label}${required ? ' *' : ''}</label>
          <div class="lp-form-checkbox-group">
            ${checkboxItems}
          </div>
          ${helpText ? `<div class="lp-form-help-text">${helpText}</div>` : ''}
        </div>
      `;
      break;
      
    case FieldType.RADIO:
      const radioItems = (options || []).map(option => {
        const optionId = `${id}_${option.value}`;
        const isChecked = defaultValue === option.value ? 'checked' : '';
        
        return `
          <div class="lp-form-radio-item">
            <input
              class="lp-form-radio"
              type="radio"
              id="${optionId}"
              name="${name}"
              value="${option.value}"
              ${isChecked}
              ${required}
            />
            <label for="${optionId}">${option.label}</label>
          </div>
        `;
      }).join('\n');
      
      fieldHtml = `
        <div class="lp-form-row" data-field-id="${id}">
          <label class="lp-form-label">${label}${required ? ' *' : ''}</label>
          <div class="lp-form-radio-group">
            ${radioItems}
          </div>
          ${helpText ? `<div class="lp-form-help-text">${helpText}</div>` : ''}
        </div>
      `;
      break;
      
    case FieldType.HIDDEN:
      fieldHtml = `
        <input
          type="hidden"
          id="${id}"
          name="${name}"
          value="${defaultValue || ''}"
        />
      `;
      break;
  }
  
  return fieldHtml;
}

/**
 * Generate JavaScript for handling conditional form logic
 * 
 * @param conditionalLogic - Array of conditional logic rules
 * @returns JavaScript code as a string
 */
function generateConditionalLogicJs(conditionalLogic: ConditionalLogic[]): string {
  if (!conditionalLogic || conditionalLogic.length === 0) {
    return '';
  }
  
  const logicJs = conditionalLogic.map(rule => {
    const { fieldId, operator, value, action, targetFieldIds } = rule;
    const targetsSelector = targetFieldIds.map(id => `[data-field-id="${id}"]`).join(', ');
    
    return `
      // Conditional logic for field ${fieldId}
      (function() {
        const sourceField = document.querySelector('#${fieldId}');
        const targetFields = document.querySelectorAll('${targetsSelector}');
        
        if (!sourceField || targetFields.length === 0) return;
        
        function evaluateCondition() {
          let fieldValue = '';
          
          // Get field value based on type
          if (sourceField.type === 'checkbox') {
            // For checkbox groups, collect all checked values
            const checkedBoxes = document.querySelectorAll('input[name="${sourceField.name}"]:checked');
            fieldValue = Array.from(checkedBoxes).map(cb => cb.value).join(',');
          } else if (sourceField.type === 'radio') {
            // For radio groups, get the selected value
            const selectedRadio = document.querySelector('input[name="${sourceField.name}"]:checked');
            fieldValue = selectedRadio ? selectedRadio.value : '';
          } else {
            // For regular inputs, selects, etc.
            fieldValue = sourceField.value;
          }
          
          // Evaluate the condition based on operator
          let conditionMet = false;
          switch ('${operator}') {
            case 'EQUALS':
              conditionMet = fieldValue === '${value}';
              break;
            case 'NOT_EQUALS':
              conditionMet = fieldValue !== '${value}';
              break;
            case 'CONTAINS':
              conditionMet = fieldValue.includes('${value}');
              break;
            case 'NOT_CONTAINS':
              conditionMet = !fieldValue.includes('${value}');
              break;
            case 'GREATER_THAN':
              conditionMet = parseFloat(fieldValue) > parseFloat('${value}');
              break;
            case 'LESS_THAN':
              conditionMet = parseFloat(fieldValue) < parseFloat('${value}');
              break;
          }
          
          // Apply the action based on condition
          targetFields.forEach(field => {
            if ('${action}' === 'SHOW') {
              field.style.display = conditionMet ? 'block' : 'none';
            } else { // HIDE
              field.style.display = conditionMet ? 'none' : 'block';
            }
          });
        }
        
        // Initial evaluation
        evaluateCondition();
        
        // Add event listeners for changes
        sourceField.addEventListener('change', evaluateCondition);
        sourceField.addEventListener('input', evaluateCondition);
      })();
    `;
  }).join('\n');
  
  return logicJs;
} 
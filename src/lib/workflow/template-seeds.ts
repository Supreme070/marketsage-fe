/**
 * Pre-built Workflow Templates for MarketSage Marketplace
 * 
 * This file contains pre-built workflow templates that are seeded into the marketplace.
 * Templates are designed for African fintech and marketing use cases.
 */

export const workflowTemplateSeeds = [
  {
    id: 'welcome-series-basic',
    name: 'Welcome Email Series',
    description: 'A 3-email welcome series to onboard new customers and introduce your brand.',
    category: 'WELCOME_SERIES',
    complexity: 'BEGINNER',
    useCase: 'Automatically send a series of welcome emails to new subscribers or customers over the first week.',
    tags: ['welcome', 'onboarding', 'email', 'series'],
    industry: ['ecommerce', 'saas', 'fintech'],
    features: [
      '3-email automated sequence',
      'Time-based delays',
      'Personalized content',
      'Mobile-optimized templates'
    ],
    triggerTypes: ['contact_created', 'list_subscription'],
    estimatedSetupTime: 15,
    authorName: 'MarketSage Team',
    definition: {
      name: 'Welcome Email Series',
      description: 'Automated 3-email welcome sequence',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          data: {
            label: 'New Contact Added',
            description: 'Triggers when a new contact is added',
            properties: {
              type: 'contact_created',
              conditions: {
                source: 'website'
              }
            }
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'email-1',
          type: 'actionNode',
          data: {
            label: 'Welcome Email #1',
            description: 'First welcome email sent immediately',
            properties: {
              type: 'email',
              templateName: 'Welcome Email 1',
              subject: 'Welcome to {{company_name}}! Let\'s get started',
              content: 'Hi {{contact.firstName}},\n\nWelcome to {{company_name}}! We\'re excited to have you on board...',
              delay: 0
            }
          },
          position: { x: 200, y: 0 }
        },
        {
          id: 'delay-1',
          type: 'delayNode',
          data: {
            label: 'Wait 2 Days',
            description: 'Wait 2 days before next email',
            properties: {
              duration: 2,
              unit: 'days'
            }
          },
          position: { x: 400, y: 0 }
        },
        {
          id: 'email-2',
          type: 'actionNode',
          data: {
            label: 'Welcome Email #2',
            description: 'Second email with helpful resources',
            properties: {
              type: 'email',
              templateName: 'Welcome Email 2',
              subject: 'Here are some resources to help you get started',
              content: 'Hi {{contact.firstName}},\n\nHere are some helpful resources to make the most of {{company_name}}...'
            }
          },
          position: { x: 600, y: 0 }
        },
        {
          id: 'delay-2',
          type: 'delayNode',
          data: {
            label: 'Wait 3 Days',
            description: 'Wait 3 days before final email',
            properties: {
              duration: 3,
              unit: 'days'
            }
          },
          position: { x: 800, y: 0 }
        },
        {
          id: 'email-3',
          type: 'actionNode',
          data: {
            label: 'Welcome Email #3',
            description: 'Final email with special offer',
            properties: {
              type: 'email',
              templateName: 'Welcome Email 3',
              subject: 'Special offer just for you!',
              content: 'Hi {{contact.firstName}},\n\nAs a warm welcome, here\'s a special offer...'
            }
          },
          position: { x: 1000, y: 0 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'email-1' },
        { id: 'e2', source: 'email-1', target: 'delay-1' },
        { id: 'e3', source: 'delay-1', target: 'email-2' },
        { id: 'e4', source: 'email-2', target: 'delay-2' },
        { id: 'e5', source: 'delay-2', target: 'email-3' }
      ]
    },
    variables: {
      company_name: {
        type: 'string',
        description: 'Your company name',
        default: 'MarketSage'
      },
      special_offer: {
        type: 'string',
        description: 'Special offer for new customers',
        default: '10% off your first purchase'
      }
    },
    requirements: {
      integrations: ['email_provider'],
      fields: ['contact.firstName', 'contact.email']
    }
  },

  {
    id: 'fintech-kyc-verification',
    name: 'KYC Verification Workflow',
    description: 'Complete KYC (Know Your Customer) verification process for fintech applications.',
    category: 'KYC_VERIFICATION',
    complexity: 'INTERMEDIATE',
    useCase: 'Automate KYC verification with document upload, verification checks, and approval notifications.',
    tags: ['kyc', 'verification', 'fintech', 'compliance'],
    industry: ['fintech', 'banking', 'crypto'],
    features: [
      'Document upload verification',
      'Identity verification checks',
      'Approval/rejection workflows',
      'Compliance notifications',
      'SMS and email alerts'
    ],
    triggerTypes: ['kyc_submission', 'document_upload'],
    estimatedSetupTime: 30,
    authorName: 'MarketSage Fintech',
    isPremium: true,
    price: 29.99,
    definition: {
      name: 'KYC Verification Workflow',
      description: 'Automated KYC verification process',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          data: {
            label: 'KYC Application Submitted',
            description: 'Triggers when customer submits KYC documents',
            properties: {
              type: 'kyc_submission',
              conditions: {
                status: 'submitted'
              }
            }
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'email-1',
          type: 'actionNode',
          data: {
            label: 'KYC Received Confirmation',
            description: 'Confirm receipt of KYC documents',
            properties: {
              type: 'email',
              subject: 'KYC Documents Received - Under Review',
              content: 'Dear {{contact.firstName}},\n\nWe have received your KYC documents and they are under review...'
            }
          },
          position: { x: 200, y: 0 }
        },
        {
          id: 'condition-1',
          type: 'conditionNode',
          data: {
            label: 'Document Verification',
            description: 'Check if documents are valid',
            properties: {
              condition: 'kyc.documents_valid === true'
            }
          },
          position: { x: 400, y: 0 }
        },
        {
          id: 'email-approved',
          type: 'actionNode',
          data: {
            label: 'KYC Approved',
            description: 'Notify customer of successful verification',
            properties: {
              type: 'email',
              subject: 'KYC Verification Approved - Account Activated',
              content: 'Congratulations {{contact.firstName}}! Your account has been verified...'
            }
          },
          position: { x: 600, y: -100 }
        },
        {
          id: 'sms-approved',
          type: 'actionNode',
          data: {
            label: 'SMS Notification',
            description: 'Send SMS confirmation',
            properties: {
              type: 'sms',
              content: 'Hi {{contact.firstName}}, your account verification is complete. You can now access all features.'
            }
          },
          position: { x: 800, y: -100 }
        },
        {
          id: 'email-rejected',
          type: 'actionNode',
          data: {
            label: 'KYC Rejected',
            description: 'Notify customer of rejection with next steps',
            properties: {
              type: 'email',
              subject: 'KYC Verification - Additional Information Required',
              content: 'Dear {{contact.firstName}},\n\nWe need additional information to complete your verification...'
            }
          },
          position: { x: 600, y: 100 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'email-1' },
        { id: 'e2', source: 'email-1', target: 'condition-1' },
        { id: 'e3', source: 'condition-1', target: 'email-approved', sourceHandle: 'yes' },
        { id: 'e4', source: 'email-approved', target: 'sms-approved' },
        { id: 'e5', source: 'condition-1', target: 'email-rejected', sourceHandle: 'no' }
      ]
    },
    variables: {
      approval_threshold: {
        type: 'number',
        description: 'Minimum verification score for approval',
        default: 85
      },
      review_timeframe: {
        type: 'string',
        description: 'Expected review timeframe',
        default: '24-48 hours'
      }
    },
    requirements: {
      integrations: ['kyc_verification_api', 'email_provider', 'sms_provider'],
      compliance: ['data_protection', 'kyc_regulations'],
      fields: ['contact.firstName', 'contact.email', 'contact.phone', 'kyc.documents']
    }
  },

  {
    id: 'abandoned-cart-recovery',
    name: 'Abandoned Cart Recovery',
    description: 'Multi-channel campaign to recover abandoned shopping carts with personalized reminders.',
    category: 'ABANDONED_CART',
    complexity: 'INTERMEDIATE',
    useCase: 'Automatically send targeted messages to customers who abandon their shopping carts.',
    tags: ['ecommerce', 'cart', 'recovery', 'revenue'],
    industry: ['ecommerce', 'retail', 'marketplace'],
    features: [
      'Multi-channel messaging (Email + SMS)',
      'Dynamic product recommendations',
      'Discount incentives',
      'Urgency-based timing',
      'Performance tracking'
    ],
    triggerTypes: ['cart_abandoned', 'checkout_started'],
    estimatedSetupTime: 25,
    authorName: 'MarketSage Ecommerce',
    definition: {
      name: 'Abandoned Cart Recovery',
      description: 'Recover lost sales with automated follow-ups',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          data: {
            label: 'Cart Abandoned',
            description: 'Triggers when cart is abandoned for 30 minutes',
            properties: {
              type: 'cart_abandoned',
              conditions: {
                minutes_since_last_activity: 30,
                cart_value: { gte: 10 }
              }
            }
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'delay-1',
          type: 'delayNode',
          data: {
            label: 'Wait 1 Hour',
            description: 'Give customer time before first reminder',
            properties: {
              duration: 1,
              unit: 'hours'
            }
          },
          position: { x: 200, y: 0 }
        },
        {
          id: 'email-1',
          type: 'actionNode',
          data: {
            label: 'Gentle Reminder Email',
            description: 'Soft reminder with cart contents',
            properties: {
              type: 'email',
              subject: 'You left something in your cart',
              content: 'Hi {{contact.firstName}},\n\nYou left these items in your cart: {{cart.items}}...'
            }
          },
          position: { x: 400, y: 0 }
        },
        {
          id: 'condition-1',
          type: 'conditionNode',
          data: {
            label: 'Check If Purchased',
            description: 'Stop if customer completed purchase',
            properties: {
              condition: 'order.status !== "completed"'
            }
          },
          position: { x: 600, y: 0 }
        },
        {
          id: 'delay-2',
          type: 'delayNode',
          data: {
            label: 'Wait 24 Hours',
            description: 'Wait before offering discount',
            properties: {
              duration: 24,
              unit: 'hours'
            }
          },
          position: { x: 800, y: 0 }
        },
        {
          id: 'email-2',
          type: 'actionNode',
          data: {
            label: 'Discount Offer Email',
            description: 'Offer discount to incentivize purchase',
            properties: {
              type: 'email',
              subject: 'Special {{discount_percentage}}% off your cart!',
              content: 'Don\'t miss out! Complete your purchase and save {{discount_percentage}}%...'
            }
          },
          position: { x: 1000, y: 0 }
        },
        {
          id: 'sms-1',
          type: 'actionNode',
          data: {
            label: 'SMS Reminder',
            description: 'Send SMS if high-value cart',
            properties: {
              type: 'sms',
              content: 'Hi {{contact.firstName}}, your cart expires soon! Complete your order: {{checkout_link}}',
              condition: 'cart.value >= 100'
            }
          },
          position: { x: 1200, y: 0 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'delay-1' },
        { id: 'e2', source: 'delay-1', target: 'email-1' },
        { id: 'e3', source: 'email-1', target: 'condition-1' },
        { id: 'e4', source: 'condition-1', target: 'delay-2', sourceHandle: 'yes' },
        { id: 'e5', source: 'delay-2', target: 'email-2' },
        { id: 'e6', source: 'email-2', target: 'sms-1' }
      ]
    },
    variables: {
      discount_percentage: {
        type: 'number',
        description: 'Discount percentage to offer',
        default: 10
      },
      high_value_threshold: {
        type: 'number',
        description: 'Cart value threshold for SMS',
        default: 100
      }
    },
    requirements: {
      integrations: ['ecommerce_platform', 'email_provider', 'sms_provider'],
      fields: ['contact.firstName', 'cart.items', 'cart.value', 'order.status']
    }
  },

  {
    id: 'payment-reminder-fintech',
    name: 'Payment Reminder System',
    description: 'Automated payment reminders for loans, subscriptions, and financial services.',
    category: 'PAYMENT_REMINDERS',
    complexity: 'ADVANCED',
    useCase: 'Send timely payment reminders with escalating urgency for fintech and subscription services.',
    tags: ['payments', 'reminders', 'fintech', 'subscriptions'],
    industry: ['fintech', 'banking', 'saas'],
    features: [
      'Escalating reminder sequence',
      'Multiple channels (Email, SMS, WhatsApp)',
      'Grace period management',
      'Late fee calculations',
      'Payment link generation'
    ],
    triggerTypes: ['payment_due', 'payment_overdue'],
    estimatedSetupTime: 45,
    authorName: 'MarketSage Fintech',
    isPremium: true,
    price: 39.99,
    definition: {
      name: 'Payment Reminder System',
      description: 'Automated payment collection workflow',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          data: {
            label: 'Payment Due Soon',
            description: 'Triggers 3 days before payment due date',
            properties: {
              type: 'payment_due',
              conditions: {
                days_until_due: 3
              }
            }
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'email-reminder-1',
          type: 'actionNode',
          data: {
            label: 'Friendly Reminder',
            description: 'Gentle reminder 3 days before due date',
            properties: {
              type: 'email',
              subject: 'Payment reminder: {{amount}} due in 3 days',
              content: 'Hi {{contact.firstName}},\n\nThis is a friendly reminder that your payment of {{amount}} is due on {{due_date}}...'
            }
          },
          position: { x: 200, y: 0 }
        },
        {
          id: 'delay-due-date',
          type: 'delayNode',
          data: {
            label: 'Wait Until Due Date',
            description: 'Wait until actual due date',
            properties: {
              duration: 3,
              unit: 'days'
            }
          },
          position: { x: 400, y: 0 }
        },
        {
          id: 'condition-paid',
          type: 'conditionNode',
          data: {
            label: 'Check Payment Status',
            description: 'Check if payment was made',
            properties: {
              condition: 'payment.status !== "paid"'
            }
          },
          position: { x: 600, y: 0 }
        },
        {
          id: 'email-urgent',
          type: 'actionNode',
          data: {
            label: 'Urgent Payment Notice',
            description: 'Urgent notice on due date',
            properties: {
              type: 'email',
              subject: 'URGENT: Payment of {{amount}} is due today',
              content: 'Dear {{contact.firstName}},\n\nYour payment is due today. Please pay immediately to avoid late fees...'
            }
          },
          position: { x: 800, y: 0 }
        },
        {
          id: 'sms-urgent',
          type: 'actionNode',
          data: {
            label: 'SMS Alert',
            description: 'SMS for immediate attention',
            properties: {
              type: 'sms',
              content: 'URGENT: {{contact.firstName}}, payment of {{amount}} due today. Pay now: {{payment_link}}'
            }
          },
          position: { x: 1000, y: 0 }
        },
        {
          id: 'delay-overdue',
          type: 'delayNode',
          data: {
            label: 'Wait 2 Days',
            description: 'Grace period before overdue actions',
            properties: {
              duration: 2,
              unit: 'days'
            }
          },
          position: { x: 1200, y: 0 }
        },
        {
          id: 'whatsapp-final',
          type: 'actionNode',
          data: {
            label: 'Final WhatsApp Notice',
            description: 'Final notice via WhatsApp',
            properties: {
              type: 'whatsapp',
              content: 'Final Notice: {{contact.firstName}}, your account is overdue. Late fees applied. Pay now to avoid further action.'
            }
          },
          position: { x: 1400, y: 0 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'email-reminder-1' },
        { id: 'e2', source: 'email-reminder-1', target: 'delay-due-date' },
        { id: 'e3', source: 'delay-due-date', target: 'condition-paid' },
        { id: 'e4', source: 'condition-paid', target: 'email-urgent', sourceHandle: 'yes' },
        { id: 'e5', source: 'email-urgent', target: 'sms-urgent' },
        { id: 'e6', source: 'sms-urgent', target: 'delay-overdue' },
        { id: 'e7', source: 'delay-overdue', target: 'whatsapp-final' }
      ]
    },
    variables: {
      grace_period_days: {
        type: 'number',
        description: 'Grace period after due date',
        default: 2
      },
      late_fee_percentage: {
        type: 'number',
        description: 'Late fee percentage',
        default: 5
      }
    },
    requirements: {
      integrations: ['payment_processor', 'email_provider', 'sms_provider', 'whatsapp_api'],
      compliance: ['payment_regulations', 'consumer_protection'],
      fields: ['contact.firstName', 'payment.amount', 'payment.due_date', 'payment.status']
    }
  },

  {
    id: 'birthday-campaign-simple',
    name: 'Birthday Special Campaign',
    description: 'Celebrate customer birthdays with personalized messages and special offers.',
    category: 'BIRTHDAY_CAMPAIGNS',
    complexity: 'BEGINNER',
    useCase: 'Automatically send birthday wishes and special offers to customers on their birthday.',
    tags: ['birthday', 'celebration', 'offers', 'personalization'],
    industry: ['retail', 'hospitality', 'ecommerce'],
    features: [
      'Automated birthday detection',
      'Personalized birthday messages',
      'Special discount offers',
      'Multi-channel delivery',
      'Customer delight focus'
    ],
    triggerTypes: ['birthday_today', 'date_based'],
    estimatedSetupTime: 20,
    authorName: 'MarketSage Team',
    definition: {
      name: 'Birthday Special Campaign',
      description: 'Celebrate customer birthdays automatically',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          data: {
            label: 'Customer Birthday',
            description: 'Triggers on customer birthday',
            properties: {
              type: 'date_based',
              conditions: {
                field: 'contact.birthday',
                match: 'today'
              }
            }
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'email-birthday',
          type: 'actionNode',
          data: {
            label: 'Birthday Email',
            description: 'Send personalized birthday email',
            properties: {
              type: 'email',
              subject: '🎉 Happy Birthday {{contact.firstName}}! Special gift inside',
              content: 'Happy Birthday {{contact.firstName}}! 🎂\n\nWe hope your special day is filled with joy...',
              design: 'birthday_template'
            }
          },
          position: { x: 200, y: 0 }
        },
        {
          id: 'condition-mobile',
          type: 'conditionNode',
          data: {
            label: 'Has Mobile Number?',
            description: 'Check if customer has mobile number',
            properties: {
              condition: 'contact.phone !== null && contact.phone !== ""'
            }
          },
          position: { x: 400, y: 0 }
        },
        {
          id: 'sms-birthday',
          type: 'actionNode',
          data: {
            label: 'Birthday SMS',
            description: 'Send birthday SMS with offer',
            properties: {
              type: 'sms',
              content: '🎉 Happy Birthday {{contact.firstName}}! Enjoy {{birthday_discount}}% off today. Use code: BIRTHDAY{{contact.id}}'
            }
          },
          position: { x: 600, y: -100 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'email-birthday' },
        { id: 'e2', source: 'email-birthday', target: 'condition-mobile' },
        { id: 'e3', source: 'condition-mobile', target: 'sms-birthday', sourceHandle: 'yes' }
      ]
    },
    variables: {
      birthday_discount: {
        type: 'number',
        description: 'Birthday discount percentage',
        default: 20
      },
      offer_validity_days: {
        type: 'number',
        description: 'Days the birthday offer is valid',
        default: 7
      }
    },
    requirements: {
      integrations: ['email_provider', 'sms_provider'],
      fields: ['contact.firstName', 'contact.birthday', 'contact.phone']
    }
  }
];

// Template collections
export const templateCollections = [
  {
    name: 'Fintech Essentials',
    description: 'Essential workflow templates for fintech and banking applications',
    slug: 'fintech-essentials',
    isFeatured: true,
    thumbnail: '/templates/collections/fintech.jpg',
    templateIds: ['fintech-kyc-verification', 'payment-reminder-fintech']
  },
  {
    name: 'Ecommerce Growth',
    description: 'Proven templates to boost ecommerce sales and customer engagement',
    slug: 'ecommerce-growth',
    isFeatured: true,
    thumbnail: '/templates/collections/ecommerce.jpg',
    templateIds: ['abandoned-cart-recovery', 'welcome-series-basic']
  },
  {
    name: 'Customer Delight',
    description: 'Templates focused on creating memorable customer experiences',
    slug: 'customer-delight',
    isFeatured: true,
    thumbnail: '/templates/collections/delight.jpg',
    templateIds: ['birthday-campaign-simple', 'welcome-series-basic']
  }
];
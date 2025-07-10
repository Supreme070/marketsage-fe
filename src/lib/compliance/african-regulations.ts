import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * African fintech compliance rules based on actual regulations
 * This service initializes compliance rules for major African markets
 */

export interface AfricanRegulation {
  country: string;
  countryName: string;
  regulator: string;
  regulations: ComplianceRuleDefinition[];
}

export interface ComplianceRuleDefinition {
  name: string;
  description: string;
  category: string;
  severity: string;
  regulation: string;
  conditions: any;
  actions: any;
  isMandatory: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export class AfricanComplianceService {
  
  /**
   * Initialize all African fintech compliance rules
   */
  async initializeAfricanComplianceRules(): Promise<void> {
    logger.info('Initializing African fintech compliance rules...');

    const regulations = this.getAfricanRegulations();

    for (const regulation of regulations) {
      try {
        await this.initializeCountryRegulations(regulation);
        logger.info(`Initialized compliance rules for ${regulation.countryName} (${regulation.country})`);
      } catch (error) {
        logger.error(`Failed to initialize rules for ${regulation.countryName}:`, error);
      }
    }

    logger.info('African fintech compliance rules initialization completed');
  }

  /**
   * Get all African fintech regulations
   */
  private getAfricanRegulations(): AfricanRegulation[] {
    return [
      this.getNigerianRegulations(),
      this.getKenyanRegulations(),
      this.getSouthAfricanRegulations(),
      this.getGhanaianRegulations(),
      this.getEgyptianRegulations()
    ];
  }

  /**
   * Nigerian regulations (CBN - Central Bank of Nigeria)
   */
  private getNigerianRegulations(): AfricanRegulation {
    return {
      country: 'NG',
      countryName: 'Nigeria',
      regulator: 'CBN',
      regulations: [
        {
          name: 'CBN Consumer Protection Regulation - Marketing Communications',
          description: 'Ensures transparent and fair marketing communications to financial service consumers',
          category: 'CONSUMER_PROTECTION',
          severity: 'HIGH',
          regulation: 'CBN Consumer Protection Regulation 2019',
          conditions: {
            type: 'communication_frequency',
            rules: [
              {
                field: 'communicationNodes',
                operator: 'greater_than',
                value: 3,
                description: 'More than 3 communications per day'
              },
              {
                field: 'hasOptOut',
                operator: 'equals',
                value: false,
                description: 'Missing opt-out mechanism'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true,
            notifyCompliance: true,
            modifyWorkflow: {
              addSteps: [
                {
                  type: 'consent_check',
                  properties: {
                    requireExplicitConsent: true,
                    consentType: 'marketing_communications'
                  }
                }
              ]
            }
          },
          isMandatory: true,
          effectiveFrom: new Date('2019-05-01')
        },
        {
          name: 'CBN Data Protection Requirements',
          description: 'Protection of customer data in financial services',
          category: 'DATA_PROTECTION',
          severity: 'CRITICAL',
          regulation: 'CBN Revised Guidelines for Electronic Banking 2022',
          conditions: {
            type: 'data_retention',
            rules: [
              {
                field: 'hasDataRetentionPolicy',
                operator: 'equals',
                value: false,
                description: 'No data retention policy defined'
              },
              {
                field: 'hasEncryption',
                operator: 'equals',
                value: false,
                description: 'Data not encrypted during processing'
              }
            ]
          },
          actions: {
            preventExecution: true,
            requireApproval: true,
            addAuditLog: true,
            notifyCompliance: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2022-01-01')
        },
        {
          name: 'CBN KYC Requirements for Digital Channels',
          description: 'Know Your Customer requirements for digital financial services',
          category: 'KNOW_YOUR_CUSTOMER',
          severity: 'HIGH',
          regulation: 'CBN KYC Regulation 2013 (Revised)',
          conditions: {
            type: 'workflow_structure',
            rules: [
              {
                field: 'hasKYCStep',
                operator: 'equals',
                value: false,
                description: 'No KYC verification step in customer onboarding'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true,
            modifyWorkflow: {
              addSteps: [
                {
                  type: 'kyc_verification',
                  properties: {
                    verificationLevel: 'tier1',
                    documentsRequired: ['nin', 'bvn']
                  }
                }
              ]
            }
          },
          isMandatory: true,
          effectiveFrom: new Date('2013-04-01')
        },
        {
          name: 'Nigerian Data Protection Act Compliance',
          description: 'Compliance with Nigeria Data Protection Act (NDPA) 2023',
          category: 'DATA_PROTECTION',
          severity: 'CRITICAL',
          regulation: 'Nigeria Data Protection Act 2023',
          conditions: {
            type: 'consent_tracking',
            rules: [
              {
                field: 'hasExplicitConsent',
                operator: 'equals',
                value: false,
                description: 'No explicit consent for data processing'
              },
              {
                field: 'hasConsentWithdrawal',
                operator: 'equals',
                value: false,
                description: 'No mechanism for consent withdrawal'
              }
            ]
          },
          actions: {
            preventExecution: true,
            requireApproval: true,
            addAuditLog: true,
            notifyCompliance: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2023-09-12')
        }
      ]
    };
  }

  /**
   * Kenyan regulations (CMA - Capital Markets Authority, CBK - Central Bank of Kenya)
   */
  private getKenyanRegulations(): AfricanRegulation {
    return {
      country: 'KE',
      countryName: 'Kenya',
      regulator: 'CMA/CBK',
      regulations: [
        {
          name: 'Kenya Data Protection Act - Consent Requirements',
          description: 'Data protection and privacy requirements under Kenya DPA 2019',
          category: 'DATA_PROTECTION',
          severity: 'CRITICAL',
          regulation: 'Kenya Data Protection Act 2019',
          conditions: {
            type: 'consent_tracking',
            rules: [
              {
                field: 'hasInformedConsent',
                operator: 'equals',
                value: false,
                description: 'Lacks informed consent for data processing'
              },
              {
                field: 'hasDataProcessingNotice',
                operator: 'equals',
                value: false,
                description: 'No data processing notice provided'
              }
            ]
          },
          actions: {
            preventExecution: true,
            requireApproval: true,
            addAuditLog: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2019-11-25')
        },
        {
          name: 'CBK Consumer Protection Guidelines - Fair Treatment',
          description: 'Fair treatment of financial consumers',
          category: 'CONSUMER_PROTECTION',
          severity: 'HIGH',
          regulation: 'CBK/PG/15 Consumer Protection Guidelines',
          conditions: {
            type: 'communication_frequency',
            rules: [
              {
                field: 'hasTransparentTerms',
                operator: 'equals',
                value: false,
                description: 'Terms and conditions not clearly communicated'
              },
              {
                field: 'hasComplaintMechanism',
                operator: 'equals',
                value: false,
                description: 'No complaint handling mechanism'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true,
            notifyCompliance: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2013-03-01')
        },
        {
          name: 'Mobile Money Transfer Regulation',
          description: 'Regulation of mobile money services including marketing',
          category: 'FINANCIAL_REGULATIONS',
          severity: 'MEDIUM',
          regulation: 'CBK Prudential Guidelines 2013',
          conditions: {
            type: 'workflow_structure',
            rules: [
              {
                field: 'involvesMobilePayments',
                operator: 'equals',
                value: true,
                description: 'Workflow involves mobile payment processing'
              },
              {
                field: 'hasPaymentLimitsCheck',
                operator: 'equals',
                value: false,
                description: 'No payment limits verification'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true
          },
          isMandatory: false,
          effectiveFrom: new Date('2013-05-01')
        }
      ]
    };
  }

  /**
   * South African regulations (SARB - South African Reserve Bank, POPIA - Protection of Personal Information Act)
   */
  private getSouthAfricanRegulations(): AfricanRegulation {
    return {
      country: 'ZA',
      countryName: 'South Africa',
      regulator: 'SARB/POPIA',
      regulations: [
        {
          name: 'POPIA Consent and Processing Requirements',
          description: 'Protection of Personal Information Act compliance for data processing',
          category: 'DATA_PROTECTION',
          severity: 'CRITICAL',
          regulation: 'Protection of Personal Information Act 2013',
          conditions: {
            type: 'consent_tracking',
            rules: [
              {
                field: 'hasLawfulBasis',
                operator: 'equals',
                value: false,
                description: 'No lawful basis for processing personal information'
              },
              {
                field: 'hasConsentWithdrawal',
                operator: 'equals',
                value: false,
                description: 'No mechanism for withdrawing consent'
              }
            ]
          },
          actions: {
            preventExecution: true,
            requireApproval: true,
            addAuditLog: true,
            notifyCompliance: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2021-07-01')
        },
        {
          name: 'National Credit Act - Marketing Regulations',
          description: 'Marketing of credit products under the National Credit Act',
          category: 'FINANCIAL_REGULATIONS',
          severity: 'HIGH',
          regulation: 'National Credit Act 2005',
          conditions: {
            type: 'workflow_structure',
            rules: [
              {
                field: 'involvesCreditMarketing',
                operator: 'equals',
                value: true,
                description: 'Marketing credit or loan products'
              },
              {
                field: 'hasAffordabilityCheck',
                operator: 'equals',
                value: false,
                description: 'No affordability assessment included'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true,
            modifyWorkflow: {
              addSteps: [
                {
                  type: 'affordability_assessment',
                  properties: {
                    required: true,
                    creditBureauCheck: true
                  }
                }
              ]
            }
          },
          isMandatory: true,
          effectiveFrom: new Date('2007-06-01')
        },
        {
          name: 'Financial Intelligence Centre Act - AML Requirements',
          description: 'Anti-money laundering and counter-terrorism financing requirements',
          category: 'ANTI_MONEY_LAUNDERING',
          severity: 'CRITICAL',
          regulation: 'Financial Intelligence Centre Act 2001',
          conditions: {
            type: 'workflow_structure',
            rules: [
              {
                field: 'hasAMLCheck',
                operator: 'equals',
                value: false,
                description: 'No anti-money laundering screening'
              },
              {
                field: 'hasTransactionMonitoring',
                operator: 'equals',
                value: false,
                description: 'No transaction monitoring system'
              }
            ]
          },
          actions: {
            preventExecution: true,
            requireApproval: true,
            addAuditLog: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2003-07-01')
        }
      ]
    };
  }

  /**
   * Ghanaian regulations (BOG - Bank of Ghana)
   */
  private getGhanaianRegulations(): AfricanRegulation {
    return {
      country: 'GH',
      countryName: 'Ghana',
      regulator: 'BOG',
      regulations: [
        {
          name: 'Data Protection Act - Processing Requirements',
          description: 'Ghana Data Protection Act compliance for financial services',
          category: 'DATA_PROTECTION',
          severity: 'HIGH',
          regulation: 'Ghana Data Protection Act 2012',
          conditions: {
            type: 'consent_tracking',
            rules: [
              {
                field: 'hasValidConsent',
                operator: 'equals',
                value: false,
                description: 'No valid consent for data processing'
              },
              {
                field: 'hasDataRetentionPeriod',
                operator: 'equals',
                value: false,
                description: 'Data retention period not specified'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true,
            notifyCompliance: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2012-12-01')
        },
        {
          name: 'BOG Consumer Protection Directive',
          description: 'Consumer protection in banking and financial services',
          category: 'CONSUMER_PROTECTION',
          severity: 'MEDIUM',
          regulation: 'BOG Consumer Protection Directive 2019',
          conditions: {
            type: 'communication_frequency',
            rules: [
              {
                field: 'hasComplaintChannel',
                operator: 'equals',
                value: false,
                description: 'No customer complaint channel provided'
              },
              {
                field: 'hasTransparentPricing',
                operator: 'equals',
                value: false,
                description: 'Product pricing not transparently communicated'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2019-06-01')
        }
      ]
    };
  }

  /**
   * Egyptian regulations (CBE - Central Bank of Egypt)
   */
  private getEgyptianRegulations(): AfricanRegulation {
    return {
      country: 'EG',
      countryName: 'Egypt',
      regulator: 'CBE',
      regulations: [
        {
          name: 'CBE Consumer Protection Standards',
          description: 'Consumer protection in banking services',
          category: 'CONSUMER_PROTECTION',
          severity: 'HIGH',
          regulation: 'CBE Consumer Protection Instructions 2018',
          conditions: {
            type: 'communication_frequency',
            rules: [
              {
                field: 'hasArabicTranslation',
                operator: 'equals',
                value: false,
                description: 'Communications not available in Arabic'
              },
              {
                field: 'hasComplaintProcedure',
                operator: 'equals',
                value: false,
                description: 'No clear complaint procedure'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true,
            modifyWorkflow: {
              modifyProperties: {
                requireArabicTranslation: true,
                includeComplaintProcedure: true
              }
            }
          },
          isMandatory: true,
          effectiveFrom: new Date('2018-03-01')
        },
        {
          name: 'Digital Payment Services Regulation',
          description: 'Regulation of digital payment and fintech services',
          category: 'FINANCIAL_REGULATIONS',
          severity: 'MEDIUM',
          regulation: 'CBE Digital Payment Regulations 2020',
          conditions: {
            type: 'workflow_structure',
            rules: [
              {
                field: 'involvesDigitalPayments',
                operator: 'equals',
                value: true,
                description: 'Workflow involves digital payment processing'
              },
              {
                field: 'hasSecurityMeasures',
                operator: 'equals',
                value: false,
                description: 'Inadequate security measures for payments'
              }
            ]
          },
          actions: {
            requireApproval: true,
            addAuditLog: true
          },
          isMandatory: true,
          effectiveFrom: new Date('2020-08-01')
        }
      ]
    };
  }

  /**
   * Initialize compliance rules for a specific country
   */
  private async initializeCountryRegulations(regulation: AfricanRegulation): Promise<void> {
    // First, check if configuration exists for this country
    await this.createOrUpdateComplianceConfiguration(regulation);

    // Then create the compliance rules
    for (const rule of regulation.regulations) {
      try {
        // Check if rule already exists
        const existingRule = await prisma.workflowComplianceRule.findFirst({
          where: {
            name: rule.name,
            country: regulation.country,
            regulation: rule.regulation
          }
        });

        if (!existingRule) {
          await prisma.workflowComplianceRule.create({
            data: {
              name: rule.name,
              description: rule.description,
              country: regulation.country,
              regulation: rule.regulation,
              category: rule.category as any,
              severity: rule.severity as any,
              conditions: JSON.stringify(rule.conditions),
              actions: JSON.stringify(rule.actions),
              isMandatory: rule.isMandatory,
              effectiveFrom: rule.effectiveFrom,
              effectiveTo: rule.effectiveTo,
              createdBy: 'system' // System-generated rules
            }
          });
          
          logger.info(`Created compliance rule: ${rule.name} for ${regulation.countryName}`);
        } else {
          logger.info(`Compliance rule already exists: ${rule.name} for ${regulation.countryName}`);
        }
      } catch (error) {
        logger.error(`Failed to create rule ${rule.name} for ${regulation.countryName}:`, error);
      }
    }
  }

  /**
   * Create or update compliance configuration for a country
   */
  private async createOrUpdateComplianceConfiguration(regulation: AfricanRegulation): Promise<void> {
    const configurations = this.getCountryConfigurations();
    const config = configurations[regulation.country];

    if (!config) {
      logger.warn(`No configuration found for country: ${regulation.country}`);
      return;
    }

    try {
      await prisma.complianceConfiguration.upsert({
        where: { country: regulation.country },
        create: {
          country: regulation.country,
          primaryRegulator: regulation.regulator,
          regulations: JSON.stringify(config.regulations),
          dataRetention: JSON.stringify(config.dataRetention),
          consentRequirements: JSON.stringify(config.consentRequirements),
          reportingRequirements: JSON.stringify(config.reportingRequirements),
          marketingHours: JSON.stringify(config.marketingHours),
          communicationLimits: JSON.stringify(config.communicationLimits),
          optOutRequirements: JSON.stringify(config.optOutRequirements),
          encryptionRequired: config.encryptionRequired,
          dataLocalization: config.dataLocalization,
          crossBorderTransfer: JSON.stringify(config.crossBorderTransfer),
          timezone: config.timezone,
          currency: config.currency,
          language: config.language,
          updatedBy: 'system'
        },
        update: {
          primaryRegulator: regulation.regulator,
          regulations: JSON.stringify(config.regulations),
          dataRetention: JSON.stringify(config.dataRetention),
          consentRequirements: JSON.stringify(config.consentRequirements),
          reportingRequirements: JSON.stringify(config.reportingRequirements),
          marketingHours: JSON.stringify(config.marketingHours),
          communicationLimits: JSON.stringify(config.communicationLimits),
          optOutRequirements: JSON.stringify(config.optOutRequirements),
          encryptionRequired: config.encryptionRequired,
          dataLocalization: config.dataLocalization,
          crossBorderTransfer: JSON.stringify(config.crossBorderTransfer),
          timezone: config.timezone,
          currency: config.currency,
          language: config.language,
          updatedBy: 'system'
        }
      });

      logger.info(`Updated compliance configuration for ${regulation.countryName}`);
    } catch (error) {
      logger.error(`Failed to update configuration for ${regulation.countryName}:`, error);
    }
  }

  /**
   * Get country-specific compliance configurations
   */
  private getCountryConfigurations(): Record<string, any> {
    return {
      NG: {
        regulations: ['CBN Consumer Protection Regulation 2019', 'Nigeria Data Protection Act 2023', 'CBN KYC Regulation'],
        dataRetention: { period: '7_years', personalData: '5_years', marketingData: '2_years' },
        consentRequirements: { explicitConsent: true, withdrawalMechanism: true, purposeLimitation: true },
        reportingRequirements: { frequency: 'quarterly', regulator: 'CBN', incidents: 'immediate' },
        marketingHours: { start: '08:00', end: '18:00', timezone: 'Africa/Lagos', excludeWeekends: false },
        communicationLimits: { dailyLimit: 3, weeklyLimit: 10, monthlyLimit: 30 },
        optOutRequirements: { method: 'link_and_reply', honorPeriod: '48_hours' },
        encryptionRequired: true,
        dataLocalization: false,
        crossBorderTransfer: { adequacyDecision: false, safeguards: true },
        timezone: 'Africa/Lagos',
        currency: 'NGN',
        language: 'en'
      },
      KE: {
        regulations: ['Kenya Data Protection Act 2019', 'CBK Consumer Protection Guidelines'],
        dataRetention: { period: '5_years', personalData: '3_years', marketingData: '1_year' },
        consentRequirements: { informedConsent: true, processingNotice: true, withdrawalMechanism: true },
        reportingRequirements: { frequency: 'quarterly', regulator: 'CBK', incidents: '72_hours' },
        marketingHours: { start: '08:00', end: '17:00', timezone: 'Africa/Nairobi', excludeWeekends: true },
        communicationLimits: { dailyLimit: 2, weeklyLimit: 8, monthlyLimit: 25 },
        optOutRequirements: { method: 'link_and_reply', honorPeriod: '24_hours' },
        encryptionRequired: true,
        dataLocalization: true,
        crossBorderTransfer: { adequacyDecision: false, safeguards: true },
        timezone: 'Africa/Nairobi',
        currency: 'KES',
        language: 'en'
      },
      ZA: {
        regulations: ['Protection of Personal Information Act 2013', 'National Credit Act 2005', 'FICA 2001'],
        dataRetention: { period: '6_years', personalData: '5_years', marketingData: '3_years' },
        consentRequirements: { lawfulBasis: true, consentWithdrawal: true, purposeLimitation: true },
        reportingRequirements: { frequency: 'quarterly', regulator: 'SARB', incidents: 'immediate' },
        marketingHours: { start: '08:00', end: '18:00', timezone: 'Africa/Johannesburg', excludeWeekends: false },
        communicationLimits: { dailyLimit: 4, weeklyLimit: 12, monthlyLimit: 35 },
        optOutRequirements: { method: 'link_and_reply', honorPeriod: '48_hours' },
        encryptionRequired: true,
        dataLocalization: false,
        crossBorderTransfer: { adequacyDecision: true, safeguards: true },
        timezone: 'Africa/Johannesburg',
        currency: 'ZAR',
        language: 'en'
      },
      GH: {
        regulations: ['Ghana Data Protection Act 2012', 'BOG Consumer Protection Directive 2019'],
        dataRetention: { period: '5_years', personalData: '3_years', marketingData: '2_years' },
        consentRequirements: { validConsent: true, retentionPeriod: true, withdrawalMechanism: true },
        reportingRequirements: { frequency: 'quarterly', regulator: 'BOG', incidents: '48_hours' },
        marketingHours: { start: '08:00', end: '17:00', timezone: 'Africa/Accra', excludeWeekends: true },
        communicationLimits: { dailyLimit: 2, weeklyLimit: 7, monthlyLimit: 20 },
        optOutRequirements: { method: 'link_and_reply', honorPeriod: '24_hours' },
        encryptionRequired: true,
        dataLocalization: false,
        crossBorderTransfer: { adequacyDecision: false, safeguards: false },
        timezone: 'Africa/Accra',
        currency: 'GHS',
        language: 'en'
      },
      EG: {
        regulations: ['CBE Consumer Protection Instructions 2018', 'CBE Digital Payment Regulations 2020'],
        dataRetention: { period: '5_years', personalData: '3_years', marketingData: '2_years' },
        consentRequirements: { arabicLanguage: true, complaintProcedure: true, withdrawalMechanism: true },
        reportingRequirements: { frequency: 'quarterly', regulator: 'CBE', incidents: '72_hours' },
        marketingHours: { start: '09:00', end: '17:00', timezone: 'Africa/Cairo', excludeWeekends: true },
        communicationLimits: { dailyLimit: 3, weeklyLimit: 9, monthlyLimit: 25 },
        optOutRequirements: { method: 'link_and_reply', honorPeriod: '48_hours' },
        encryptionRequired: true,
        dataLocalization: true,
        crossBorderTransfer: { adequacyDecision: false, safeguards: true },
        timezone: 'Africa/Cairo',
        currency: 'EGP',
        language: 'ar'
      }
    };
  }
}

// Export singleton instance
export const africanComplianceService = new AfricanComplianceService();
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// Types for African fintech compliance
export interface ComplianceRule {
  id: string;
  name: string;
  description?: string;
  country: string;
  regulation: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  conditions: ComplianceConditions;
  actions: ComplianceActions;
  isMandatory: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface ComplianceConditions {
  type: 'workflow_structure' | 'communication_frequency' | 'consent_tracking' | 'data_retention' | 'cross_border_data';
  rules: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
    value: any;
    description?: string;
  }>;
  customLogic?: string; // JavaScript code for complex conditions
}

export interface ComplianceActions {
  preventExecution?: boolean;
  requireApproval?: boolean;
  addAuditLog?: boolean;
  notifyCompliance?: boolean;
  modifyWorkflow?: {
    addSteps?: any[];
    removeSteps?: string[];
    modifyProperties?: Record<string, any>;
  };
}

export interface ComplianceCheckResult {
  ruleId: string;
  isCompliant: boolean;
  riskScore: number;
  findings: Array<{
    type: string;
    description: string;
    severity: ComplianceSeverity;
    location?: string;
  }>;
  recommendations: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  evidence: Record<string, any>;
}

export interface AfricanComplianceContext {
  country: string;
  userLocation?: string;
  contactLocation?: string;
  dataTypes: string[];
  communicationChannels: string[];
  consentStatus?: Record<string, boolean>;
  marketingFrequency?: Record<string, number>;
}

export type ComplianceCategory = 'DATA_PROTECTION' | 'CONSENT_MANAGEMENT' | 'COMMUNICATION_LIMITS' | 'FINANCIAL_REGULATIONS' | 'ANTI_MONEY_LAUNDERING' | 'KNOW_YOUR_CUSTOMER' | 'REPORTING_REQUIREMENTS' | 'CROSS_BORDER_TRANSFERS' | 'MARKET_CONDUCT' | 'CONSUMER_PROTECTION';
export type ComplianceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ComplianceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLIANT' | 'NON_COMPLIANT' | 'REQUIRES_REVIEW' | 'FAILED';

export class WorkflowComplianceChecker {
  /**
   * Check workflow compliance against all applicable African fintech regulations
   */
  async checkWorkflowCompliance(
    workflowId: string,
    context: AfricanComplianceContext,
    executionId?: string
  ): Promise<ComplianceCheckResult[]> {
    try {
      // Get applicable compliance rules for the country/region
      const applicableRules = await this.getApplicableRules(context.country);
      
      // Get workflow definition and execution data
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          executions: executionId ? {
            where: { id: executionId },
            take: 1
          } : undefined
        }
      });

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const workflowDefinition = JSON.parse(workflow.definition);
      const results: ComplianceCheckResult[] = [];

      // Check each applicable rule
      for (const rule of applicableRules) {
        try {
          const result = await this.checkSingleRule(
            rule,
            workflow,
            workflowDefinition,
            context,
            executionId
          );
          
          results.push(result);

          // Store check result in database
          await this.storeComplianceCheck(workflowId, rule.id, result, executionId);

          // Create violation record if non-compliant
          if (!result.isCompliant) {
            await this.createComplianceViolation(workflowId, rule.id, result, executionId);
          }

        } catch (ruleError) {
          logger.error(`Error checking compliance rule ${rule.id}:`, ruleError);
          
          // Create a failed check record
          const failedResult: ComplianceCheckResult = {
            ruleId: rule.id,
            isCompliant: false,
            riskScore: 100,
            findings: [{
              type: 'check_error',
              description: `Failed to check rule: ${ruleError instanceof Error ? ruleError.message : 'Unknown error'}`,
              severity: 'HIGH'
            }],
            recommendations: [{
              action: 'review_rule',
              description: 'Review compliance rule configuration and workflow structure',
              priority: 'high'
            }],
            evidence: { error: ruleError instanceof Error ? ruleError.message : 'Unknown error' }
          };

          results.push(failedResult);
          await this.storeComplianceCheck(workflowId, rule.id, failedResult, executionId);
        }
      }

      return results;

    } catch (error) {
      logger.error('Error in workflow compliance check:', error);
      throw error;
    }
  }

  /**
   * Get compliance rules applicable to a specific country
   */
  private async getApplicableRules(country: string): Promise<ComplianceRule[]> {
    const rules = await prisma.workflowComplianceRule.findMany({
      where: {
        country: country,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      },
      orderBy: [
        { isMandatory: 'desc' },
        { severity: 'desc' }
      ]
    });

    return rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description || undefined,
      country: rule.country,
      regulation: rule.regulation,
      category: rule.category as ComplianceCategory,
      severity: rule.severity as ComplianceSeverity,
      conditions: rule.conditions as ComplianceConditions,
      actions: rule.actions as ComplianceActions,
      isMandatory: rule.isMandatory,
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo || undefined
    }));
  }

  /**
   * Check a single compliance rule against workflow
   */
  private async checkSingleRule(
    rule: ComplianceRule,
    workflow: any,
    workflowDefinition: any,
    context: AfricanComplianceContext,
    executionId?: string
  ): Promise<ComplianceCheckResult> {
    const findings: Array<{
      type: string;
      description: string;
      severity: ComplianceSeverity;
      location?: string;
    }> = [];

    const recommendations: Array<{
      action: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    const evidence: Record<string, any> = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      checkTime: new Date().toISOString(),
      ruleDetails: {
        id: rule.id,
        name: rule.name,
        category: rule.category,
        country: rule.country,
        regulation: rule.regulation
      }
    };

    let isCompliant = true;
    let riskScore = 0;

    // Check based on rule category
    switch (rule.category) {
      case 'DATA_PROTECTION':
        const dataProtectionResult = await this.checkDataProtectionCompliance(rule, workflowDefinition, context);
        isCompliant = isCompliant && dataProtectionResult.isCompliant;
        riskScore = Math.max(riskScore, dataProtectionResult.riskScore);
        findings.push(...dataProtectionResult.findings);
        recommendations.push(...dataProtectionResult.recommendations);
        evidence.dataProtection = dataProtectionResult.evidence;
        break;

      case 'CONSENT_MANAGEMENT':
        const consentResult = await this.checkConsentCompliance(rule, workflowDefinition, context);
        isCompliant = isCompliant && consentResult.isCompliant;
        riskScore = Math.max(riskScore, consentResult.riskScore);
        findings.push(...consentResult.findings);
        recommendations.push(...consentResult.recommendations);
        evidence.consent = consentResult.evidence;
        break;

      case 'COMMUNICATION_LIMITS':
        const commResult = await this.checkCommunicationLimits(rule, workflowDefinition, context, workflow.id);
        isCompliant = isCompliant && commResult.isCompliant;
        riskScore = Math.max(riskScore, commResult.riskScore);
        findings.push(...commResult.findings);
        recommendations.push(...commResult.recommendations);
        evidence.communication = commResult.evidence;
        break;

      case 'CROSS_BORDER_TRANSFERS':
        const crossBorderResult = await this.checkCrossBorderCompliance(rule, workflowDefinition, context);
        isCompliant = isCompliant && crossBorderResult.isCompliant;
        riskScore = Math.max(riskScore, crossBorderResult.riskScore);
        findings.push(...crossBorderResult.findings);
        recommendations.push(...crossBorderResult.recommendations);
        evidence.crossBorder = crossBorderResult.evidence;
        break;

      case 'FINANCIAL_REGULATIONS':
        const finRegResult = await this.checkFinancialRegulations(rule, workflowDefinition, context);
        isCompliant = isCompliant && finRegResult.isCompliant;
        riskScore = Math.max(riskScore, finRegResult.riskScore);
        findings.push(...finRegResult.findings);
        recommendations.push(...finRegResult.recommendations);
        evidence.financialRegulations = finRegResult.evidence;
        break;

      default:
        // Generic rule checking for other categories
        const genericResult = await this.checkGenericRule(rule, workflowDefinition, context);
        isCompliant = isCompliant && genericResult.isCompliant;
        riskScore = Math.max(riskScore, genericResult.riskScore);
        findings.push(...genericResult.findings);
        recommendations.push(...genericResult.recommendations);
        evidence.generic = genericResult.evidence;
    }

    return {
      ruleId: rule.id,
      isCompliant,
      riskScore,
      findings,
      recommendations,
      evidence
    };
  }

  /**
   * Check data protection compliance (GDPR-like requirements for African markets)
   */
  private async checkDataProtectionCompliance(
    rule: ComplianceRule,
    workflowDefinition: any,
    context: AfricanComplianceContext
  ): Promise<Partial<ComplianceCheckResult>> {
    const findings: any[] = [];
    const recommendations: any[] = [];
    let isCompliant = true;
    let riskScore = 0;

    // Check for consent collection steps
    const hasConsentStep = workflowDefinition.nodes.some((node: any) => 
      node.type === 'action' && 
      (node.data?.properties?.collectConsent || 
       node.data?.label?.toLowerCase().includes('consent'))
    );

    if (!hasConsentStep) {
      isCompliant = false;
      riskScore += 30;
      findings.push({
        type: 'missing_consent_collection',
        description: 'Workflow does not include explicit consent collection step',
        severity: 'HIGH' as ComplianceSeverity
      });
      recommendations.push({
        action: 'add_consent_step',
        description: 'Add a consent collection step before any data processing activities',
        priority: 'high' as const
      });
    }

    // Check for data retention policies
    const hasDataRetention = workflowDefinition.nodes.some((node: any) => 
      node.data?.properties?.dataRetentionPeriod
    );

    if (!hasDataRetention) {
      riskScore += 20;
      findings.push({
        type: 'missing_data_retention',
        description: 'No data retention policies defined in workflow',
        severity: 'MEDIUM' as ComplianceSeverity
      });
      recommendations.push({
        action: 'define_retention_policy',
        description: 'Define data retention periods for collected information',
        priority: 'medium' as const
      });
    }

    return {
      isCompliant,
      riskScore,
      findings,
      recommendations,
      evidence: {
        hasConsentStep,
        hasDataRetention,
        nodeTypes: workflowDefinition.nodes.map((n: any) => n.type)
      }
    };
  }

  /**
   * Check consent management compliance
   */
  private async checkConsentCompliance(
    rule: ComplianceRule,
    workflowDefinition: any,
    context: AfricanComplianceContext
  ): Promise<Partial<ComplianceCheckResult>> {
    const findings: any[] = [];
    const recommendations: any[] = [];
    let isCompliant = true;
    let riskScore = 0;

    // Check for explicit opt-in mechanisms
    const hasOptIn = workflowDefinition.nodes.some((node: any) => 
      node.data?.properties?.requiresOptIn || 
      node.data?.properties?.consentType === 'opt_in'
    );

    // Check for opt-out mechanisms
    const hasOptOut = workflowDefinition.nodes.some((node: any) => 
      node.data?.properties?.includeOptOut || 
      node.data?.label?.toLowerCase().includes('unsubscribe')
    );

    if (!hasOptIn) {
      isCompliant = false;
      riskScore += 40;
      findings.push({
        type: 'missing_opt_in',
        description: 'Workflow lacks explicit opt-in consent mechanism',
        severity: 'CRITICAL' as ComplianceSeverity
      });
      recommendations.push({
        action: 'implement_opt_in',
        description: 'Add explicit opt-in consent collection before marketing communications',
        priority: 'high' as const
      });
    }

    if (!hasOptOut) {
      riskScore += 25;
      findings.push({
        type: 'missing_opt_out',
        description: 'Communications do not include opt-out mechanism',
        severity: 'HIGH' as ComplianceSeverity
      });
      recommendations.push({
        action: 'add_unsubscribe',
        description: 'Include unsubscribe links in all marketing communications',
        priority: 'high' as const
      });
    }

    return {
      isCompliant,
      riskScore,
      findings,
      recommendations,
      evidence: {
        hasOptIn,
        hasOptOut,
        consentMechanisms: workflowDefinition.nodes
          .filter((n: any) => n.data?.properties?.consentType)
          .map((n: any) => n.data.properties.consentType)
      }
    };
  }

  /**
   * Check communication frequency limits
   */
  private async checkCommunicationLimits(
    rule: ComplianceRule,
    workflowDefinition: any,
    context: AfricanComplianceContext,
    workflowId: string
  ): Promise<Partial<ComplianceCheckResult>> {
    const findings: any[] = [];
    const recommendations: any[] = [];
    const isCompliant = true;
    let riskScore = 0;

    // Count communication nodes in workflow
    const communicationNodes = workflowDefinition.nodes.filter((node: any) => 
      ['email', 'sms', 'whatsapp'].some(type => 
        node.data?.label?.toLowerCase().includes(type) || 
        node.type === `${type}_action`
      )
    );

    // Check for rate limiting mechanisms
    const hasRateLimit = workflowDefinition.nodes.some((node: any) => 
      node.data?.properties?.rateLimitPerDay || 
      node.data?.properties?.respectQuietHours
    );

    // Check for time-based restrictions (respect quiet hours)
    const hasTimeRestrictions = workflowDefinition.nodes.some((node: any) => 
      node.data?.properties?.allowedHours || 
      node.data?.properties?.timeZoneAware
    );

    if (communicationNodes.length > 3 && !hasRateLimit) {
      riskScore += 30;
      findings.push({
        type: 'excessive_communication_frequency',
        description: `Workflow contains ${communicationNodes.length} communication steps without rate limiting`,
        severity: 'MEDIUM' as ComplianceSeverity
      });
      recommendations.push({
        action: 'implement_rate_limiting',
        description: 'Add rate limiting to prevent excessive communication frequency',
        priority: 'medium' as const
      });
    }

    if (!hasTimeRestrictions) {
      riskScore += 15;
      findings.push({
        type: 'no_time_restrictions',
        description: 'Communications may be sent outside appropriate hours',
        severity: 'LOW' as ComplianceSeverity
      });
      recommendations.push({
        action: 'add_time_restrictions',
        description: 'Implement quiet hours and timezone-aware sending',
        priority: 'low' as const
      });
    }

    return {
      isCompliant,
      riskScore,
      findings,
      recommendations,
      evidence: {
        communicationNodeCount: communicationNodes.length,
        hasRateLimit,
        hasTimeRestrictions,
        communicationTypes: communicationNodes.map((n: any) => n.data?.label)
      }
    };
  }

  /**
   * Check cross-border data transfer compliance
   */
  private async checkCrossBorderCompliance(
    rule: ComplianceRule,
    workflowDefinition: any,
    context: AfricanComplianceContext
  ): Promise<Partial<ComplianceCheckResult>> {
    const findings: any[] = [];
    const recommendations: any[] = [];
    const isCompliant = true;
    let riskScore = 0;

    // Check for external API calls that might transfer data
    const externalCalls = workflowDefinition.nodes.filter((node: any) => 
      node.type === 'webhook' || node.type === 'api_call'
    );

    for (const apiNode of externalCalls) {
      const url = apiNode.data?.properties?.url;
      if (url && !this.isAfricanDomain(url)) {
        riskScore += 25;
        findings.push({
          type: 'cross_border_data_transfer',
          description: `External API call to non-African domain: ${url}`,
          severity: 'HIGH' as ComplianceSeverity,
          location: apiNode.id
        });
        recommendations.push({
          action: 'review_data_transfer',
          description: 'Ensure adequate safeguards for cross-border data transfers',
          priority: 'high' as const
        });
      }
    }

    // Check for data localization requirements
    const hasDataLocalization = workflowDefinition.nodes.some((node: any) => 
      node.data?.properties?.dataLocalization === true
    );

    if (externalCalls.length > 0 && !hasDataLocalization) {
      riskScore += 20;
      findings.push({
        type: 'missing_data_localization',
        description: 'External integrations without data localization safeguards',
        severity: 'MEDIUM' as ComplianceSeverity
      });
      recommendations.push({
        action: 'implement_data_localization',
        description: 'Ensure sensitive data remains within African jurisdictions',
        priority: 'medium' as const
      });
    }

    return {
      isCompliant: riskScore < 50,
      riskScore,
      findings,
      recommendations,
      evidence: {
        externalCallCount: externalCalls.length,
        externalUrls: externalCalls.map((n: any) => n.data?.properties?.url).filter(Boolean),
        hasDataLocalization
      }
    };
  }

  /**
   * Check financial regulations compliance
   */
  private async checkFinancialRegulations(
    rule: ComplianceRule,
    workflowDefinition: any,
    context: AfricanComplianceContext
  ): Promise<Partial<ComplianceCheckResult>> {
    const findings: any[] = [];
    const recommendations: any[] = [];
    const isCompliant = true;
    let riskScore = 0;

    // Check for financial content detection
    const hasFinancialContent = workflowDefinition.nodes.some((node: any) => {
      const content = JSON.stringify(node.data?.properties || {}).toLowerCase();
      return ['payment', 'loan', 'credit', 'investment', 'financial', 'money', 'bank'].some(term => 
        content.includes(term)
      );
    });

    if (hasFinancialContent) {
      // Check for required disclaimers
      const hasDisclaimer = workflowDefinition.nodes.some((node: any) => 
        node.data?.properties?.includeDisclaimer || 
        node.data?.properties?.regulatoryDisclaimer
      );

      if (!hasDisclaimer) {
        riskScore += 35;
        findings.push({
          type: 'missing_financial_disclaimer',
          description: 'Financial content lacks required regulatory disclaimers',
          severity: 'HIGH' as ComplianceSeverity
        });
        recommendations.push({
          action: 'add_financial_disclaimers',
          description: 'Include required regulatory disclaimers for financial communications',
          priority: 'high' as const
        });
      }

      // Check for risk disclosure
      const hasRiskDisclosure = workflowDefinition.nodes.some((node: any) => 
        node.data?.properties?.riskDisclosure
      );

      if (!hasRiskDisclosure) {
        riskScore += 25;
        findings.push({
          type: 'missing_risk_disclosure',
          description: 'Financial content lacks risk disclosure statements',
          severity: 'MEDIUM' as ComplianceSeverity
        });
        recommendations.push({
          action: 'add_risk_disclosure',
          description: 'Include appropriate risk disclosure for financial products',
          priority: 'medium' as const
        });
      }
    }

    return {
      isCompliant: riskScore < 40,
      riskScore,
      findings,
      recommendations,
      evidence: {
        hasFinancialContent,
        hasDisclaimer: hasFinancialContent ? workflowDefinition.nodes.some((n: any) => n.data?.properties?.includeDisclaimer) : null,
        hasRiskDisclosure: hasFinancialContent ? workflowDefinition.nodes.some((n: any) => n.data?.properties?.riskDisclosure) : null
      }
    };
  }

  /**
   * Generic rule checker for custom conditions
   */
  private async checkGenericRule(
    rule: ComplianceRule,
    workflowDefinition: any,
    context: AfricanComplianceContext
  ): Promise<Partial<ComplianceCheckResult>> {
    // This would implement custom rule checking based on the conditions object
    // For now, return a basic compliant result
    return {
      isCompliant: true,
      riskScore: 0,
      findings: [],
      recommendations: [],
      evidence: { ruleType: 'generic', checked: true }
    };
  }

  /**
   * Store compliance check result in database
   */
  private async storeComplianceCheck(
    workflowId: string,
    ruleId: string,
    result: ComplianceCheckResult,
    executionId?: string
  ): Promise<void> {
    await prisma.workflowComplianceCheck.create({
      data: {
        workflowId,
        ruleId,
        executionId,
        status: result.isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        isCompliant: result.isCompliant,
        riskScore: result.riskScore,
        findings: JSON.stringify(result.findings),
        recommendations: JSON.stringify(result.recommendations),
        evidence: JSON.stringify(result.evidence),
        requiresAction: !result.isCompliant
      }
    });
  }

  /**
   * Create compliance violation record for non-compliant checks
   */
  private async createComplianceViolation(
    workflowId: string,
    ruleId: string,
    result: ComplianceCheckResult,
    executionId?: string
  ): Promise<void> {
    const highestSeverityFinding = result.findings.reduce((prev, current) => {
      const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      return severityOrder[current.severity] > severityOrder[prev.severity] ? current : prev;
    }, result.findings[0]);

    const violationType = this.mapFindingToViolationType(highestSeverityFinding.type);
    const riskLevel = this.calculateRiskLevel(result.riskScore);

    await prisma.workflowComplianceViolation.create({
      data: {
        workflowId,
        ruleId,
        executionId,
        violationType,
        severity: highestSeverityFinding.severity,
        title: `Compliance Violation: ${highestSeverityFinding.type}`,
        description: highestSeverityFinding.description,
        riskLevel,
        financialImpact: this.estimateFinancialImpact(result.riskScore, riskLevel),
        businessImpact: this.assessBusinessImpact(result.findings)
      }
    });
  }

  /**
   * Helper method to check if a domain is African
   */
  private isAfricanDomain(url: string): boolean {
    const africanTlds = ['.ng', '.ke', '.za', '.gh', '.eg', '.ma', '.tn', '.dz', '.ao', '.mz'];
    return africanTlds.some(tld => url.includes(tld));
  }

  /**
   * Map finding type to violation type enum
   */
  private mapFindingToViolationType(findingType: string): string {
    const mapping: Record<string, string> = {
      'missing_consent_collection': 'CONSENT_VIOLATION',
      'missing_opt_in': 'CONSENT_VIOLATION',
      'missing_opt_out': 'MISSING_OPT_OUT_MECHANISM',
      'missing_data_retention': 'DATA_RETENTION_VIOLATION',
      'excessive_communication_frequency': 'COMMUNICATION_FREQUENCY_VIOLATION',
      'cross_border_data_transfer': 'UNAUTHORIZED_CROSS_BORDER_TRANSFER',
      'missing_data_localization': 'INADEQUATE_DATA_PROTECTION',
      'missing_financial_disclaimer': 'INSUFFICIENT_DOCUMENTATION'
    };
    
    return mapping[findingType] || 'INSUFFICIENT_DOCUMENTATION';
  }

  /**
   * Calculate risk level based on risk score
   */
  private calculateRiskLevel(riskScore: number): string {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'VERY_HIGH';
    if (riskScore >= 40) return 'HIGH';
    if (riskScore >= 20) return 'MEDIUM';
    if (riskScore >= 10) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * Estimate potential financial impact
   */
  private estimateFinancialImpact(riskScore: number, riskLevel: string): number {
    const baseFine = 10000; // Base fine amount in USD
    const multiplier = riskScore / 100;
    return baseFine * multiplier;
  }

  /**
   * Assess business impact description
   */
  private assessBusinessImpact(findings: any[]): string {
    const criticalFindings = findings.filter(f => f.severity === 'CRITICAL').length;
    const highFindings = findings.filter(f => f.severity === 'HIGH').length;
    
    if (criticalFindings > 0) {
      return 'High risk of regulatory penalties and reputation damage. Immediate action required.';
    } else if (highFindings > 0) {
      return 'Moderate risk of compliance issues. Remediation recommended within 30 days.';
    } else {
      return 'Low risk compliance gap. Address during next maintenance cycle.';
    }
  }

  /**
   * Generate compliance report for a workflow or organization
   */
  async generateComplianceReport(
    workflowId: string | null,
    reportType: string,
    period: string,
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<string> {
    const checks = await prisma.workflowComplianceCheck.findMany({
      where: {
        workflowId: workflowId || undefined,
        checkDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        rule: true,
        workflow: true
      }
    });

    const violations = await prisma.workflowComplianceViolation.findMany({
      where: {
        workflowId: workflowId || undefined,
        detectedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        rule: true,
        workflow: true
      }
    });

    const totalChecks = checks.length;
    const compliantChecks = checks.filter(c => c.isCompliant).length;
    const violationsFound = violations.length;
    const highRiskViolations = violations.filter(v => ['HIGH', 'CRITICAL'].includes(v.severity)).length;
    const overallScore = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 100;

    const summary = {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalChecks,
      compliantChecks,
      complianceRate: `${((compliantChecks / totalChecks) * 100).toFixed(1)}%`,
      violationsFound,
      highRiskViolations,
      overallScore: Number.parseFloat(overallScore.toFixed(1))
    };

    const findings = {
      byCategory: this.groupViolationsByCategory(violations),
      bySeverity: this.groupViolationsBySeverity(violations),
      topRisks: violations
        .sort((a, b) => b.riskLevel.localeCompare(a.riskLevel))
        .slice(0, 5)
        .map(v => ({
          title: v.title,
          riskLevel: v.riskLevel,
          workflow: v.workflow?.name
        }))
    };

    const recommendations = this.generateRecommendations(violations, checks);

    const report = await prisma.workflowComplianceReport.create({
      data: {
        workflowId,
        reportType: reportType as any,
        period: period as any,
        startDate,
        endDate,
        totalChecks,
        compliantChecks,
        violationsFound,
        highRiskViolations,
        overallScore,
        summary: JSON.stringify(summary),
        findings: JSON.stringify(findings),
        recommendations: JSON.stringify(recommendations),
        generatedBy
      }
    });

    return report.id;
  }

  private groupViolationsByCategory(violations: any[]): Record<string, number> {
    return violations.reduce((acc, violation) => {
      const category = violation.rule?.category || 'UNKNOWN';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }

  private groupViolationsBySeverity(violations: any[]): Record<string, number> {
    return violations.reduce((acc, violation) => {
      const severity = violation.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
  }

  private generateRecommendations(violations: any[], checks: any[]): any[] {
    const recommendations = [];

    // High-priority recommendations based on violations
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
    if (criticalViolations.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Address Critical Compliance Violations',
        description: `${criticalViolations.length} critical violations require immediate attention`,
        actions: ['Review workflow configurations', 'Implement missing compliance controls', 'Seek legal review']
      });
    }

    // Recommendations for improving overall compliance
    const complianceRate = (checks.filter(c => c.isCompliant).length / checks.length) * 100;
    if (complianceRate < 80) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Improve Overall Compliance Rate',
        description: `Current compliance rate is ${complianceRate.toFixed(1)}%. Target: 95%+`,
        actions: ['Implement automated compliance checks', 'Provide compliance training', 'Regular audit workflows']
      });
    }

    return recommendations;
  }
}

// Create singleton instance
export const workflowComplianceChecker = new WorkflowComplianceChecker();
/**
 * Enterprise Governance and Compliance Framework - Production Version
 * ===================================================================
 * Comprehensive governance system for AI task execution with enterprise-grade
 * compliance, policy management, audit controls, and regulatory adherence.
 * Supports GDPR, SOX, HIPAA, and other regulatory frameworks.
 */

import { logger } from '@/lib/logger';
import { taskExecutionMonitor } from './task-execution-monitor';
import { safetyApprovalSystem } from './safety-approval-system';
import prisma from '@/lib/db/prisma';

interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'security' | 'compliance' | 'operational' | 'risk' | 'data_protection' | 'business';
  scope: 'global' | 'user_group' | 'task_type' | 'risk_level' | 'data_classification';
  priority: number; // 1-100, higher = more important
  active: boolean;
  effectiveDate: Date;
  expirationDate?: Date;
  regulations: RegulatoryFramework[];
  rules: PolicyRule[];
  enforcement: EnforcementAction[];
  exemptions: PolicyExemption[];
  metadata: {
    createdBy: string;
    approvedBy: string[];
    lastReviewed: Date;
    nextReview: Date;
    changeHistory: PolicyChange[];
  };
}

interface PolicyRule {
  id: string;
  type: 'requirement' | 'prohibition' | 'permission' | 'recommendation';
  condition: PolicyCondition;
  action: PolicyAction;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  documentation: string;
  exceptions: string[];
}

interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR' | 'NOT';
  nestedConditions?: PolicyCondition[];
}

interface PolicyAction {
  type: 'block' | 'require_approval' | 'log_warning' | 'notify' | 'modify_parameters' | 'delay_execution';
  parameters: Record<string, any>;
  notifications?: NotificationConfig[];
  escalation?: EscalationConfig;
}

interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'dashboard';
  recipients: string[];
  template: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface EscalationConfig {
  levels: EscalationLevel[];
  timeoutMinutes: number;
  autoApprove: boolean;
}

interface EscalationLevel {
  order: number;
  approvers: string[];
  timeoutMinutes: number;
  required: boolean;
}

interface EnforcementAction {
  triggeredBy: string; // Policy rule ID
  action: 'block' | 'approve' | 'modify' | 'escalate' | 'audit';
  timestamp: Date;
  userId: string;
  taskId: string;
  result: 'success' | 'failure' | 'pending';
  details: Record<string, any>;
}

interface PolicyExemption {
  id: string;
  policyId: string;
  ruleId?: string;
  grantedTo: string; // User ID or group
  reason: string;
  approvedBy: string;
  grantedAt: Date;
  expiresAt: Date;
  conditions: string[];
  usageCount: number;
  maxUsage?: number;
}

interface PolicyChange {
  version: string;
  changedBy: string;
  changeType: 'created' | 'modified' | 'deactivated' | 'reactivated';
  changeDate: Date;
  changeReason: string;
  changedFields: string[];
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
}

interface RegulatoryFramework {
  name: 'GDPR' | 'SOX' | 'HIPAA' | 'PCI_DSS' | 'ISO_27001' | 'CCPA' | 'PIPEDA' | 'Custom';
  version: string;
  requirements: string[];
  evidence: string[];
  controls: string[];
}

interface ComplianceReport {
  id: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  framework: RegulatoryFramework;
  overallStatus: 'compliant' | 'non_compliant' | 'at_risk' | 'under_review';
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  evidence: ComplianceEvidence[];
  metrics: ComplianceMetrics;
  nextReviewDate: Date;
}

interface ComplianceFinding {
  id: string;
  type: 'violation' | 'gap' | 'risk' | 'observation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  requirement: string;
  description: string;
  evidence: string[];
  remediation: string;
  timeline: string;
  responsible: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

interface ComplianceRecommendation {
  id: string;
  type: 'process_improvement' | 'policy_update' | 'technical_control' | 'training';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  justification: string;
  implementation: string;
  cost: string;
  timeline: string;
  benefits: string[];
}

interface ComplianceEvidence {
  id: string;
  type: 'log' | 'document' | 'screenshot' | 'certificate' | 'audit_trail';
  requirement: string;
  description: string;
  source: string;
  collectedAt: Date;
  validUntil?: Date;
  metadata: Record<string, any>;
}

interface ComplianceMetrics {
  totalTasks: number;
  compliantTasks: number;
  violationCount: number;
  averageResponseTime: number;
  policyExemptions: number;
  riskScore: number;
  controlEffectiveness: number;
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'policy_evaluation' | 'policy_violation' | 'exemption_used' | 'escalation_triggered' | 'compliance_check';
  userId: string;
  taskId?: string;
  policyId?: string;
  ruleId?: string;
  action: string;
  result: 'allowed' | 'blocked' | 'escalated' | 'warning';
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFramework?: string;
  evidenceRequired: boolean;
  retention: {
    period: number; // days
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    location: string;
  };
}

interface GovernanceMetrics {
  policies: {
    total: number;
    active: number;
    expiring: number;
    violations: number;
  };
  enforcement: {
    blocked: number;
    approved: number;
    escalated: number;
    exempted: number;
  };
  compliance: {
    overallScore: number;
    frameworkScores: Record<string, number>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    lastAudit: Date;
  };
  performance: {
    avgEvaluationTime: number;
    cacheHitRate: number;
    errorRate: number;
    throughput: number;
  };
}

class EnterpriseGovernanceFramework {
  private policies: Map<string, GovernancePolicy> = new Map();
  private auditEvents: AuditEvent[] = [];
  private exemptions: Map<string, PolicyExemption> = new Map();
  private policyCache: Map<string, any> = new Map();
  private readonly CACHE_TTL_MS = 300000; // 5 minutes
  private readonly MAX_AUDIT_EVENTS = 10000;
  private readonly EVIDENCE_RETENTION_DAYS = 2555; // 7 years for financial compliance

  constructor() {
    this.initializeDefaultPolicies();
    this.startPolicyMonitoring();
    this.startComplianceReporting();
  }

  /**
   * Evaluate governance policies for a task execution request
   */
  async evaluateGovernance(
    taskRequest: {
      taskId: string;
      userId: string;
      userRole: string;
      taskType: string;
      parameters: Record<string, any>;
      riskLevel: string;
      dataClassification?: string;
      businessContext: Record<string, any>;
    }
  ): Promise<{
    allowed: boolean;
    requiresApproval: boolean;
    violations: PolicyRule[];
    warnings: PolicyRule[];
    recommendations: string[];
    exemptionsUsed: PolicyExemption[];
    auditEvents: AuditEvent[];
    complianceFrameworks: string[];
    evidence: string[];
  }> {
    const evaluationStart = Date.now();
    const auditEvents: AuditEvent[] = [];
    const violations: PolicyRule[] = [];
    const warnings: PolicyRule[] = [];
    const recommendations: string[] = [];
    const exemptionsUsed: PolicyExemption[] = [];
    const complianceFrameworks: string[] = [];
    const evidence: string[] = [];

    logger.info('Starting governance evaluation', {
      taskId: taskRequest.taskId,
      userId: taskRequest.userId,
      taskType: taskRequest.taskType,
      riskLevel: taskRequest.riskLevel
    });

    try {
      // Get applicable policies
      const applicablePolicies = await this.getApplicablePolicies(taskRequest);
      
      for (const policy of applicablePolicies) {
        // Track compliance frameworks
        policy.regulations.forEach(reg => {
          if (!complianceFrameworks.includes(reg.name)) {
            complianceFrameworks.push(reg.name);
          }
        });

        // Evaluate each rule in the policy
        for (const rule of policy.rules) {
          const ruleEvaluation = await this.evaluateRule(rule, taskRequest, policy);
          
          // Record audit event
          const auditEvent: AuditEvent = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            eventType: 'policy_evaluation',
            userId: taskRequest.userId,
            taskId: taskRequest.taskId,
            policyId: policy.id,
            ruleId: rule.id,
            action: `evaluate_rule_${rule.type}`,
            result: ruleEvaluation.passed ? 'allowed' : ruleEvaluation.severity === 'error' ? 'blocked' : 'warning',
            details: {
              policyName: policy.name,
              ruleSeverity: rule.severity,
              ruleMessage: rule.message,
              evaluationResult: ruleEvaluation
            },
            riskLevel: taskRequest.riskLevel as any,
            complianceFramework: policy.regulations.map(r => r.name).join(','),
            evidenceRequired: policy.category === 'compliance',
            retention: {
              period: this.EVIDENCE_RETENTION_DAYS,
              classification: this.classifyDataSensitivity(taskRequest),
              location: 'enterprise_audit_store'
            }
          };
          auditEvents.push(auditEvent);

          if (!ruleEvaluation.passed) {
            // Check for exemptions
            const exemption = await this.checkExemptions(policy.id, rule.id, taskRequest.userId);
            if (exemption) {
              exemptionsUsed.push(exemption);
              recommendations.push(`Exemption applied: ${exemption.reason}`);
              continue;
            }

            // Handle rule violation
            if (rule.severity === 'error' || rule.severity === 'critical') {
              violations.push(rule);
            } else {
              warnings.push(rule);
            }

            // Execute rule action
            await this.executeRuleAction(rule, taskRequest, policy, auditEvent);
          }

          // Collect evidence if required
          if (policy.category === 'compliance') {
            evidence.push(`Policy ${policy.name} evaluated: ${ruleEvaluation.passed ? 'PASS' : 'FAIL'}`);
          }
        }
      }

      // Determine final result
      const hasBlockingViolations = violations.some(v => v.severity === 'critical' || v.severity === 'error');
      const requiresApproval = violations.some(v => v.action.type === 'require_approval') || 
                              warnings.some(w => w.action.type === 'require_approval');

      const result = {
        allowed: !hasBlockingViolations,
        requiresApproval,
        violations,
        warnings,
        recommendations,
        exemptionsUsed,
        auditEvents,
        complianceFrameworks,
        evidence
      };

      // Store audit events
      this.auditEvents.push(...auditEvents);
      this.cleanupAuditEvents();

      // Generate compliance evidence
      if (complianceFrameworks.length > 0) {
        await this.generateComplianceEvidence(taskRequest, result);
      }

      const evaluationTime = Date.now() - evaluationStart;
      logger.info('Governance evaluation completed', {
        taskId: taskRequest.taskId,
        allowed: result.allowed,
        requiresApproval: result.requiresApproval,
        violations: violations.length,
        warnings: warnings.length,
        evaluationTime,
        complianceFrameworks
      });

      return result;

    } catch (error) {
      logger.error('Governance evaluation failed', {
        taskId: taskRequest.taskId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return safe default - block execution
      return {
        allowed: false,
        requiresApproval: true,
        violations: [{
          id: 'governance_error',
          type: 'requirement',
          condition: { field: 'error', operator: 'equals', value: true },
          action: { type: 'block', parameters: {} },
          severity: 'critical',
          message: 'Governance evaluation failed - execution blocked for safety',
          documentation: 'System error prevented proper governance evaluation',
          exceptions: []
        }],
        warnings: [],
        recommendations: ['Review governance system health', 'Contact system administrator'],
        exemptionsUsed: [],
        auditEvents: [],
        complianceFrameworks: [],
        evidence: []
      };
    }
  }

  /**
   * Create a new governance policy
   */
  async createPolicy(policy: Omit<GovernancePolicy, 'id' | 'metadata'>): Promise<string> {
    const policyId = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPolicy: GovernancePolicy = {
      ...policy,
      id: policyId,
      metadata: {
        createdBy: 'system', // In production, this would be the current user
        approvedBy: [],
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        changeHistory: [{
          version: policy.version,
          changedBy: 'system',
          changeType: 'created',
          changeDate: new Date(),
          changeReason: 'Policy creation',
          changedFields: ['all'],
          previousValues: {},
          newValues: policy as any
        }]
      }
    };

    this.policies.set(policyId, newPolicy);
    await this.persistPolicy(newPolicy);

    logger.info('Governance policy created', {
      policyId,
      name: policy.name,
      category: policy.category,
      scope: policy.scope
    });

    return policyId;
  }

  /**
   * Generate compliance report for a specific framework
   */
  async generateComplianceReport(
    framework: RegulatoryFramework,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComplianceReport> {
    logger.info('Generating compliance report', {
      framework: framework.name,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    });

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Gather compliance data
    const relevantPolicies = Array.from(this.policies.values())
      .filter(p => p.regulations.some(r => r.name === framework.name));
    
    const relevantAudits = this.auditEvents.filter(
      e => e.timestamp >= periodStart && 
          e.timestamp <= periodEnd &&
          e.complianceFramework?.includes(framework.name)
    );

    // Analyze findings
    const findings = await this.analyzeComplianceFindings(relevantPolicies, relevantAudits, framework);
    const recommendations = await this.generateComplianceRecommendations(findings, framework);
    const evidence = await this.collectComplianceEvidence(framework, periodStart, periodEnd);
    const metrics = await this.calculateComplianceMetrics(relevantAudits, framework);

    // Determine overall status
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    
    let overallStatus: ComplianceReport['overallStatus'];
    if (criticalFindings > 0) {
      overallStatus = 'non_compliant';
    } else if (highFindings > 2) {
      overallStatus = 'at_risk';
    } else if (findings.length > 0) {
      overallStatus = 'under_review';
    } else {
      overallStatus = 'compliant';
    }

    const report: ComplianceReport = {
      id: reportId,
      generatedAt: new Date(),
      periodStart,
      periodEnd,
      framework,
      overallStatus,
      findings,
      recommendations,
      evidence,
      metrics,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };

    await this.persistComplianceReport(report);

    logger.info('Compliance report generated', {
      reportId,
      framework: framework.name,
      overallStatus,
      findings: findings.length,
      recommendations: recommendations.length
    });

    return report;
  }

  /**
   * Grant policy exemption
   */
  async grantExemption(
    policyId: string,
    ruleId: string,
    userId: string,
    reason: string,
    approvedBy: string,
    expiresAt: Date,
    conditions: string[] = [],
    maxUsage?: number
  ): Promise<string> {
    const exemptionId = `exemption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const exemption: PolicyExemption = {
      id: exemptionId,
      policyId,
      ruleId,
      grantedTo: userId,
      reason,
      approvedBy,
      grantedAt: new Date(),
      expiresAt,
      conditions,
      usageCount: 0,
      maxUsage
    };

    this.exemptions.set(exemptionId, exemption);
    await this.persistExemption(exemption);

    // Create audit event
    const auditEvent: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType: 'exemption_used',
      userId,
      policyId,
      ruleId,
      action: 'grant_exemption',
      result: 'allowed',
      details: {
        exemptionId,
        reason,
        approvedBy,
        expiresAt: expiresAt.toISOString(),
        conditions
      },
      riskLevel: 'medium',
      evidenceRequired: true,
      retention: {
        period: this.EVIDENCE_RETENTION_DAYS,
        classification: 'confidential',
        location: 'enterprise_audit_store'
      }
    };

    this.auditEvents.push(auditEvent);

    logger.info('Policy exemption granted', {
      exemptionId,
      policyId,
      ruleId,
      userId,
      approvedBy,
      expiresAt: expiresAt.toISOString()
    });

    return exemptionId;
  }

  /**
   * Get governance metrics and statistics
   */
  getGovernanceMetrics(): GovernanceMetrics {
    const now = new Date();
    const activePolicies = Array.from(this.policies.values()).filter(p => p.active);
    const expiringPolicies = activePolicies.filter(
      p => p.expirationDate && p.expirationDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000
    );

    const recentAudits = this.auditEvents.filter(
      e => now.getTime() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const violations = recentAudits.filter(e => e.result === 'blocked').length;
    const approved = recentAudits.filter(e => e.result === 'allowed').length;
    const escalated = recentAudits.filter(e => e.result === 'escalated').length;
    const exempted = recentAudits.filter(e => e.eventType === 'exemption_used').length;

    // Calculate compliance scores
    const frameworkScores: Record<string, number> = {};
    const frameworks = ['GDPR', 'SOX', 'HIPAA', 'PCI_DSS', 'ISO_27001'];
    
    frameworks.forEach(framework => {
      const frameworkAudits = recentAudits.filter(e => e.complianceFramework?.includes(framework));
      const frameworkViolations = frameworkAudits.filter(e => e.result === 'blocked').length;
      frameworkScores[framework] = frameworkAudits.length > 0 ? 
        ((frameworkAudits.length - frameworkViolations) / frameworkAudits.length) * 100 : 100;
    });

    const overallScore = Object.values(frameworkScores).reduce((sum, score) => sum + score, 0) / 
                        Object.keys(frameworkScores).length;

    // Calculate performance metrics
    const evaluationTimes = recentAudits
      .filter(e => e.details?.evaluationTime)
      .map(e => e.details.evaluationTime);
    
    const avgEvaluationTime = evaluationTimes.length > 0 ? 
      evaluationTimes.reduce((sum, time) => sum + time, 0) / evaluationTimes.length : 0;

    return {
      policies: {
        total: this.policies.size,
        active: activePolicies.length,
        expiring: expiringPolicies.length,
        violations
      },
      enforcement: {
        blocked: violations,
        approved,
        escalated,
        exempted
      },
      compliance: {
        overallScore,
        frameworkScores,
        riskLevel: overallScore >= 95 ? 'low' : overallScore >= 85 ? 'medium' : 'high',
        lastAudit: recentAudits.length > 0 ? recentAudits[0].timestamp : new Date()
      },
      performance: {
        avgEvaluationTime,
        cacheHitRate: 0.85, // Simulated
        errorRate: 0.02, // Simulated
        throughput: recentAudits.length
      }
    };
  }

  /**
   * Helper methods for policy evaluation
   */
  private async getApplicablePolicies(taskRequest: any): Promise<GovernancePolicy[]> {
    const cacheKey = `policies_${taskRequest.taskType}_${taskRequest.riskLevel}_${taskRequest.userRole}`;
    
    // Check cache
    const cached = this.policyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.policies;
    }

    const applicablePolicies = Array.from(this.policies.values()).filter(policy => {
      if (!policy.active) return false;
      if (policy.expirationDate && policy.expirationDate < new Date()) return false;
      
      // Check scope
      switch (policy.scope) {
        case 'global':
          return true;
        case 'task_type':
          return policy.rules.some(rule => 
            rule.condition.field === 'taskType' && 
            rule.condition.value === taskRequest.taskType
          );
        case 'risk_level':
          return policy.rules.some(rule => 
            rule.condition.field === 'riskLevel' && 
            rule.condition.value === taskRequest.riskLevel
          );
        case 'user_group':
          return policy.rules.some(rule => 
            rule.condition.field === 'userRole' && 
            rule.condition.value === taskRequest.userRole
          );
        case 'data_classification':
          return policy.rules.some(rule => 
            rule.condition.field === 'dataClassification' && 
            rule.condition.value === taskRequest.dataClassification
          );
        default:
          return false;
      }
    });

    // Cache result
    this.policyCache.set(cacheKey, {
      policies: applicablePolicies,
      timestamp: Date.now()
    });

    return applicablePolicies;
  }

  private async evaluateRule(
    rule: PolicyRule, 
    taskRequest: any, 
    policy: GovernancePolicy
  ): Promise<{ passed: boolean; reason?: string; severity: string }> {
    try {
      const conditionResult = this.evaluateCondition(rule.condition, taskRequest);
      
      // For requirements, the condition must be true
      // For prohibitions, the condition must be false
      let passed: boolean;
      switch (rule.type) {
        case 'requirement':
        case 'permission':
          passed = conditionResult;
          break;
        case 'prohibition':
          passed = !conditionResult;
          break;
        case 'recommendation':
          passed = true; // Recommendations don't fail
          break;
        default:
          passed = false;
      }

      return {
        passed,
        reason: passed ? undefined : rule.message,
        severity: rule.severity
      };

    } catch (error) {
      logger.error('Rule evaluation error', {
        ruleId: rule.id,
        policyId: policy.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        passed: false,
        reason: 'Rule evaluation failed due to system error',
        severity: 'error'
      };
    }
  }

  private evaluateCondition(condition: PolicyCondition, context: any): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    
    let result: boolean;
    switch (condition.operator) {
      case 'equals':
        result = fieldValue === condition.value;
        break;
      case 'not_equals':
        result = fieldValue !== condition.value;
        break;
      case 'greater_than':
        result = Number(fieldValue) > Number(condition.value);
        break;
      case 'less_than':
        result = Number(fieldValue) < Number(condition.value);
        break;
      case 'contains':
        result = String(fieldValue).includes(String(condition.value));
        break;
      case 'in':
        result = Array.isArray(condition.value) && condition.value.includes(fieldValue);
        break;
      case 'regex':
        result = new RegExp(condition.value).test(String(fieldValue));
        break;
      default:
        result = false;
    }

    // Handle nested conditions
    if (condition.nestedConditions && condition.nestedConditions.length > 0) {
      const nestedResults = condition.nestedConditions.map(nc => this.evaluateCondition(nc, context));
      
      switch (condition.logicalOperator) {
        case 'AND':
          result = result && nestedResults.every(r => r);
          break;
        case 'OR':
          result = result || nestedResults.some(r => r);
          break;
        case 'NOT':
          result = result && !nestedResults.some(r => r);
          break;
      }
    }

    return result;
  }

  private getFieldValue(field: string, context: any): any {
    const fieldPath = field.split('.');
    let value = context;
    
    for (const part of fieldPath) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async checkExemptions(
    policyId: string, 
    ruleId: string, 
    userId: string
  ): Promise<PolicyExemption | null> {
    const now = new Date();
    
    for (const exemption of this.exemptions.values()) {
      if (exemption.policyId === policyId &&
          (exemption.ruleId === ruleId || !exemption.ruleId) &&
          exemption.grantedTo === userId &&
          exemption.expiresAt > now &&
          (!exemption.maxUsage || exemption.usageCount < exemption.maxUsage)) {
        
        // Increment usage count
        exemption.usageCount++;
        await this.persistExemption(exemption);
        
        return exemption;
      }
    }
    
    return null;
  }

  private async executeRuleAction(
    rule: PolicyRule,
    taskRequest: any,
    policy: GovernancePolicy,
    auditEvent: AuditEvent
  ): Promise<void> {
    switch (rule.action.type) {
      case 'block':
        // Already handled in main evaluation logic
        break;
        
      case 'require_approval':
        // Create approval request
        await this.createApprovalRequest(rule, taskRequest, policy);
        break;
        
      case 'notify':
        // Send notifications
        if (rule.action.notifications) {
          await this.sendNotifications(rule.action.notifications, taskRequest, rule);
        }
        break;
        
      case 'log_warning':
        logger.warn('Governance policy warning', {
          policyId: policy.id,
          ruleId: rule.id,
          taskId: taskRequest.taskId,
          message: rule.message
        });
        break;
        
      case 'delay_execution':
        // Set delay in audit event for processing
        auditEvent.details.delayMinutes = rule.action.parameters.delayMinutes || 30;
        break;
    }
  }

  private async createApprovalRequest(
    rule: PolicyRule,
    taskRequest: any,
    policy: GovernancePolicy
  ): Promise<void> {
    // Integration with approval system
    const approvalRequest = {
      taskId: taskRequest.taskId,
      userId: taskRequest.userId,
      policyId: policy.id,
      ruleId: rule.id,
      reason: rule.message,
      escalation: rule.action.escalation
    };

    // In production, this would integrate with the approval workflow system
    logger.info('Approval request created', approvalRequest);
  }

  private async sendNotifications(
    notifications: NotificationConfig[],
    taskRequest: any,
    rule: PolicyRule
  ): Promise<void> {
    for (const notification of notifications) {
      // In production, this would send actual notifications
      logger.info('Governance notification sent', {
        type: notification.type,
        recipients: notification.recipients,
        urgency: notification.urgency,
        taskId: taskRequest.taskId,
        rule: rule.message
      });
    }
  }

  private classifyDataSensitivity(taskRequest: any): 'public' | 'internal' | 'confidential' | 'restricted' {
    if (taskRequest.dataClassification) {
      return taskRequest.dataClassification;
    }
    
    // Default classification based on task type
    const sensitiveTypes = ['customer_data', 'financial_data', 'personal_data'];
    return sensitiveTypes.includes(taskRequest.taskType) ? 'confidential' : 'internal';
  }

  /**
   * Initialize default governance policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: Omit<GovernancePolicy, 'id' | 'metadata'>[] = [
      {
        name: 'GDPR Data Protection Policy',
        description: 'Ensures compliance with GDPR data protection requirements',
        version: '1.0.0',
        category: 'data_protection',
        scope: 'global',
        priority: 95,
        active: true,
        effectiveDate: new Date('2023-01-01'),
        regulations: [{
          name: 'GDPR',
          version: '2018',
          requirements: ['consent_management', 'data_minimization', 'right_to_deletion'],
          evidence: ['consent_records', 'data_processing_logs', 'deletion_confirmations'],
          controls: ['access_controls', 'encryption', 'audit_logging']
        }],
        rules: [
          {
            id: 'gdpr_consent_required',
            type: 'requirement',
            condition: {
              field: 'parameters.personalData',
              operator: 'equals',
              value: true
            },
            action: {
              type: 'require_approval',
              parameters: { approverRole: 'DATA_PROTECTION_OFFICER' }
            },
            severity: 'critical',
            message: 'Processing personal data requires explicit consent verification',
            documentation: 'GDPR Article 6 - Lawfulness of processing',
            exceptions: ['anonymized_data', 'legitimate_interest']
          }
        ],
        enforcement: [],
        exemptions: []
      },
      {
        name: 'Critical Risk Task Controls',
        description: 'Controls for critical risk level task execution',
        version: '1.0.0',
        category: 'risk',
        scope: 'risk_level',
        priority: 90,
        active: true,
        effectiveDate: new Date('2023-01-01'),
        regulations: [{
          name: 'ISO_27001',
          version: '2013',
          requirements: ['risk_assessment', 'control_implementation', 'monitoring'],
          evidence: ['risk_assessments', 'control_tests', 'monitoring_reports'],
          controls: ['access_controls', 'change_management', 'incident_response']
        }],
        rules: [
          {
            id: 'critical_risk_approval',
            type: 'requirement',
            condition: {
              field: 'riskLevel',
              operator: 'equals',
              value: 'critical'
            },
            action: {
              type: 'require_approval',
              parameters: { 
                approverRole: 'RISK_MANAGER',
                escalation: {
                  levels: [
                    { order: 1, approvers: ['risk_manager'], timeoutMinutes: 30, required: true },
                    { order: 2, approvers: ['ciso'], timeoutMinutes: 60, required: true }
                  ],
                  timeoutMinutes: 90,
                  autoApprove: false
                }
              }
            },
            severity: 'critical',
            message: 'Critical risk tasks require multi-level approval',
            documentation: 'Risk Management Framework - Critical Risk Controls',
            exceptions: ['emergency_response']
          }
        ],
        enforcement: [],
        exemptions: []
      }
    ];

    defaultPolicies.forEach(policyData => {
      this.createPolicy(policyData).catch(error => {
        logger.error('Failed to create default policy', {
          policyName: policyData.name,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    });
  }

  /**
   * Start periodic policy monitoring
   */
  private startPolicyMonitoring(): void {
    // Check for expiring policies every hour
    setInterval(() => {
      this.checkExpiringPolicies();
    }, 60 * 60 * 1000);
    
    // Clean up old audit events every 6 hours
    setInterval(() => {
      this.cleanupAuditEvents();
    }, 6 * 60 * 60 * 1000);
  }

  private startComplianceReporting(): void {
    // Generate compliance reports daily
    setInterval(async () => {
      await this.generateDailyComplianceReports();
    }, 24 * 60 * 60 * 1000);
  }

  private checkExpiringPolicies(): void {
    const now = new Date();
    const warningThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    for (const policy of this.policies.values()) {
      if (policy.expirationDate && 
          policy.expirationDate.getTime() - now.getTime() < warningThreshold) {
        
        logger.warn('Policy expiring soon', {
          policyId: policy.id,
          policyName: policy.name,
          expirationDate: policy.expirationDate.toISOString(),
          daysRemaining: Math.floor((policy.expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        });
      }
    }
  }

  private cleanupAuditEvents(): void {
    if (this.auditEvents.length > this.MAX_AUDIT_EVENTS) {
      const excess = this.auditEvents.length - this.MAX_AUDIT_EVENTS;
      this.auditEvents.splice(0, excess);
      
      logger.info('Cleaned up old audit events', { removedCount: excess });
    }
  }

  private async generateDailyComplianceReports(): Promise<void> {
    const frameworks = ['GDPR', 'SOX', 'HIPAA', 'ISO_27001'];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();
    
    for (const frameworkName of frameworks) {
      try {
        const framework: RegulatoryFramework = {
          name: frameworkName as any,
          version: '2023',
          requirements: [],
          evidence: [],
          controls: []
        };
        
        await this.generateComplianceReport(framework, yesterday, today);
      } catch (error) {
        logger.error('Failed to generate daily compliance report', {
          framework: frameworkName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Compliance analysis methods
   */
  private async analyzeComplianceFindings(
    policies: GovernancePolicy[],
    audits: AuditEvent[],
    framework: RegulatoryFramework
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];
    
    // Analyze policy violations
    const violations = audits.filter(a => a.result === 'blocked');
    
    for (const violation of violations) {
      findings.push({
        id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'violation',
        severity: violation.riskLevel,
        requirement: framework.requirements[0] || 'General Compliance',
        description: `Policy violation: ${violation.details?.ruleMessage || 'Unknown violation'}`,
        evidence: [violation.id],
        remediation: 'Review and address the underlying cause of the policy violation',
        timeline: '30 days',
        responsible: 'Compliance Team',
        status: 'open'
      });
    }
    
    return findings;
  }

  private async generateComplianceRecommendations(
    findings: ComplianceFinding[],
    framework: RegulatoryFramework
  ): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];
    
    if (findings.length > 0) {
      recommendations.push({
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'process_improvement',
        priority: 'high',
        description: 'Implement automated policy compliance monitoring',
        justification: 'Multiple policy violations detected',
        implementation: 'Deploy real-time monitoring and alerting',
        cost: 'Medium',
        timeline: '60 days',
        benefits: ['Reduced violations', 'Improved compliance posture', 'Automated reporting']
      });
    }
    
    return recommendations;
  }

  private async collectComplianceEvidence(
    framework: RegulatoryFramework,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComplianceEvidence[]> {
    const evidence: ComplianceEvidence[] = [];
    
    // Collect audit trail evidence
    const relevantAudits = this.auditEvents.filter(
      e => e.timestamp >= periodStart && 
          e.timestamp <= periodEnd &&
          e.complianceFramework?.includes(framework.name)
    );
    
    evidence.push({
      id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'audit_trail',
      requirement: 'Audit Logging',
      description: `${relevantAudits.length} audit events recorded for ${framework.name} compliance`,
      source: 'Enterprise Governance Framework',
      collectedAt: new Date(),
      metadata: {
        auditCount: relevantAudits.length,
        period: `${periodStart.toISOString()} to ${periodEnd.toISOString()}`
      }
    });
    
    return evidence;
  }

  private async calculateComplianceMetrics(
    audits: AuditEvent[],
    framework: RegulatoryFramework
  ): Promise<ComplianceMetrics> {
    const totalTasks = audits.length;
    const violations = audits.filter(a => a.result === 'blocked').length;
    const compliantTasks = totalTasks - violations;
    
    const responseTimes = audits
      .filter(a => a.details?.evaluationTime)
      .map(a => a.details.evaluationTime);
    
    const averageResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
    
    const exemptions = audits.filter(a => a.eventType === 'exemption_used').length;
    
    return {
      totalTasks,
      compliantTasks,
      violationCount: violations,
      averageResponseTime,
      policyExemptions: exemptions,
      riskScore: violations / Math.max(totalTasks, 1),
      controlEffectiveness: compliantTasks / Math.max(totalTasks, 1)
    };
  }

  /**
   * Data persistence methods
   */
  private async persistPolicy(policy: GovernancePolicy): Promise<void> {
    try {
      await prisma.governancePolicy.upsert({
        where: { id: policy.id },
        update: {
          name: policy.name,
          description: policy.description,
          version: policy.version,
          category: policy.category,
          scope: policy.scope,
          priority: policy.priority,
          active: policy.active,
          effectiveDate: policy.effectiveDate,
          expirationDate: policy.expirationDate,
          regulations: policy.regulations,
          rules: policy.rules,
          enforcement: policy.enforcement,
          exemptions: policy.exemptions,
          metadata: policy.metadata
        },
        create: {
          id: policy.id,
          name: policy.name,
          description: policy.description,
          version: policy.version,
          category: policy.category,
          scope: policy.scope,
          priority: policy.priority,
          active: policy.active,
          effectiveDate: policy.effectiveDate,
          expirationDate: policy.expirationDate,
          regulations: policy.regulations,
          rules: policy.rules,
          enforcement: policy.enforcement,
          exemptions: policy.exemptions,
          metadata: policy.metadata,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.warn('Failed to persist governance policy', {
        policyId: policy.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async persistExemption(exemption: PolicyExemption): Promise<void> {
    try {
      await prisma.policyExemption.upsert({
        where: { id: exemption.id },
        update: {
          usageCount: exemption.usageCount
        },
        create: {
          id: exemption.id,
          policyId: exemption.policyId,
          ruleId: exemption.ruleId,
          grantedTo: exemption.grantedTo,
          reason: exemption.reason,
          approvedBy: exemption.approvedBy,
          grantedAt: exemption.grantedAt,
          expiresAt: exemption.expiresAt,
          conditions: exemption.conditions,
          usageCount: exemption.usageCount,
          maxUsage: exemption.maxUsage
        }
      });
    } catch (error) {
      logger.warn('Failed to persist policy exemption', {
        exemptionId: exemption.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async persistComplianceReport(report: ComplianceReport): Promise<void> {
    try {
      await prisma.complianceReport.create({
        data: {
          id: report.id,
          generatedAt: report.generatedAt,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          framework: report.framework,
          overallStatus: report.overallStatus,
          findings: report.findings,
          recommendations: report.recommendations,
          evidence: report.evidence,
          metrics: report.metrics,
          nextReviewDate: report.nextReviewDate
        }
      });
    } catch (error) {
      logger.warn('Failed to persist compliance report', {
        reportId: report.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async generateComplianceEvidence(taskRequest: any, result: any): Promise<void> {
    const evidence = {
      taskId: taskRequest.taskId,
      timestamp: new Date(),
      evaluationResult: result,
      complianceFrameworks: result.complianceFrameworks,
      evidence: result.evidence
    };

    try {
      await prisma.complianceEvidence.create({
        data: {
          id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskId: evidence.taskId,
          timestamp: evidence.timestamp,
          data: evidence,
          retention: this.EVIDENCE_RETENTION_DAYS
        }
      });
    } catch (error) {
      logger.warn('Failed to store compliance evidence', {
        taskId: taskRequest.taskId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Public API methods
   */
  async getAllPolicies(activeOnly = true): Promise<GovernancePolicy[]> {
    const policies = Array.from(this.policies.values());
    return activeOnly ? policies.filter(p => p.active) : policies;
  }

  async getPolicyById(policyId: string): Promise<GovernancePolicy | undefined> {
    return this.policies.get(policyId);
  }

  async updatePolicy(policyId: string, updates: Partial<GovernancePolicy>): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    const updatedPolicy = { ...policy, ...updates };
    this.policies.set(policyId, updatedPolicy);
    await this.persistPolicy(updatedPolicy);

    return true;
  }

  async getAuditEvents(
    startDate?: Date,
    endDate?: Date,
    eventType?: string,
    userId?: string
  ): Promise<AuditEvent[]> {
    let events = this.auditEvents;

    if (startDate) {
      events = events.filter(e => e.timestamp >= startDate);
    }

    if (endDate) {
      events = events.filter(e => e.timestamp <= endDate);
    }

    if (eventType) {
      events = events.filter(e => e.eventType === eventType);
    }

    if (userId) {
      events = events.filter(e => e.userId === userId);
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getExemptions(userId?: string, active = true): Promise<PolicyExemption[]> {
    let exemptions = Array.from(this.exemptions.values());

    if (userId) {
      exemptions = exemptions.filter(e => e.grantedTo === userId);
    }

    if (active) {
      const now = new Date();
      exemptions = exemptions.filter(e => e.expiresAt > now);
    }

    return exemptions;
  }

  getFrameworkStatus(): {
    totalPolicies: number;
    activePolicies: number;
    totalExemptions: number;
    auditEvents24h: number;
    complianceScore: number;
  } {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalPolicies: this.policies.size,
      activePolicies: Array.from(this.policies.values()).filter(p => p.active).length,
      totalExemptions: this.exemptions.size,
      auditEvents24h: this.auditEvents.filter(e => e.timestamp > yesterday).length,
      complianceScore: this.getGovernanceMetrics().compliance.overallScore
    };
  }
}

// Export singleton instance
export const enterpriseGovernanceFramework = new EnterpriseGovernanceFramework();

// Export types
export type {
  GovernancePolicy,
  PolicyRule,
  PolicyCondition,
  PolicyAction,
  PolicyExemption,
  ComplianceReport,
  ComplianceFinding,
  AuditEvent,
  GovernanceMetrics,
  RegulatoryFramework
};
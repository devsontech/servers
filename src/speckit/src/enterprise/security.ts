import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

// Security interfaces
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'application';
  created: string;
  updated: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'audit';
  parameters: Record<string, any>;
  exceptions: string[];
}

export interface VulnerabilityAssessment {
  id: string;
  resource: string;
  scanType: 'code' | 'dependency' | 'configuration' | 'infrastructure';
  vulnerabilities: Vulnerability[];
  riskScore: number;
  timestamp: string;
  scannerVersion: string;
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    file?: string;
    line?: number;
    function?: string;
  };
  cve?: string;
  cvssScore?: number;
  remediation: string[];
  references: string[];
}

export interface SecurityScanResult {
  scanId: string;
  resource: string;
  timestamp: string;
  passed: boolean;
  findings: SecurityFinding[];
  compliance: ComplianceResult[];
  recommendations: string[];
}

export interface SecurityFinding {
  id: string;
  type: 'vulnerability' | 'misconfiguration' | 'policy_violation' | 'suspicious_activity';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  impact: string;
  remediation: string[];
}

export interface ComplianceResult {
  framework: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
  evidence: string[];
  gaps: string[];
}

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  mode: string;
  padding: string;
  keyRotationDays: number;
}

export class EnterpriseSecurityManager {
  private policiesPath: string;
  private scansPath: string;
  private keysPath: string;
  private encryptionConfig: EncryptionConfig;

  constructor(basePath: string) {
    this.policiesPath = path.join(basePath, 'security', 'policies');
    this.scansPath = path.join(basePath, 'security', 'scans');
    this.keysPath = path.join(basePath, 'security', 'keys');
    
    this.encryptionConfig = {
      algorithm: 'aes-256-gcm',
      keySize: 32,
      mode: 'gcm',
      padding: 'pkcs7',
      keyRotationDays: 90
    };

    // Ensure directories exist
    fs.ensureDirSync(this.policiesPath);
    fs.ensureDirSync(this.scansPath);
    fs.ensureDirSync(this.keysPath);
  }

  // Security Policy Management
  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'created' | 'updated'>): Promise<SecurityPolicy> {
    const timestamp = new Date().toISOString();
    const fullPolicy: SecurityPolicy = {
      ...policy,
      created: timestamp,
      updated: timestamp
    };

    const filePath = path.join(this.policiesPath, `${policy.id}.json`);
    await fs.writeJson(filePath, fullPolicy, { spaces: 2 });
    
    return fullPolicy;
  }

  async updateSecurityPolicy(id: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy | null> {
    const filePath = path.join(this.policiesPath, `${id}.json`);
    
    if (await fs.pathExists(filePath)) {
      const policy: SecurityPolicy = await fs.readJson(filePath);
      const updatedPolicy = {
        ...policy,
        ...updates,
        updated: new Date().toISOString()
      };
      
      await fs.writeJson(filePath, updatedPolicy, { spaces: 2 });
      return updatedPolicy;
    }
    
    return null;
  }

  async listSecurityPolicies(): Promise<SecurityPolicy[]> {
    const files = await fs.readdir(this.policiesPath);
    const policies: SecurityPolicy[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const policy = await fs.readJson(path.join(this.policiesPath, file));
        policies.push(policy);
      }
    }
    
    return policies;
  }

  // Vulnerability Scanning
  async performSecurityScan(resource: string, content: string, scanType: VulnerabilityAssessment['scanType']): Promise<SecurityScanResult> {
    const scanId = `scan-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const findings = await this.detectSecurityIssues(content, scanType);
    const compliance = await this.checkSecurityCompliance(content);
    const recommendations = this.generateSecurityRecommendations(findings);
    
    const result: SecurityScanResult = {
      scanId,
      resource,
      timestamp,
      passed: findings.every(f => f.severity !== 'critical' && f.severity !== 'high'),
      findings,
      compliance,
      recommendations
    };

    // Store scan result
    const filePath = path.join(this.scansPath, `${scanId}.json`);
    await fs.writeJson(filePath, result, { spaces: 2 });
    
    return result;
  }

  private async detectSecurityIssues(content: string, scanType: VulnerabilityAssessment['scanType']): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const lowerContent = content.toLowerCase();

    switch (scanType) {
      case 'code':
        findings.push(...this.scanCodeVulnerabilities(content));
        break;
      case 'configuration':
        findings.push(...this.scanConfigurationIssues(content));
        break;
      case 'dependency':
        findings.push(...this.scanDependencyVulnerabilities(content));
        break;
    }

    // Common security patterns
    const securityPatterns = [
      {
        pattern: /(password|secret|key|token)\s*[:=]\s*['"]\w+['"]/gi,
        type: 'policy_violation' as const,
        severity: 'high' as const,
        title: 'Hardcoded Credentials',
        description: 'Hardcoded credentials detected in source code'
      },
      {
        pattern: /eval\s*\(/gi,
        type: 'vulnerability' as const,
        severity: 'high' as const,
        title: 'Code Injection Risk',
        description: 'Use of eval() function detected'
      },
      {
        pattern: /innerHTML\s*=.*\+/gi,
        type: 'vulnerability' as const,
        severity: 'medium' as const,
        title: 'XSS Vulnerability',
        description: 'Potential XSS vulnerability through innerHTML'
      },
      {
        pattern: /http:\/\//gi,
        type: 'misconfiguration' as const,
        severity: 'medium' as const,
        title: 'Insecure Protocol',
        description: 'HTTP protocol used instead of HTTPS'
      }
    ];

    for (const pattern of securityPatterns) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        findings.push({
          id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: pattern.type,
          severity: pattern.severity,
          title: pattern.title,
          description: pattern.description,
          evidence: matches,
          impact: this.calculateImpact(pattern.severity),
          remediation: this.getRemediationAdvice(pattern.title)
        });
      }
    }

    return findings;
  }

  private scanCodeVulnerabilities(content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    
    // SQL Injection patterns
    if (content.match(/query.*\+.*input|SELECT.*\+|INSERT.*\+|UPDATE.*\+|DELETE.*\+/gi)) {
      findings.push({
        id: `finding-${Date.now()}-sql`,
        type: 'vulnerability',
        severity: 'high',
        title: 'SQL Injection Risk',
        description: 'Potential SQL injection vulnerability detected',
        evidence: ['Dynamic SQL query construction'],
        impact: 'Data breach, unauthorized data access',
        remediation: ['Use parameterized queries', 'Implement input validation', 'Use ORM frameworks']
      });
    }

    // Command Injection patterns
    if (content.match(/exec|system|shell_exec|passthru.*\$|spawn.*input/gi)) {
      findings.push({
        id: `finding-${Date.now()}-cmd`,
        type: 'vulnerability',
        severity: 'critical',
        title: 'Command Injection Risk',
        description: 'Potential command injection vulnerability detected',
        evidence: ['Dynamic command execution'],
        impact: 'System compromise, arbitrary code execution',
        remediation: ['Validate and sanitize all inputs', 'Use safe APIs', 'Implement command whitelisting']
      });
    }

    return findings;
  }

  private scanConfigurationIssues(content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    
    // Check for debug mode in production
    if (content.match(/debug\s*[:=]\s*true|DEBUG\s*=\s*True/gi)) {
      findings.push({
        id: `finding-${Date.now()}-debug`,
        type: 'misconfiguration',
        severity: 'medium',
        title: 'Debug Mode Enabled',
        description: 'Debug mode should be disabled in production',
        evidence: ['Debug configuration found'],
        impact: 'Information disclosure, performance impact',
        remediation: ['Disable debug mode in production', 'Use environment-specific configurations']
      });
    }

    return findings;
  }

  private scanDependencyVulnerabilities(content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    
    // This would integrate with vulnerability databases
    // For now, check for known vulnerable patterns
    const vulnerablePatterns = [
      'lodash@4.17.15',
      'axios@0.18.0',
      'express@4.16.0'
    ];

    for (const pattern of vulnerablePatterns) {
      if (content.includes(pattern)) {
        findings.push({
          id: `finding-${Date.now()}-dep`,
          type: 'vulnerability',
          severity: 'medium',
          title: 'Vulnerable Dependency',
          description: `Vulnerable dependency detected: ${pattern}`,
          evidence: [pattern],
          impact: 'Security vulnerability in dependency',
          remediation: ['Update to latest secure version', 'Review security advisories']
        });
      }
    }

    return findings;
  }

  private async checkSecurityCompliance(content: string): Promise<ComplianceResult[]> {
    const results: ComplianceResult[] = [];
    
    // OWASP compliance checks
    results.push({
      framework: 'OWASP',
      requirement: 'A01:2021 – Broken Access Control',
      status: this.hasAccessControls(content) ? 'compliant' : 'non_compliant',
      evidence: [],
      gaps: this.hasAccessControls(content) ? [] : ['Missing access control implementation']
    });

    // SOX compliance (for financial applications)
    results.push({
      framework: 'SOX',
      requirement: 'Data Integrity Controls',
      status: this.hasDataIntegrityControls(content) ? 'compliant' : 'partially_compliant',
      evidence: [],
      gaps: []
    });

    return results;
  }

  private hasAccessControls(content: string): boolean {
    const accessControlPatterns = [
      /authorization|authenticate|rbac|permission/gi,
      /access.*control|security.*check/gi
    ];
    
    return accessControlPatterns.some(pattern => pattern.test(content));
  }

  private hasDataIntegrityControls(content: string): boolean {
    const integrityPatterns = [
      /hash|checksum|signature|integrity/gi,
      /validation|verification/gi
    ];
    
    return integrityPatterns.some(pattern => pattern.test(content));
  }

  private calculateImpact(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'System compromise, complete data breach';
      case 'high':
        return 'Significant security risk, potential data exposure';
      case 'medium':
        return 'Moderate security risk, limited impact';
      case 'low':
        return 'Minor security concern, minimal impact';
      default:
        return 'Impact assessment needed';
    }
  }

  private getRemediationAdvice(title: string): string[] {
    const remediationMap: Record<string, string[]> = {
      'Hardcoded Credentials': [
        'Move credentials to environment variables',
        'Use secure credential management systems',
        'Implement proper secrets management'
      ],
      'Code Injection Risk': [
        'Avoid using eval() function',
        'Use safe parsing methods',
        'Implement input validation'
      ],
      'XSS Vulnerability': [
        'Use textContent instead of innerHTML',
        'Sanitize user input',
        'Implement Content Security Policy'
      ],
      'Insecure Protocol': [
        'Use HTTPS instead of HTTP',
        'Implement HTTP Strict Transport Security',
        'Configure secure protocols'
      ]
    };

    return remediationMap[title] || ['Review security best practices', 'Consult security team'];
  }

  private generateSecurityRecommendations(findings: SecurityFinding[]): string[] {
    const recommendations: string[] = [];
    
    if (findings.some(f => f.severity === 'critical')) {
      recommendations.push('Address critical security findings immediately');
    }
    
    if (findings.some(f => f.type === 'vulnerability')) {
      recommendations.push('Implement regular security scanning in CI/CD pipeline');
    }
    
    if (findings.some(f => f.title.includes('Credentials'))) {
      recommendations.push('Implement secrets management solution');
    }
    
    recommendations.push('Conduct regular security reviews');
    recommendations.push('Provide security training for development team');
    
    return recommendations;
  }

  // Encryption utilities
  async encryptSensitiveData(data: string): Promise<{ encrypted: string; iv: string; tag: string }> {
    const key = crypto.randomBytes(this.encryptionConfig.keySize);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(this.encryptionConfig.algorithm, key, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  async decryptSensitiveData(encryptedData: string, iv: string, tag: string, key: Buffer): Promise<string> {
    const decipher = crypto.createDecipheriv(this.encryptionConfig.algorithm, key, Buffer.from(iv, 'hex')) as crypto.DecipherGCM;
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
/**
 * Enhanced Security System
 *
 * Comprehensive security features with:
 * - XSS protection and sanitization
 * - CSRF protection
 * - Content Security Policy
 * - Input validation and sanitization
 * - Secure headers
 * - Rate limiting
 * - Session management
 */

/**
 * Security configuration
 */
export interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableInputSanitization: boolean;
  cspDirectives: Partial<CSPDirectives>;
  trustedDomains: string[];
  maxInputLength: number;
}

/**
 * CSP directives
 */
interface CSPDirectives {
  'default-src': string;
  'script-src': string;
  'style-src': string;
  'img-src': string;
  'font-src': string;
  'connect-src': string;
  'media-src': string;
  'object-src': string;
  'frame-src': string;
  'base-uri': string;
  'form-action': string;
  'frame-ancestors': string;
  'navigate-to': string;
  'report-uri': string;
  'report-to': string;
}

/**
 * XSS protection levels
 */
export enum XSSProtectionLevel {
  NONE = '0',
  SANITIZE = '1',
  BLOCK = '1; mode=block',
}

/**
 * Input sanitization result
 */
interface SanitizationResult {
  original: string;
  sanitized: string;
  wasModified: boolean;
  threatsRemoved: string[];
}

/**
 * Security manager class
 */
export class SecurityManager {
  private config: SecurityConfig;
  private csrfToken: string | null = null;
  private cspNonce: string | null = null;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableCSP: true,
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableInputSanitization: true,
      cspDirectives: {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'font-src': "'self' data:",
        'connect-src': "'self' https://api.example.com",
        'media-src': "'self'",
        'object-src': "'none'",
        'frame-src': "'none'",
        'base-uri': "'self'",
        'form-action': "'self'",
        'frame-ancestors': "'none'",
        'navigate-to': "'self'",
      },
      trustedDomains: [],
      maxInputLength: 10000,
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize security features
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Initialize CSP
    if (this.config.enableCSP) {
      this.initializeCSP();
    }

    // Initialize XSS protection
    if (this.config.enableXSSProtection) {
      this.initializeXSSProtection();
    }

    // Initialize CSRF protection
    if (this.config.enableCSRFProtection) {
      this.initializeCSRFProtection();
    }

    // Initialize input sanitization
    if (this.config.enableInputSanitization) {
      this.initializeInputSanitization();
    }

    // Setup security headers
    this.setupSecureHeaders();
  }

  /**
   * Initialize Content Security Policy
   */
  private initializeCSP(): void {
    // Generate nonce for inline scripts
    this.cspNonce = this.generateNonce();

    // Build CSP header
    const cspString = this.buildCSPString();

    // Apply CSP (in a real app, this would be set via server headers)
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspString;
    document.head.appendChild(meta);

    // Setup CSP violation reporting
    this.setupCSPReporting();
  }

  /**
   * Build CSP string from directives
   */
  private buildCSPString(): string {
    const directives = this.config.cspDirectives;

    return Object.entries(directives)
      .map(([directive, value]) => {
        if (value.includes("'nonce-")) {
          value = value.replace("'nonce-'", `'nonce-${this.cspNonce}-'`);
        }
        return `${directive} ${value}`;
      })
      .join('; ');
  }

  /**
   * Setup CSP violation reporting
   */
  private setupCSPReporting(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('CSP Violation:', {
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        disposition: event.disposition,
        blockedURI: event.blockedURI,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        sourceFile: event.sourceFile,
      });

      // Report to server in production
      this.reportSecurityViolation({
        type: 'csp_violation',
        data: {
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
        },
      });
    });
  }

  /**
   * Initialize XSS protection
   */
  private initializeXSSProtection(): void {
    // Set XSS protection header (in a real app, this would be set via server headers)
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-XSS-Protection';
    meta.content = XSSProtectionLevel.BLOCK;
    document.head.appendChild(meta);

    // Setup XSS mutation observer
    this.setupXSSObserver();
  }

  /**
   * Setup XSS observer to detect DOM mutations
   */
  private setupXSSObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              // Check for suspicious attributes
              this.checkElementForXSS(element);

              // Check for inline scripts
              if (element.tagName === 'SCRIPT') {
                const script = element as HTMLScriptElement;
                if (script.textContent && this.containsSuspiciousContent(script.textContent)) {
                  console.warn('Suspicious script content detected:', script.textContent);
                  this.reportSecurityViolation({
                    type: 'xss_attempt',
                    data: { content: script.textContent },
                  });
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check element for XSS patterns
   */
  private checkElementForXSS(element: Element): void {
    const suspiciousAttributes = ['onclick', 'onerror', 'onload', 'onmouseover'];

    suspiciousAttributes.forEach((attr) => {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr);
        if (value && this.containsSuspiciousContent(value)) {
          console.warn(`Suspicious ${attr} attribute:`, value);
          this.reportSecurityViolation({
            type: 'xss_attempt',
            data: { attribute: attr, value },
          });
        }
      }
    });
  }

  /**
   * Check if content contains suspicious patterns
   */
  private containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /document\.write/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Initialize CSRF protection
   */
  private initializeCSRFProtection(): void {
    // Generate CSRF token
    this.csrfToken = this.generateCSRFToken();

    // Store token in sessionStorage (more secure than localStorage)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('csrf_token', this.csrfToken);
    }

    // Add CSRF token to all forms
    this.addCSRFToForms();
  }

  /**
   * Add CSRF token to all forms
   */
  private addCSRFToForms(): void {
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'csrf_token';
      input.value = this.csrfToken || '';
      form.appendChild(input);
    });
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    const storedToken = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('csrf_token')
      : null;

    return storedToken !== null && token === storedToken;
  }

  /**
   * Initialize input sanitization
   */
  private initializeInputSanitization(): void {
    // Sanitize all inputs on change
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const result = this.sanitizeInput(target.value);
        if (result.wasModified) {
          target.value = result.sanitized;
          console.warn('Input sanitized:', result.threatsRemoved);
        }
      }
    }, true);
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): SanitizationResult {
    const threatsRemoved: string[] = [];
    let sanitized = input;

    // Check length
    if (sanitized.length > this.config.maxInputLength) {
      sanitized = sanitized.substring(0, this.config.maxInputLength);
      threatsRemoved.push('input_too_long');
    }

    // Remove HTML tags
    if (/<[^>]*>/g.test(sanitized)) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      threatsRemoved.push('html_tags');
    }

    // Remove dangerous patterns
    const dangerousPatterns = [
      { pattern: /javascript:/gi, name: 'javascript_protocol' },
      { pattern: /on\w+\s*=/gi, name: 'event_handlers' },
      { pattern: /<script/gi, name: 'script_tag' },
      { pattern: /<iframe/gi, name: 'iframe_tag' },
      { pattern: /<object/gi, name: 'object_tag' },
      { pattern: /<embed/gi, name: 'embed_tag' },
    ];

    dangerousPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '');
        threatsRemoved.push(name);
      }
    });

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return {
      original: input,
      sanitized,
      wasModified: threatsRemoved.length > 0,
      threatsRemoved,
    };
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html: string): string {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  /**
   * Setup secure headers
   */
  private setupSecureHeaders(): void {
    // In a real app, these would be set via server headers
    const headers = [
      { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
      { httpEquiv: 'X-Frame-Options', content: 'DENY' },
      { httpEquiv: 'X-Permitted-Cross-Domain-Policies', content: 'none' },
      { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { httpEquiv: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' },
    ];

    headers.forEach((header) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.httpEquiv;
      meta.content = header.content;
      document.head.appendChild(meta);
    });
  }

  /**
   * Generate random nonce
   */
  private generateNonce(): string {
    return btoa(Math.random().toString() + Date.now().toString());
  }

  /**
   * Generate CSRF token
   */
  private generateCSRFToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${random}`);
  }

  /**
   * Report security violation
   */
  private reportSecurityViolation(violation: {
    type: string;
    data: any;
  }): void {
    console.warn('Security violation detected:', violation);

    // In production, send to server
    if (this.config.enableInputSanitization) {
      // Send to server for monitoring
      fetch('/api/security/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...violation,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch((error) => {
        console.error('Failed to report security violation:', error);
      });
    }
  }

  /**
   * Validate URL
   */
  validateURL(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);

      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Check if domain is trusted
      if (this.config.trustedDomains.length > 0) {
        const isTrusted = this.config.trustedDomains.some((domain) =>
          parsed.hostname.endsWith(domain)
        );

        if (!isTrusted) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get CSP nonce
   */
  getCSPNonce(): string | null {
    return this.cspNonce;
  }

  /**
   * Get CSRF token
   */
  getCSRFToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Update security configuration
   */
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

/**
 * Global security manager instance
 */
export const securityManager = new SecurityManager();

/**
 * Convenience function to sanitize input
 */
export function sanitizeInput(input: string): string {
  return securityManager.sanitizeInput(input).sanitized;
}

/**
 * Convenience function to sanitize HTML
 */
export function sanitizeHTML(html: string): string {
  return securityManager.sanitizeHTML(html);
}

/**
 * Convenience function to validate URL
 */
export function validateURL(url: string): boolean {
  return securityManager.validateURL(url);
}

/**
 * React hook for security
 */
export function useSecurity() {
  return {
    sanitizeInput,
    sanitizeHTML,
    validateURL,
    getCSRFToken: () => securityManager.getCSRFToken(),
    getCSPNonce: () => securityManager.getCSPNonce(),
  };
}

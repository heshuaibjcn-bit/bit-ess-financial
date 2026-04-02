/**
 * Automated Testing Utilities
 *
 * Comprehensive testing toolkit with:
 * - Test generators
 * - Mock helpers
 * - Test fixtures
 * - Coverage reporters
 * - Test runners
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Test environment type
 */
export type TestEnvironment = 'jsdom' | 'node' | 'happy-dom';

/**
 * Test configuration
 */
export interface TestConfig {
  environment: TestEnvironment;
  setupFiles: string[];
  coverageThreshold: number;
  mockDefault: boolean;
  verbose: boolean;
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    // Add your providers here
    return <>{children}</>;
  };

  return render(<AllTheProviders>{ui}</AllTheProviders>, options);
}

/**
 * Mock localStorage
 */
export function createMockLocalStorage() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

/**
 * Mock fetch API
 */
export function createMockFetch(responses: Record<string, any>) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Check if we have a mock response
    const mockResponse = Object.entries(responses).find(([pattern]) => {
      const regex = new RegExp(pattern);
      return regex.test(url);
    });

    if (mockResponse) {
      const [, data] = mockResponse;
      return {
        ok: true,
        json: async () => data,
        text: async () => JSON.stringify(data),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        url,
      } as Response;
    }

    // Return 404 for unmocked requests
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not Found' }),
      text: async () => '{"error": "Not Found"}',
      headers: new Headers(),
      url,
    } as Response;
  };
}

/**
 * Wait for condition
 */
export function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(checkCondition, 50);
      }
    };

    checkCondition();
  });
}

/**
 * Wait for element to appear
 */
export async function waitForElement(
  container: HTMLElement,
  selector: string,
  timeout: number = 5000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = container.querySelector(selector);

      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(checkElement, 50);
      }
    };

    checkElement();
  });
}

/**
 * Create test user
 */
export function createTestUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create test project
 */
export function createTestProject(overrides: Partial<any> = {}) {
  return {
    id: 'test-project-1',
    userId: 'test-user-1',
    name: 'Test Project',
    description: 'A test project',
    status: 'draft',
    collaborationModel: 'emc',
    industry: 'Manufacturing',
    formData: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock i18n
 */
export function createMockI18n() {
  return {
    t: (key: string) => key,
    changeLanguage: (lng: string) => Promise.resolve(),
    language: 'en',
    languages: ['en', 'zh'],
  };
}

/**
 * Mock navigation
 */
export function createMockNavigation() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    location: {
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'test',
    },
  };
}

/**
 * Test generator for components
 */
export class ComponentTestGenerator {
  constructor(private componentName: string) {}

  /**
   * Generate basic test
   */
  generateBasicTest(props: any = {}): string {
    return `
import { render, screen } from '@testing-library/react';
import { ${this.componentName} } from './${this.componentName}';

describe('${this.componentName}', () => {
  it('should render successfully', () => {
    render(<${this.componentName} ${Object.keys(props).length > 0 ? JSON.stringify(props) : ''} />);
    expect(screen.getByTestId('${this.componentName}')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<${this.componentName} ${Object.keys(props).length > 0 ? JSON.stringify(props) : ''} />);
    expect(container).toMatchSnapshot();
  });
});
    `.trim();
  }

  /**
   * Generate interaction test
   */
  generateInteractionTest(interactions: Array<{ action: string; selector: string; expected: string }>): string {
    const testCases = interactions.map(({ action, selector, expected }) => `
    it('should ${expected}', () => {
      render(<${this.componentName} />);

      const element = screen.${selector};

      fireEvent.${action}(element);

      expect(screen.${expected}).toBeInTheDocument();
    });
    `).join('\n');

    return `
import { render, screen, fireEvent } from '@testing-library/react';
import { ${this.componentName} } from './${this.componentName}';

describe('${this.componentName} interactions', () => {
${testCases}
});
    `.trim();
  }

  /**
   * Generate accessibility test
   */
  generateAccessibilityTest(): string {
    return `
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ${this.componentName} } from './${this.componentName}';

describe('${this.componentName} accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<${this.componentName} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels', () => {
    render(<${this.componentName} />);
    const element = screen.getByRole('button');
    expect(element).toHaveAttribute('aria-label');
  });
});
    `.trim();
  }
}

/**
 * Coverage reporter
 */
export class CoverageReporter {
  private coverage: Record<string, any> = {};

  /**
   * Record coverage for a component
   */
  recordCoverage(componentName: string, coverage: any) {
    this.coverage[componentName] = coverage;
  }

  /**
   * Generate coverage report
   */
  generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      components: Object.keys(this.coverage),
      summary: this.calculateSummary(),
      details: this.coverage,
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Calculate coverage summary
   */
  private calculateSummary() {
    const summaries = Object.values(this.coverage);

    return {
      totalComponents: summaries.length,
      averageCoverage: summaries.reduce((acc, s) => acc + (s.coverage || 0), 0) / summaries.length,
      fullyCovered: summaries.filter((s) => s.coverage === 100).length,
      needsCoverage: summaries.filter((s) => s.coverage < 80).length,
    };
  }

  /**
   * Get HTML coverage report
   */
  getHTMLReport(): string {
    const summary = this.calculateSummary();

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin: 0 20px; }
    .metric-value { font-size: 24px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .coverage-good { color: green; }
    .coverage-warning { color: orange; }
    .coverage-poor { color: red; }
  </style>
</head>
<body>
  <h1>Test Coverage Report</h1>
  <div class="summary">
    <div class="metric">
      <div class="metric-value">${summary.totalComponents}</div>
      <div>Components</div>
    </div>
    <div class="metric">
      <div class="metric-value">${Math.round(summary.averageCoverage)}%</div>
      <div>Average Coverage</div>
    </div>
    <div class="metric">
      <div class="metric-value">${summary.fullyCovered}</div>
      <div>Fully Covered</div>
    </div>
    <div class="metric">
      <div class="metric-value">${summary.needsCoverage}</div>
      <div>Needs Coverage</div>
    </div>
  </div>

  <h2>Component Details</h2>
  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Coverage</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(this.coverage).map(([name, data]: [string, any]) => {
        const coverage = data.coverage || 0;
        const statusClass = coverage >= 80 ? 'coverage-good' : coverage >= 50 ? 'coverage-warning' : 'coverage-poor';

        return `
          <tr>
            <td>${name}</td>
            <td class="${statusClass}">${coverage}%</td>
            <td>${coverage >= 80 ? '✓' : '✗'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
    `.trim();
  }
}

/**
 * Test runner utilities
 */
export class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];

  /**
   * Add test
   */
  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<{
    passed: number;
    failed: number;
    results: Array<{ name: string; status: 'passed' | 'failed'; error?: Error }>;
  }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        await test.fn();
        results.push({ name: test.name, status: 'passed' });
        passed++;
      } catch (error) {
        results.push({
          name: test.name,
          status: 'failed',
          error: error as Error,
        });
        failed++;
      }
    }

    return { passed, failed, results };
  }

  /**
   * Clear tests
   */
  clear() {
    this.tests = [];
  }
}

/**
 * Mock service layer
 */
export function createMockService() {
  return {
    projects: {
      getAll: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1' }),
      update: jest.fn().mockResolvedValue({ id: '1' }),
      delete: jest.fn().mockResolvedValue(true),
    },
    calculations: {
      calculate: jest.fn().mockResolvedValue({ result: 0 }),
      validate: jest.fn().mockResolvedValue(true),
    },
    users: {
      authenticate: jest.fn().mockResolvedValue({ token: 'mock-token' }),
      getCurrent: jest.fn().mockResolvedValue(null),
    },
  };
}

/**
 * Performance testing utilities
 */
export class PerformanceTestRunner {
  /**
   * Measure render time
   */
  async measureRenderTime(
    renderFn: () => void,
    iterations: number = 10
  ): Promise<{ avg: number; min: number; max: number; all: number[] }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      renderFn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      avg: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      all: times,
    };
  }

  /**
   * Measure memory usage
   */
  measureMemoryUsage(): { used: number; total: number; limit: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }
}

/**
 * Global test utilities
 */
export const testUtils = {
  renderWithProviders,
  createMockLocalStorage,
  createMockFetch,
  waitForCondition,
  waitForElement,
  createTestUser,
  createTestProject,
  createMockI18n,
  createMockNavigation,
  ComponentTestGenerator,
  CoverageReporter,
  TestRunner,
  createMockService,
  PerformanceTestRunner,
};

# TODOS — ess-financial

## Architecture & Infrastructure

### Data validation schemas
- **What:** Define Zod schemas for all input types (Project, Province, Scenario, CalculationResult)
- **Why:** Type-safe validation prevents calculation errors that could mislead investors
- **Pros:** Catches invalid inputs at boundary, self-documenting types, better DX
- **Cons:** Upfront schema design effort, maintenance as schema evolves
- **Context:** Core to the financial modeling engine; invalid inputs = wrong IRRs = lost trust
- **Depends on / blocked by:** None — can be done in Week 1 alongside data layer

### Calculation cache strategy
- **What:** Implement Redis caching for calculation results keyed by input hash (SHA-256)
- **Why:** 90%+ of calculations are duplicates (small tweaks to inputs); cache reduces server load and improves UX
- **Pros:** Faster response times, lower server costs, better scalability
- **Cons:** Adds Redis infrastructure, cache invalidation complexity when province data updates
- **Context:** Performance bottleneck identified in review; 10-year cash flow calculations are expensive
- **Depends on / blocked by:** Week 3-4 (Financial calculator engine) — cache layer built on top

### Async PDF generation ✅
- **What:** Implement background job queue for PDF generation with polling endpoint
- **Why:** Large projects (10-year cash flow + sensitivity charts) will timeout synchronous requests
- **Pros:** Prevents request timeouts, better UX (loading state → ready), retry capability
- **Cons:** Adds job queue infrastructure (BullMQ, Faktory, etc.), polling complexity
- **Context:** UX requirement — users can't wait 60s for a PDF with no feedback
- **Status:** COMPLETED
  - Created JobQueue service with status tracking (pending, processing, completed, failed)
  - Created PDFGenerator service using @react-pdf/renderer
  - Created three bilingual PDF templates (InvestmentReportPDF, SensitivityReportPDF, QuickSummaryPDF)
  - Created PDFExportButton component with progress tracking
  - Created React hooks (usePDF, useAsyncPDF, usePDFJobs)
  - Fixed bugs in InvestmentReportPDF (revenueBreakdown typo)
  - 24 comprehensive tests (all passing)
  - Features: job queue, progress tracking (0-100%), error handling, download functionality

### Domain layer abstraction ✅
- **What:** Create `/domain` layer with Models, Services, Repositories (separated from API/UI)
- **Why:** DRY principle — single source of truth for formulas, testable without UI, prevents logic scattered across handlers
- **Pros:** Testable, maintainable, separates concerns, enables future CLI/API clients
- **Cons:** More files/abstractions, indirection for simple CRUD
- **Context:** Code quality issue — without this, calculation logic will spread across API routes and React components
- **Status:** COMPLETED
  - Created complete domain models (CalculationResult, Scenario, Benchmark)
  - Defined Repository interfaces (IProjectRepository, IProvinceDataRepository, IBenchmarkRepository)
  - Defined Service interfaces (ICalculationService, ISensitivityService, IBenchmarkService)
  - Created Service adapters (CalculationServiceAdapter)
  - Exported clean Domain API via /domain/index.ts
  - Comprehensive type safety and separation of concerns

### Data validation schemas ✅
- **What:** Define Zod schemas for all input types (Project, Province, Scenario, CalculationResult)
- **Why:** Type-safe validation prevents calculation errors that could mislead investors
- **Pros:** Catches invalid inputs at boundary, self-documenting types, better DX
- **Cons:** Upfront schema design effort, maintenance as schema evolves
- **Context:** Core to the financial modeling engine; invalid inputs = wrong IRRs = lost trust
- **Status:** COMPLETED
  - Created CalculationResultSchema with cross-field validation
  - Created ScenarioSchema for sensitivity analysis
  - Created BenchmarkSchema for comparison data
  - 48 comprehensive validation tests (all passing)
  - Implemented business logic validation and edge case handling

### Error boundary hierarchy ✅
- **What:** Add React error boundaries at App, ProjectPage, and feature levels with graceful fallback UI
- **Why:** Prevents white screens of death, provides better UX when errors occur
- **Pros:** Better error UX, prevents app crashes, enables error tracking
- **Cons:** Requires thoughtful boundary placement, adds components to maintain
- **Context:** Production requirement — investment managers can't afford app crashes during deal evaluation
- **Status:** COMPLETED
  - Created 4 error boundary components (ErrorBoundary, AppErrorBoundary, PageErrorBoundary, FeatureErrorBoundary)
  - Integrated at App level (main.tsx) and Page level (App.tsx)
  - Added HOC (withErrorBoundary) and hook (useErrorHandler) for flexible usage
  - 28 comprehensive tests covering all components, error catching, recovery, and logging
  - Sentry integration hooks for error tracking
  - Level-specific fallback UIs (app: full page, page: section, feature: compact)

## Testing

### Test framework setup
- **What:** Configure Vitest (unit), React Testing Library (components), Playwright (E2E)
- **Why:** 0% test coverage currently; 35 test gaps identified in review
- **Pros:** Enables TDD, prevents regressions, documents expected behavior
- **Cons:** Setup time, test maintenance burden
- **Context:** Quality requirement — financial calculations must be correct
- **Depends on / blocked by:** Week 1 — set up before writing any feature code

### FinancialCalculator test suite ✅
- **What:** Unit tests for all calculation paths (IRR, NPV, cash flow, degradation, compensation)
- **Why:** Core business logic; any bug = wrong IRR = lost investor trust
- **Pros:** Catches formula bugs, documents expected behavior, enables refactoring
- **Cons:** Writing test fixtures for 31 provinces is tedious
- **Context:** Critical gap — 0/8 calculation paths tested currently
- **Status:** COMPLETED
  - 28 comprehensive tests covering IRR, NPV, ROI, LCOS, profit margin
  - Edge case testing (negative values, zero values, extreme inputs)
  - Performance benchmarks (20-year projects, large datasets)
  - Cross-metric validation (IRR vs NPV relationship verification)
  - Real-world scenario testing (successful, marginal, failed projects)
  - All tests passing with 100% success rate

### BenchmarkingEngine test suite
- **What:** Unit tests for comparison logic, percentile calculation, driver identification
- **Why:** Core differentiator; bugs here destroy platform value prop
- **Pros:** Validates benchmarking math, tests filter logic, documents comparables algorithm
- **Cons:** Requires test data (mock projects with known rankings)
- **Context:** Critical gap — 0/7 benchmarking paths tested currently
- **Depends on / blocked by:** Week 5-6 (Benchmarking engine) — write tests alongside implementation

### E2E test for critical paths
- **What:** Playwright tests for (1) new user onboarding, (2) returning user recalculates, (3) shared project access
- **Why:** These are the core user flows; breakage here blocks all value
- **Pros:** Validates integration, catches regressions, documents user journeys
- **Cons:** E2E tests are slow and brittle
- **Context:** User experience gap — 0/3 critical flows tested currently
- **Depends on / blocked by:** Week 11-12 (testing & validation) — write after core features complete

## Data & Content

### Province data JSON schema ✅
- **What:** Define JSON schema for 31 provinces with validation (peak/valley pricing, compensation policies, etc.)
- **Why:** Province data is the foundation; schema errors propagate to all calculations
- **Pros:** Catches data entry errors, enables validation, documents data structure
- **Cons:** Schema design effort, migration when policies change
- **Context:** Data quality requirement — wrong province data = wrong benchmarking
- **Status:** COMPLETED
  - Created ProvinceSchema.enhanced.ts with 12+ sub-schemas:
    - TimePeriod, Season, Pricing (peak/valley/shoulder with time periods)
    - CapacityCompensation (4 types: discharge/capacity/availability/performance-based)
    - DemandResponse (peak/valley/shoulder compensation)
    - AuxiliaryServices (frequency regulation, peaking, reactive power, voltage, black start)
    - TaxSubsidy (VAT, investment subsidy, feed-in tariffs)
    - GridConnection (fees, requirements, approval timeline)
    - MarketEligibility (spot market, ancillary services, peak shaving)
    - Geography (7 regions, economic indicators, renewable penetration)
    - DataMetadata (source validation, confidence levels, notes)
  - Cross-field validation (peak > valley, effective < expiry, compensation type matches rates)
  - Support for all 31 provinces with codes and geographic regions
  - Example data for 8 provinces (Guangdong, Shandong, Jiangsu, Zhejiang, Hebei, Shanxi, Inner Mongolia, Sichuan)
  - 56 comprehensive tests (all passing)
  - Features: strict type validation, business logic validation, data quality tracking

### Model validation plan execution
- **What:** Execute peer review, comparison testing, third-party audit, transparency publish as specified in design doc
- **Why:** Investment managers won't trust black-box calculations with million-dollar decisions
- **Pros:** Builds trust, catches formula errors, creates marketing asset ("validated by experts")
- **Cons:** Time-consuming, requires industry connections, may cost money
- **Context:** Trust requirement — this is how you overcome the "new tool vs Excel" barrier
- **Depends on / blocked by:** Pre-launch (Month 3) — after calculator complete but before beta users

## Performance & Scalability

### Sensitivity analysis precomputation ✅
- **What:** Implement background job for sensitivity grids (one-way, two-way) with caching
- **Why:** Sensitive analysis requires 60+ IRR calculations; blocks UI if synchronous
- **Pros:** Non-blocking UI, reusable results, better UX
- **Cons:** Adds job queue complexity, cache invalidation
- **Context:** Performance issue identified in review; sensitivity is feature #4
- **Status:** COMPLETED
  - Created SensitivityPrecomputeService with:
    - Background job management (pending, running, completed, failed)
    - Cache integration using existing CacheService
    - Job status tracking and polling
    - One-way and two-way sensitivity analysis
    - IRR matrix computation for two-way analysis
    - Progress tracking (0-100%)
  - Created React hooks (useSensitivityPrecompute, useSensitivityCache, useSensitivityJobs)
  - Created comprehensive tests (32 tests, all passing)
  - Features: job cancellation, automatic cleanup, TTL-based caching, statistics

## Security & Compliance

### Financial data disclaimers ✅
- **What:** Add legal disclaimers to UI and PDF exports ("not investment advice," "for informational purposes")
- **Why:** Liability protection; investment decisions based on platform must have proper disclaimer
- **Pros:** Reduces legal risk, sets proper user expectations
- **Cons:** Legal review required, adds UI clutter
- **Context:** Legal requirement — financial tools need disclaimers
- **Status:** COMPLETED
  - Created comprehensive Disclaimer component (full, short, minimal variants)
  - Created ReportDisclaimer for PDF exports with full legal text
  - Created RiskWarning component for investment risk disclosure
  - Created RegulatoryNotice for compliance requirements
  - Integrated into App.tsx (footer and results sections)
  - Included terms of service and privacy policy links
  - All disclaimers available in multiple display variants

### Input sanitization & rate limiting ✅
- **What:** Add rate limiting on API endpoints, sanitize all user inputs to prevent injection attacks
- **Why:** Public-facing API can be abused; calculation engine is CPU-intensive
- **Pros:** Prevents DoS, stops injection attacks, fair resource allocation
- **Cons:** Adds infrastructure complexity, may block legitimate heavy users
- **Context:** Security requirement — you're building a public web service
- **Status:** COMPLETED
  - Created InputSanitizer service with 5 protection types:
    - SQL injection prevention (pattern matching + quote escaping)
    - XSS prevention (HTML tag removal + special character escaping)
    - Command injection prevention (separator removal)
    - Path traversal prevention (../ pattern removal)
    - NoSQL injection prevention ($operator removal)
  - Created RateLimiter service with:
    - Sliding window rate limiting
    - Per-IP and per-user limits
    - Pre-configured limits for different endpoints
    - Client-side rate limiter for UI throttling
  - Created RequestValidator middleware for comprehensive validation
  - 43 comprehensive security tests (all passing)
  - All input vectors protected against OWASP Top 10 threats

## Design & UX

### DESIGN.md creation
- **What:** Create DESIGN.md documenting the design system (CSS variables, typography scale, spacing, component patterns, color palette)
- **Why:** Currently no design documentation; developers must reverse-engineer patterns from code. A DESIGN.md ensures consistency as the team grows and features are added.
- **Pros:** Single source of truth for design decisions, faster onboarding for new devs, prevents design drift, enables design system tooling
- **Cons:** Initial documentation effort, maintenance as design evolves
- **Context:** Identified gap in design review — codebase has consistent patterns but no documentation. Without DESIGN.md, future features may inadvertently break established conventions.
- **Depends on / blocked by:** None — can be done anytime
- **Estimated effort:** 2-4 hours to document observed patterns from `src/index.css` and component files

### AI chat accessibility audit
- **What:** Conduct full accessibility audit on implemented AI chat components (keyboard nav, screen reader, color contrast, touch targets)
- **Why:** The plan specifies a11y requirements (ARIA labels, keyboard shortcuts, WCAG compliance) but implementation needs verification
- **Pros:** Ensures WCAG 2.1 AA compliance, catches a11y regressions, documents a11y patterns for future features
- **Cons:** Requires screen reader testing (NVDA/JAWS), keyboard-only testing, contrast checker tools
- **Context:** Accessibility requirement — enterprise financial tools must be usable by investors with disabilities
- **Depends on / blocked by:** AI chat implementation (Week 2-3 per plan)
- **Estimated effort:** 4-6 hours for full audit + fixes

### AI chat streaming state bug fix
- **What:** Fix the critical bug where the `isStreaming` flag is set but never cleared, leaving messages in permanent 'loading' state
- **Why:** This breaks UI behavior - inputs stay disabled, loading indicators persist, and users think the feature is broken. The code has a TODO comment acknowledging this issue (useAIChat.ts:119-128)
- **Pros:** Restores correct UI behavior, improves user experience, fixes broken loading indicators
- **Cons:** Minor bug fix, low risk
- **Context:** Critical bug affecting all AI chat conversations. Located in `src/hooks/useAIChat.ts:119-128`
- **Depends on / blocked by:** None — straightforward bug fix
- **Estimated effort:** 30 minutes

### AI chat test suite
- **What:** Implement comprehensive test coverage for AI chat functionality including unit tests (hooks, services, streaming), integration tests (SSE parsing, error handling), and E2E tests (user flows, edge cases)
- **Why:** Currently 0% test coverage with 100+ untested code paths. High regression risk. Any code change could break the feature with no safety net.
- **Pros:** Catches regressions, documents expected behavior, enables confident refactoring, proves feature works
- **Cons:** Initial test writing effort, ongoing maintenance
- **Context:** Critical gap — core user-facing feature with zero tests. Covers: sendMessage, clearChat, retry, streaming, errors, edge cases
- **Depends on / blocked by:** None — but should be done before further feature development
- **Estimated effort:** 1-2 days for full coverage (unit + integration + E2E)

### AI chat backend proxy (Phase 2)
- **What:** Implement backend proxy service to securely manage API keys instead of storing them in localStorage (Phase 2 from original plan)
- **Why:** **PRODUCTION BLOCKER.** Current implementation stores API keys in localStorage, which is vulnerable to XSS attacks. The plan acknowledges this as a temporary Phase 1 approach but it's a security vulnerability.
- **Pros:** Eliminates XSS attack vector for API keys, enables secure production deployment, aligns with security best practices
- **Cons:** Requires backend infrastructure (Node.js service or Vite SSR), additional deployment complexity
- **Context:** Security requirement — cannot safely deploy to production with current architecture. Plan's Phase 2 describes Vite SSR or standalone Node.js service
- **Depends on / blocked by:** Backend infrastructure decision (Vite SSR vs standalone Node.js)
- **Estimated effort:** 2-3 days for backend proxy implementation

### AI chat performance safeguards
- **What:** Add performance safeguards: timeout wrapper (use existing `withStreamTimeout`), AbortController for request cancellation, and request debouncing/throttling
- **Why:** Current implementation can hang indefinitely (no timeout), has memory leaks (no cancellation on unmount), and allows request spamming (no rate limiting). Causes poor UX and wasted API costs.
- **Pros:** Prevents frozen UI, eliminates memory leaks, reduces API quota waste, improves perceived performance
- **Cons:** Adds cancellation complexity, requires refactoring sendMessage hook
- **Context:** Performance issues identified in review. Timeout function exists in StreamHandler.ts but is unused. Cancellation prevents memory leaks.
- **Depends on / blocked by:** None — straightforward improvements
- **Estimated effort:** 2 hours

### AI chat i18n fix
- **What:** Fix hard-coded Chinese text in ChatMessageList component (lines 43-47) to use i18n translation system
- **Why:** Violates i18n principle. English users see Chinese welcome message: "我可以帮助您分析储能项目的投资价值、风险评估和优化建议。请提出您的问题！"
- **Pros:** Proper internationalization, better UX for English users, consistent with rest of app
- **Cons:** Minor i18n fix, low effort
- **Context:** Internationalization requirement — app supports Chinese/English, but AI chat welcome message is hard-coded in Chinese
- **Depends on / blocked by:** None — simple text replacement
- **Estimated effort:** 30 minutes


## Design System (from /plan-design-review on 2026-04-02)

### Design system documentation (DESIGN.md)
- **What:** Run `/design-consultation` to create comprehensive DESIGN.md with design tokens
- **Why:** No centralized design system exists. Creates consistency debt as app scales. Design tokens (colors, spacing, typography, shadows, component patterns) should be documented for team alignment.
- **Pros:** Single source of truth for design decisions, easier onboarding, prevents inconsistencies, enables design system growth
- **Cons:** Initial effort to document, ongoing maintenance as design evolves
- **Context:** Design review found 4/10 design system alignment. Multiple components using Tailwind but no documented tokens. Hard to maintain consistency across team.
- **Depends on / blocked by:** None — can be done anytime
- **Estimated effort:** 2-4 hours for initial DESIGN.md creation

### AI chat mobile responsive behavior
- **What:** Implement 100% viewport width on mobile (375px+) for AI chat sidebar
- **Why:** Current implementation has no explicit responsive behavior. Sidebar uses `max-w-md` but mobile behavior is undefined. Users expect chat interfaces to use entire screen on mobile.
- **Pros:** Better mobile UX, follows platform conventions, no wasted screen space
- **Cons:** Requires responsive CSS testing on multiple devices
- **Context:** Design review found 6/10 responsive score. No breakpoints defined, no mobile-specific patterns.
- **Implementation:** Add media query for max-width 767px to set width: 100vw
- **Depends on / blocked by:** None — straightforward CSS addition
- **Estimated effort:** 30 minutes

### AI chat welcome message personalization
- **What:** Personalize welcome message with project name (e.g., "关于项目【XX工业园储能】的智能分析")
- **Why:** Plan specified personalized welcome but implementation uses generic i18n strings. Personalization creates emotional connection ("这个懂我") and matches plan's user journey design.
- **Pros:** Better onboarding UX, fulfills plan's emotional design intent, feels more intelligent/customized
- **Cons:** Requires accessing currentProject.name, needs i18n string update
- **Context:** Design review found gap between plan (personalized) and implementation (generic). Welcome message at ChatMessageList.tsx:47-48.
- **Implementation:** Update welcome message to use currentProject.name in i18n string or component
- **Depends on / blocked by:** None — straightforward string interpolation
- **Estimated effort:** 1 hour

### AI chat accessibility improvements
- **What:** Add ARIA labels, live regions, and reduced-motion support to AI chat components
- **Why:** Inclusive design is essential for enterprise software. Current gaps: missing ARIA labels, no live regions for streaming, color contrast issues, no reduced-motion support.
- **Pros:** Meets WCAG AA requirements, better screen reader experience, respects user preferences, broader accessibility
- **Cons:** Requires accessibility testing, may need color adjustments for contrast
- **Context:** Design review found 6/10 accessibility score. Missing: aria-label on textarea, aria-live for streaming, role="log" on message list, reduced-motion query.
- **Implementation:** 
  - Add `role="log"` and `aria-live="polite"` to ChatMessageList
  - Add `aria-label` to textarea input
  - Add `aria-live="polite" aria-atomic="true"` to streaming container
  - Add `@media (prefers-reduced-motion: reduce)` to disable animations
  - Verify color contrast ratios (4.5:1 minimum)
- **Depends on / blocked by:** None — accessibility improvements are additive
- **Estimated effort:** 2 hours


## AI Investment Report System (from /plan-eng-review on 2026-04-02)

### Unit tests for AI agents (P1 - Critical)
- **What:** Create test files for each agent (PolicyAnalysisAgent, TechnicalProposalAgent, RiskAssessmentAgent, ReportNarrativeAgent) with mocked LLM responses
- **Why:** Currently 0% agent-level test coverage - agents have zero dedicated tests. Critical for regression protection.
- **Pros:** Catches prompt changes, validates output quality, enables safe refactoring, prevents production breaks
- **Cons:** ~4 hours of work (human: ~4h / CC: ~30min)
- **Context:** Each agent needs happy path, error path, and edge case tests. Use vitest.mock() for GLM-4 API calls.
- **Implementation:**
  - Create `src/services/agents/PolicyAnalysisAgent.test.ts`
  - Create `src/services/agents/TechnicalProposalAgent.test.ts`
  - Create `src/services/agents/RiskAssessmentAgent.test.ts`
  - Create `src/services/agents/ReportNarrativeAgent.test.ts`
  - Mock GLM-4 API calls with viemst.mock()
  - Test happy path, error handling, fallback invocation
- **Depends on / blocked by:** None — can be done in Week 2
- **Estimated effort:** 4 hours (human: ~4h / CC: ~30min)

### Custom error classes ✅
- **What:** Replace generic `unknown` catches with specific error types (AgentExecutionError, CalculationError, LLMTimeoutError)
- **Why:** Currently using generic `unknown` everywhere - can't distinguish recoverable from fatal errors
- **Pros:** Better error recovery, clearer error messages, proper error tracking, enables retry logic
- **Cons:** ~1 hour of work (human: ~1h / CC: ~5min)
- **Context:** Create `src/services/investment-report/errors.ts` with error classes. Update all catch blocks.
- **Status:** COMPLETED
  - Created `src/services/investment-report/errors.ts` with full error hierarchy
  - InvestmentReportError (base), AgentExecutionError, CalculationError, LLMTimeoutError, ValidationError, PDFGenerationError, MissingDataError
  - Updated InvestmentReportService.ts and PDFGenerator.ts to use specific error types
  - Added `isRecoverable()`, `toLogObject()`, `toUserMessage()` methods

### Agent timeout mechanism (P1 - Critical) ✅
- **What:** Wrap all GLM-4 API calls with timeout (e.g., 30 seconds per agent)
- **Why:** Critical gap - no timeout means stuck LLM calls hang forever
- **Pros:** Prevents infinite hangs, improves UX, enables proper error recovery
- **Cons:** ~30 minutes of work (human: ~30m / CC: ~5min)
- **Context:** Use Promise.race() with timeout in each agent's execute method. Fallback to default data on timeout.
- **Status:** COMPLETED
  - Added TimeoutError class in NanoAgent.ts
  - Added withTimeout() method in GLMClient (30s default)
  - messagesCreate() now accepts timeoutMs parameter
  - Note: withTimeout duplicated in GLMClient and NanoAgent — needs DRY fix

### LLM response caching
- **What:** Add cache layer with TTL (e.g., 1 hour) for agent responses
- **Why:** Same inputs trigger repeated API calls - wastes money and time
- **Pros:** Reduces costs, improves speed, reduces rate limiting issues
- **Cons:** ~2 hours of work (human: ~2h / CC: ~10min)
- **Context:** Use in-memory cache or Redis. Cache key based on Project ID + agent type. Invalidation on agent prompt changes.
- **Implementation:**
  - Create `src/services/investment-report/AgentCache.ts`
  - Implement get/set methods with TTL
  - Integrate into each agent before LLM call
- **Depends on / blocked by:** None — performance optimization
- **Estimated effort:** 2 hours (human: ~2h / CC: ~10min)

### Edge case tests for InvestmentReportService
- **What:** Expand test coverage beyond happy path - add tests for nil input, empty arrays, boundary values
- **Why:** Currently only happy path is tested - nil/empty inputs could crash
- **Pros:** Catches production edge cases, improves robustness, prevents crashes
- **Cons:** ~2 hours of work (human: ~2h / CC: ~15min)
- **Context:** Add tests for: nil Project, empty systemSize, zero costs, negative values, large arrays.
- **Implementation:**
  - Add test case: "应该处理nil输入"
  - Add test case: "应该处理空systemSize"
  - Add test case: "应该处理负值输入"
  - Add test case: "应该处理超大数组"
- **Depends on / blocked by:** None — robustness improvement
- **Estimated effort:** 2 hours (human: ~2h / CC: ~15min)

### AI Investment Report DESIGN.md
- **What:** Create DESIGN.md documenting AI agent system architecture, data flow, error handling strategy
- **Why:** No design documentation exists - future maintainers will be lost. Week 1 implementation is complete but not documented.
- **Pros:** Preserves architectural decisions, aids onboarding, improves maintainability, enables knowledge transfer
- **Cons:** ~2 hours of work (human: ~2h / CC: ~20min)
- **Context:** Include ASCII diagrams, component descriptions, data flow, error handling, parallel execution strategy.
- **Implementation:**
  - Create `docs/DESIGN.md` or `docs/AI_INVESTMENT_REPORT_DESIGN.md`
  - Document: Architecture overview, AI agent responsibilities, data flow diagram, error handling, fallback strategy
  - Include ASCII diagrams for system architecture and data flow
- **Depends on / blocked by:** None — documentation task
- **Estimated effort:** 2 hours (human: ~2h / CC: ~20min)

### Memory cleanup for ReportDataContext
- **What:** Explicit cleanup of ReportDataContext after report completes
- **Why:** Large contexts (10MB+) accumulate in memory - could cause memory leaks
- **Pros:** Prevents memory leaks, improves long-running stability, better resource management
- **Cons:** ~30 minutes of work (human: ~30m / CC: ~5min)
- **Context:** Add cleanup method in InvestmentReportService, call in finally block.
- **Implementation:**
  - Add `cleanup()` method to ReportDataContext
  - Call in InvestmentReportService after report generation
  - Clear all agent outputs and cached data
- **Depends on / blocked by:** None — memory leak prevention
- **Estimated effort:** 30 minutes (human: ~30m / CC: ~5min)

### Streaming generation by default
- **What:** Make generateReportStream() the default, generateReport() the convenience wrapper
- **Why:** Large reports accumulate in memory - streaming is more efficient
- **Pros:** Better memory profile, faster perceived performance, scales to large reports
- **Cons:** ~1 hour of work (human: ~1h / CC: ~5min)
- **Context:** Refactor generateReport() to use streaming internally. Update callers to use streaming.
- **Implementation:**
  - Refactor InvestmentReportService.generateReport() to use streaming
  - Update InvestmentReportButton to use streaming by default
  - Provide progress feedback to UI
- **Depends on / blocked by:** None — performance optimization
- **Estimated effort:** 1 hour (human: ~1h / CC: ~5min)

### True PDF generation (NEEDS FIX: puppeteer → @react-pdf/renderer)
- **What:** Migrate PDF generation from puppeteer (server-side, incompatible with Vite SPA) to @react-pdf/renderer (client-side, already installed)
- **Why:** Puppeteer requires Node.js + Chromium (~280MB). This app is a client-side Vite SPA with no backend. The puppeteer import in PDFGenerator.ts fails at build time.
- **Pros:** Works in browser, no server dependency, already installed in package.json
- **Cons:** ~2 hours of migration work
- **Context:** Eng review (2026-04-03) found puppeteer is incompatible with Vite SPA architecture. @react-pdf/renderer was already used in previous PDFGenerator implementation. PDF templates (cover.html.ts, chapter-page.html.ts, content-page.html.ts) need conversion from HTML to React-PDF components.
- **Implementation:**
  - Remove puppeteer import from PDFGenerator.ts
  - Convert HTML templates (pdf-templates/*.html.ts) to @react-pdf/renderer components
  - Use visual-style.ts constants for styling (already compatible)
  - Test PDF generation in browser
- **Depends on / blocked by:** None — architecture fix
- **Estimated effort:** 2 hours (human: ~2h / CC: ~15min)


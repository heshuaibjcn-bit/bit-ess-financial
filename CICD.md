# CI/CD Pipeline Guide

## Overview

The ESS Financial platform features enterprise-grade CI/CD pipelines:

- **Automated Testing** - Unit, integration, and E2E tests
- **Code Quality** - ESLint, Prettier, TypeScript checks
- **Security Scanning** - Dependency audits, Snyk, TruffleHog
- **Performance Monitoring** - Lighthouse CI, performance budgets
- **Automated Deployment** - Staging and production deployments
- **Monitoring** - Prometheus metrics and Grafana dashboards

## Pipeline Architecture

### Workflow Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch: # Manual trigger
```

### Jobs Overview

1. **code-quality** - ESLint, Prettier, type checking
2. **security** - Dependency audit, Snyk scan, secret detection
3. **test** - Unit tests with coverage
4. **e2e** - End-to-end tests with Playwright
5. **build** - Production build verification
6. **benchmark** - Lighthouse CI performance tests
7. **deploy-staging** - Deploy to staging environment
8. **deploy-production** - Deploy to production
9. **post-deploy** - Health checks and smoke tests
10. **notify** - Slack notifications

## Local Development

### Run Tests Locally

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Code quality checks
pnpm lint
pnpm format:check
pnpm type-check

# All checks
pnpm ci
```

### Build Locally

```bash
# Development build
pnpm build

# Production build
NODE_ENV=production pnpm build
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Pipeline Stages

### 1. Code Quality

Automated code quality checks:

- **ESLint** - Code linting and best practices
- **Prettier** - Code formatting verification
- **TypeScript** - Type checking with tsc

**Exit Conditions:**
- Fails if any linting errors
- Fails if formatting doesn't match
- Fails if type errors exist

### 2. Security Scanning

Multi-layer security checks:

- **npm audit** - Vulnerability scanning
- **Snyk** - Dependency vulnerability analysis
- **TruffleHog** - Secret detection in code

**Thresholds:**
- Blocks on high/critical vulnerabilities
- Warns on moderate vulnerabilities
- Fails if secrets detected

### 3. Testing

#### Unit Tests

```bash
pnpm test --ci --coverage --maxWorkers=2
```

**Requirements:**
- 80% minimum coverage
- All tests must pass
- No console errors

#### E2E Tests

```bash
pnpm test:e2e
```

**Coverage:**
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Pixel 5 (Mobile)
- iPhone 12 (Mobile)

### 4. Build Verification

```bash
pnpm build
```

**Checks:**
- Build completes successfully
- Build size < 10MB
- No build warnings
- All assets optimized

### 5. Performance Benchmarking

Lighthouse CI checks:

```json
{
  "categories:performance": ["error", { "minScore": 0.9 }],
  "categories:accessibility": ["error", { "minScore": 0.9 }],
  "categories:best-practices": ["error", { "minScore": 0.9 }],
  "categories:seo": ["error", { "minScore": 0.8 }],
  "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
  "interactive": ["error", { "maxNumericValue": 5000 }]
}
```

### 6. Deployment

#### Staging Deployment

- Triggers on `develop` branch
- Deploys to Vercel staging
- Runs smoke tests
- URL: https://staging.ess-financial.com

#### Production Deployment

- Triggers on `main` branch
- Deploys to Vercel production
- Creates GitHub release
- Sends notifications
- URL: https://app.ess-financial.com

### 7. Post-Deployment

Automated health checks:

- **Health Check** - `/health` endpoint
- **Smoke Tests** - Critical user flows
- **Canary Tests** - API functionality
- **Error Monitoring** - Check for errors

## Configuration Files

### GitHub Actions

`.github/workflows/ci-cd.yml` - Main CI/CD pipeline

### Docker

- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Local development stack

### Monitoring

- `prometheus.yml` - Metrics collection
- `alerts.yml` - Alert rules
- `nginx.conf` - Reverse proxy configuration

### Performance

- `budget.json` - Lighthouse budget
- `playwright.config.ts` - E2E test config
- `vitest.config.ts` - Unit test config

## Environment Variables

### Required Secrets

```bash
# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VERCEL_PROJECT_ID_STAGING

# Security
SNYK_TOKEN

# Monitoring
LHCI_GITHUB_APP_TOKEN

# Notifications
SLACK_WEBHOOK

# GitHub
GITHUB_TOKEN
```

### Application Variables

```bash
# Database
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY

# API
VITE_API_URL

# Analytics
VITE_GA_TRACKING_ID

# Features
VITE_ENABLE_ANALYTICS
VITE_ENABLE_DATABASE
```

## Deployment Strategies

### Blue-Green Deployment

```yaml
# Maintain two production environments
- app-green (current)
- app-blue (new)

# Switch traffic instantly
- Deploy to blue
- Test thoroughly
- Switch traffic
- Keep green as rollback
```

### Canary Deployment

```yaml
# Gradual rollout
1. Deploy to 10% of servers
2. Monitor metrics for 15 minutes
3. Increase to 50% if stable
4. Full rollout if all good
5. Rollback if issues detected
```

### Feature Flags

```typescript
// Enable features without deployment
const features = {
  newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
  advancedCharts: process.env.FEATURE_ADVANCED_CHARTS === 'true',
};

// Toggle in production without deployment
if (features.newDashboard) {
  return <NewDashboard />;
}
```

## Monitoring

### Prometheus Metrics

Key metrics to monitor:

```yaml
# Application
- http_requests_total (counter)
- http_request_duration_seconds (histogram)
- active_users_total (gauge)

# Database
- pg_stat_activity_count (gauge)
- pg_replication_lag_seconds (gauge)

# Cache
- redis_memory_used_bytes (gauge)
- redis_connected_clients (gauge)

# Infrastructure
- node_cpu_usage (gauge)
- node_memory_usage (gauge)
```

### Grafana Dashboards

Pre-configured dashboards:

- **Application Overview** - Request rate, latency, errors
- **Database Performance** - Query time, connections, locks
- **Cache Performance** - Hit rate, memory, connections
- **Infrastructure** - CPU, memory, disk, network

### Alerting

Alert severity levels:

- **Critical** - Application down, data loss
- **Warning** - High latency, elevated error rate
- **Info** - Deployment completed, metrics updated

## Rollback Procedures

### Automatic Rollback

Triggers automatic rollback if:

- Health checks fail
- Error rate > 5%
- P95 latency > 5s
- Canary tests fail

### Manual Rollback

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or deploy specific commit
git checkout <commit-hash>
git push origin main --force

# Via Vercel CLI
vercel rollback <deployment-url>
```

## Troubleshooting

### Pipeline Failures

#### Build Fails

**Problem**: Build stage fails
**Solution**:
1. Check build logs for errors
2. Verify all dependencies install
3. Check for memory issues
4. Try building locally

#### Tests Fail

**Problem**: Tests pass locally but fail in CI
**Solution**:
1. Check Node.js version mismatch
2. Verify environment variables
3. Check for timezone issues
4. Review test logs for specifics

#### Deployment Fails

**Problem**: Deployment to Vercel fails
**Solution**:
1. Check Vercel deployment logs
2. Verify build artifacts
3. Check environment variables
4. Review Vercel limits

### Performance Issues

#### Build Size Too Large

**Problem**: Build exceeds 10MB limit
**Solution**:
```bash
# Analyze bundle size
pnpm build --analyze

# Optimize imports
# Code splitting
# Tree shaking
# Remove unused dependencies
```

#### Slow Build Time

**Problem**: Build takes too long
**Solution**:
1. Enable caching
2. Parallelize tasks
3. Optimize Docker layers
4. Use build acceleration

## Best Practices

### 1. Keep Pipelines Fast

```yaml
# Use caching
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 2. Fail Fast

```yaml
# Run quick checks first
jobs:
  quick-checks:
    # Lint, format, type-check
  slow-checks:
    needs: quick-checks
    # Tests, build
```

### 3. Use Matrix Strategy

```yaml
strategy:
  matrix:
    node: [16.x, 18.x]
    os: [ubuntu-latest, windows-latest]
```

### 4. Parallelize Jobs

```yaml
# Run independent jobs in parallel
jobs:
  test:
    # ...
  lint:
    # ...
  security:
    # ...
```

## Maintenance

### Regular Updates

Monthly tasks:

- Update dependencies
- Review and update alerts
- Check performance budgets
- Update documentation
- Review security reports

### Monitoring

Daily tasks:

- Check pipeline success rate
- Review build duration trends
- Monitor error rates
- Check deployment frequency

## Support

For CI/CD issues:
1. Check GitHub Actions logs
2. Review build logs
3. Check deployment status
4. Review monitoring dashboards

## License

Proprietary - All rights reserved

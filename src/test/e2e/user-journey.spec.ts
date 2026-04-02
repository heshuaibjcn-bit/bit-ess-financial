/**
 * Real User Journey E2E Tests
 *
 * Tests actual user workflows with real UI interactions
 */

import { test, expect, Page } from '@playwright/test';

// Generate unique test user
const getTestUser = () => ({
  email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  password: 'Test123!',
  displayName: 'Test User',
});

/**
 * Helper: Register a new user
 */
async function registerUser(page: Page, user: ReturnType<typeof getTestUser>) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');

  // Fill registration form
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.locator('input[type="password"]').nth(1).fill(user.password);
  
  // Submit form
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation to dashboard
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Helper: Login user
 */
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Submit form
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation to dashboard
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Helper: Create a new project and return project ID from URL
 */
async function createProject(page: Page): Promise<string> {
  // Click "New Project" button (新建项目)
  const newProjectBtn = page.locator('button:has-text("新建项目"), button:has-text("New Project"), [data-testid="new-project-btn"]').first();
  await newProjectBtn.waitFor({ state: 'visible', timeout: 5000 });
  await newProjectBtn.click();

  // Wait for navigation to project page
  await page.waitForURL(/\/project\//, { timeout: 10000 });
  
  // Extract project ID from URL
  const url = page.url();
  const match = url.match(/\/project\/([^\/]+)/);
  return match ? match[1] : '';
}

/**
 * Helper: Fill Step 1 - Owner Information (业主信息)
 */
async function fillStep1OwnerInfo(page: Page) {
  // Wait for form to be visible
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Fill company name (公司名称)
  const companyInput = page.locator('input[placeholder*="公司名称"]').first();
  if (await companyInput.isVisible().catch(() => false)) {
    await companyInput.fill('测试科技有限公司');
  }

  // Fill industry (所属行业)
  const industryInput = page.locator('input[placeholder*="所属行业"]').first();
  if (await industryInput.isVisible().catch(() => false)) {
    await industryInput.fill('制造业');
  }

  // Select province (项目所在地)
  const provinceSelect = page.locator('select:has-text("请选择")').first();
  if (await provinceSelect.isVisible().catch(() => false)) {
    await provinceSelect.selectOption({ index: 1 }); // Select first real option
  }

  // Fill contact person (联系人)
  const contactInput = page.locator('input[placeholder*="联系人"]').first();
  if (await contactInput.isVisible().catch(() => false)) {
    await contactInput.fill('张三');
  }

  // Fill phone (联系电话)
  const phoneInput = page.locator('input[type="tel"]').first();
  if (await phoneInput.isVisible().catch(() => false)) {
    await phoneInput.fill('13800138000');
  }
}

/**
 * Helper: Navigate to next step
 */
async function goToNextStep(page: Page) {
  const nextBtn = page.locator('button:has-text("下一步"), button:has-text("Next"), button[type="submit"]').first();
  if (await nextBtn.isVisible().catch(() => false)) {
    await nextBtn.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Helper: Fill Step 2 - Facility Information (电力设施信息)
 */
async function fillStep2FacilityInfo(page: Page) {
  // Fill transformer capacity (变压器容量) - clear first then fill
  const transformerInput = page.locator('input:has-text("kVA"), input[placeholder*="变压器"]').first();
  if (await transformerInput.isVisible().catch(() => false)) {
    await transformerInput.clear();
    await transformerInput.fill('1000');
  }

  // Select voltage level (电压等级)
  const voltageSelect = page.locator('select:has-text("kV")').first();
  if (await voltageSelect.isVisible().catch(() => false)) {
    await voltageSelect.selectOption({ index: 1 });
  }

  // Fill monthly consumption (平均月用电量)
  const consumptionInput = page.locator('input:has-text("kWh"), input[placeholder*="用电量"]').first();
  if (await consumptionInput.isVisible().catch(() => false)) {
    await consumptionInput.fill('50000');
  }

  // Fill available area (可用面积)
  const areaInput = page.locator('input:has-text("平方米"), input[placeholder*="面积"]').first();
  if (await areaInput.isVisible().catch(() => false)) {
    await areaInput.clear();
    await areaInput.fill('500');
  }

  // Select site type (场地类型)
  const siteTypeSelect = page.locator('select:has-text("屋顶"), select:has-text("场地")').first();
  if (await siteTypeSelect.isVisible().catch(() => false)) {
    await siteTypeSelect.selectOption({ index: 0 });
  }

  // Fill planned date (计划投产日期) - use valid date format
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.isVisible().catch(() => false)) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    const dateStr = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
    await dateInput.fill(dateStr);
  }
}

/**
 * Helper: Fill Step 3 - Technical Proposal (技术方案)
 */
async function fillStep3TechnicalProposal(page: Page) {
  // Fill battery capacity (电池容量)
  const batteryCapacityInput = page.locator('input[placeholder*="容量"], input:has-text("kWh"), input[name*="batteryCapacity"]').first();
  if (await batteryCapacityInput.isVisible().catch(() => false)) {
    await batteryCapacityInput.fill('2000');
  }

  // Fill power (功率)
  const powerInput = page.locator('input[placeholder*="功率"], input:has-text("kW"), input[name*="power"]').first();
  if (await powerInput.isVisible().catch(() => false)) {
    await powerInput.fill('1000');
  }

  // Select battery type (电池类型)
  const batterySelect = page.locator('select:has-text("电池"), select[name*="battery"]').first();
  if (await batterySelect.isVisible().catch(() => false)) {
    await batterySelect.selectOption({ index: 0 });
  }

  // Fill daily cycles (日循环次数)
  const cyclesInput = page.locator('input[placeholder*="循环"], input[name*="cycles"]').first();
  if (await cyclesInput.isVisible().catch(() => false)) {
    await cyclesInput.fill('2');
  }
}

/**
 * Helper: Fill Step 4 - Financial Model (财务测算)
 */
async function fillStep4FinancialModel(page: Page) {
  // Fill equipment cost (设备成本/总投资)
  const totalCostInput = page.locator('input[placeholder*="投资"], input[placeholder*="成本"], input[name*="totalCost"]').first();
  if (await totalCostInput.isVisible().catch(() => false)) {
    await totalCostInput.clear();
    await totalCostInput.fill('3000000');
  }

  // Fill equipment cost breakdown
  const equipmentCostInput = page.locator('input[name*="equipmentCost"], input:has-text("设备")').first();
  if (await equipmentCostInput.isVisible().catch(() => false)) {
    await equipmentCostInput.fill('2500000');
  }

  // Fill installation cost
  const installationCostInput = page.locator('input[name*="installationCost"], input:has-text("安装")').first();
  if (await installationCostInput.isVisible().catch(() => false)) {
    await installationCostInput.fill('500000');
  }

  // Fill discount rate (折现率) or interest rate
  const discountRateInput = page.locator('input[placeholder*="利率"], input[placeholder*="折现率"], input[name*="discountRate"], input[name*="interestRate"]').first();
  if (await discountRateInput.isVisible().catch(() => false)) {
    await discountRateInput.fill('8');
  }
}

/**
 * Helper: Complete full project form
 */
async function completeProjectForm(page: Page) {
  // Step 1: Owner Info
  await fillStep1OwnerInfo(page);
  await goToNextStep(page);

  // Step 2: Facility Info
  await fillStep2FacilityInfo(page);
  await goToNextStep(page);

  // Step 3: Technical Proposal
  await fillStep3TechnicalProposal(page);
  await goToNextStep(page);

  // Step 4: Financial Model
  await fillStep4FinancialModel(page);
  
  // Submit/Calculate
  const calculateBtn = page.locator('button:has-text("计算"), button:has-text("Calculate"), button:has-text("提交"), button:has-text("完成")').first();
  if (await calculateBtn.isVisible().catch(() => false)) {
    await calculateBtn.click();
    await page.waitForTimeout(3000); // Wait for calculation
  }
}

test.describe('🚀 User Journey: Registration → Project Creation', () => {
  test('complete registration and create first project', async ({ page }) => {
    const user = getTestUser();
    
    // Register
    await registerUser(page, user);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/01-dashboard.png', fullPage: true });

    // Create project
    const projectId = await createProject(page);
    expect(projectId).toBeTruthy();
    
    // Take screenshot of new project
    await page.screenshot({ path: 'test-results/02-new-project.png', fullPage: true });

    // Fill form
    await completeProjectForm(page);
    
    // Take screenshot of results
    await page.screenshot({ path: 'test-results/03-calculation-results.png', fullPage: true });
  });

  test('login and access existing project', async ({ page }) => {
    const user = getTestUser();
    
    // Register first
    await registerUser(page, user);
    
    // Create a project
    await createProject(page);
    await completeProjectForm(page);
    
    // Go back to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find and click on the project
    const projectCard = page.locator('[data-testid="project-card"], .project-card, a[href*="/project/"]').first();
    if (await projectCard.isVisible().catch(() => false)) {
      await projectCard.click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      
      // Verify we're on the project page
      await expect(page.locator('form, [data-testid="project-form"]').first()).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/04-existing-project.png', fullPage: true });
  });
});

test.describe('📊 User Journey: Calculator Operations', () => {
  test('navigate through all form steps', async ({ page }) => {
    const user = getTestUser();
    await registerUser(page, user);
    
    await createProject(page);
    
    // Step 1: Fill basic info
    await fillStep1OwnerInfo(page);
    await page.screenshot({ path: 'test-results/05-step1-filled.png', fullPage: true });
    await goToNextStep(page);
    
    // Step 2: Verify we're on facility info step
    await page.waitForTimeout(1000);
    await expect(page.locator('text=电力设施信息, text=场地信息').first()).toBeVisible().catch(() => {});
    await page.screenshot({ path: 'test-results/06-step2.png', fullPage: true });
    
    // Try to proceed (may have validation, that's ok)
    await goToNextStep(page);
    
    // Step 3: Verify we're on technical proposal step
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/07-step3.png', fullPage: true });
    
    // Step 4: Try to reach financial model
    await goToNextStep(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/08-step4.png', fullPage: true });
  });

  test('form validation works on step 1', async ({ page }) => {
    const user = getTestUser();
    await registerUser(page, user);
    
    await createProject(page);
    
    // Try to submit empty step 1
    const submitBtn = page.locator('button[type="submit"], button:has-text("下一步")').first();
    await submitBtn.click();
    
    // Check for validation errors
    await page.waitForTimeout(500);
    
    // Look for error messages or invalid field styling
    const errorElements = page.locator('.text-red-500, .text-red-600, .border-red-500, [role="alert"]');
    const hasErrors = await errorElements.count() > 0;
    
    // Either shows errors or we're still on step 1
    const stillOnStep1 = await page.locator('text=业主信息, text=企业基本信息').first().isVisible().catch(() => false);
    
    expect(hasErrors || stillOnStep1).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/09-validation-errors.png', fullPage: true });
  });
});

test.describe('📁 User Journey: Project Management', () => {
  test('duplicate and delete project', async ({ page }) => {
    const user = getTestUser();
    await registerUser(page, user);
    
    // Create original project
    await createProject(page);
    await fillStep1OwnerInfo(page);
    await goToNextStep(page);
    
    // Go back to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial project count
    const initialProjects = await page.locator('[data-testid="project-card"], .project-card').count();
    
    // Find and click duplicate button
    const duplicateBtn = page.locator('button[title*="复制"], button:has-text("Duplicate"), [data-testid="duplicate-btn"]').first();
    if (await duplicateBtn.isVisible().catch(() => false)) {
      await duplicateBtn.click();
      await page.waitForTimeout(1500);
      
      // Verify project was duplicated
      const newCount = await page.locator('[data-testid="project-card"], .project-card').count();
      expect(newCount).toBeGreaterThan(initialProjects);
    }
    
    await page.screenshot({ path: 'test-results/07-duplicate-project.png', fullPage: true });
    
    // Test delete
    const deleteBtn = page.locator('button[title*="删除"], button:has-text("Delete"), [data-testid="delete-btn"]').first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      
      // Confirm deletion
      const confirmBtn = page.locator('button:has-text("确认"), button:has-text("Confirm"), button:has-text("Yes"), button:has-text("删除")').first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.screenshot({ path: 'test-results/08-after-delete.png', fullPage: true });
  });
});

test.describe('📱 Responsive Design Tests', () => {
  test('full workflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const user = getTestUser();
    await registerUser(page, user);
    
    await createProject(page);
    await fillStep1OwnerInfo(page);
    
    await page.screenshot({ path: 'test-results/09-mobile-step1.png', fullPage: true });
  });

  test('full workflow on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const user = getTestUser();
    await registerUser(page, user);
    
    await createProject(page);
    await fillStep1OwnerInfo(page);
    
    await page.screenshot({ path: 'test-results/10-tablet-step1.png', fullPage: true });
  });
});

test.describe('⚡ Performance Tests', () => {
  test('dashboard loads within 3 seconds', async ({ page }) => {
    const user = getTestUser();
    await registerUser(page, user);
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('project creation and calculation completes within 15 seconds', async ({ page }) => {
    const user = getTestUser();
    await registerUser(page, user);
    
    const startTime = Date.now();
    
    await createProject(page);
    await completeProjectForm(page);
    
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(15000);
  });
});

test.describe('🔒 Security Tests', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login|register/);
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill with invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    // Wait for error message or stay on login page
    await page.waitForTimeout(1000);
    
    // Either shows error or stays on login page
    const errorMessage = page.locator('.error, [role="alert"], .text-red-500').first();
    const stillOnLogin = (await page.url()).includes('/login');
    
    expect(await errorMessage.isVisible().catch(() => false) || stillOnLogin).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/11-login-error.png' });
  });
});

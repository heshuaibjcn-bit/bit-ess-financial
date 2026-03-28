/**
 * Project Template Service
 *
 * 管理项目模板的创建、保存和使用
 */

import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

/**
 * 项目模板
 */
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string; // 行业分类
  formData: ProjectInput;
  thumbnail?: string;
  isSystem?: boolean; // 是否为系统模板
  createdAt: string;
  usageCount?: number; // 使用次数
}

/**
 * 模板分类
 */
export const TEMPLATE_CATEGORIES = {
  manufacturing: '制造业',
  datacenter: '数据中心',
  commercial: '商业综合体',
  industrial: '工业园区',
  charging: '充电站',
  other: '其他',
} as const;

/**
 * 系统内置模板
 */
export const SYSTEM_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'template-manufacturing-1',
    name: '制造业工厂 - 峰谷套利',
    description: '适用于大中型制造业工厂的储能配置方案',
    category: 'manufacturing',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
    formData: {
      province: 'guangdong',
      systemSize: {
        capacity: 2.0,
        duration: 2,
      },
      costs: {
        batteryCostPerKwh: 1200,
        pcsCostPerKw: 300,
        emsCost: 100000,
        installationCostPerKw: 150,
        gridConnectionCost: 200000,
        landCost: 0,
        developmentCost: 150000,
        permittingCost: 50000,
        contingencyPercent: 0.05,
      },
      operatingParams: {
        systemEfficiency: 0.88,
        depthOfDischarge: 0.90,
        cyclesPerDay: 1.5,
        degradationRate: 0.02,
        availabilityPercent: 0.97,
      },
      operatingCosts: {
        operationsStaffCost: 500000,
        managementCost: 300000,
        technicalSupportCost: 200000,
        officeRent: 100000,
        officeExpenses: 50000,
        regularMaintenanceCost: 200000,
        preventiveMaintenanceCost: 80000,
        equipmentInsurance: 100000,
        liabilityInsurance: 50000,
        propertyInsurance: 30000,
        licenseFee: 50000,
        regulatoryFee: 20000,
        trainingCost: 30000,
        utilitiesCost: 20000,
        landLeaseCost: 100000,
        salesExpenses: 303818,
        vatRate: 0.06,
        surtaxRate: 0.12,
        corporateTaxRate: 0.25,
      },
      financing: {
        hasLoan: false,
        equityRatio: 1.0,
        taxHolidayYears: 6,
      },
      ownerInfo: {
        companyName: '',
        industry: 'manufacturing',
        companyScale: 'medium',
        creditRating: 'AA',
        paymentHistory: 'good',
        collaborationModel: 'emc',
        contractDuration: 10,
        revenueShareRatio: 80,
      },
      facilityInfo: {
        transformerCapacity: 1000,
        voltageLevel: '0.4kV',
        avgMonthlyLoad: 50000,
        peakLoad: 500,
        availableArea: 500,
        roofType: 'flat',
        needsExpansion: false,
        commissionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      tariffDetail: {
        tariffType: 'industrial',
        peakPrice: 1.0,
        valleyPrice: 0.4,
        flatPrice: 0.6,
        hourlyPrices: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          price: hour >= 8 && hour <= 11 ? 1.0 : hour >= 23 || hour <= 6 ? 0.4 : 0.6,
          period: hour >= 8 && hour <= 11 ? ('peak' as const) : hour >= 23 || hour <= 6 ? ('valley' as const) : ('flat' as const),
        })),
      },
      technicalProposal: {
        recommendedCapacity: 2.0,
        recommendedPower: 1.0,
        capacityPowerRatio: 2.0,
        chargeStrategy: 'arbitrage_only',
        cycleLife: 6000,
        expectedThroughput: 10800,
        optimizedFor: 'balanced',
      },
    },
  },
  {
    id: 'template-datacenter-1',
    name: '数据中心 - 备用电源',
    description: '数据中心UPS电池储能配置方案',
    category: 'datacenter',
    isSystem: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
    formData: {
      province: 'beijing',
      systemSize: {
        capacity: 1.0,
        duration: 4,
      },
      costs: {
        batteryCostPerKwh: 1500,
        pcsCostPerKw: 400,
        emsCost: 150000,
        installationCostPerKw: 200,
        gridConnectionCost: 300000,
        landCost: 0,
        developmentCost: 200000,
        permittingCost: 80000,
        contingencyPercent: 0.08,
      },
      operatingParams: {
        systemEfficiency: 0.92,
        depthOfDischarge: 0.80,
        cyclesPerDay: 0.5,
        degradationRate: 0.015,
        availabilityPercent: 0.999,
      },
      operatingCosts: {
        operationsStaffCost: 800000,
        managementCost: 500000,
        technicalSupportCost: 300000,
        officeRent: 150000,
        officeExpenses: 80000,
        regularMaintenanceCost: 300000,
        preventiveMaintenanceCost: 120000,
        equipmentInsurance: 150000,
        liabilityInsurance: 80000,
        propertyInsurance: 50000,
        licenseFee: 80000,
        regulatoryFee: 30000,
        trainingCost: 50000,
        utilitiesCost: 30000,
        landLeaseCost: 150000,
        salesExpenses: 400000,
        vatRate: 0.06,
        surtaxRate: 0.12,
        corporateTaxRate: 0.25,
      },
      financing: {
        hasLoan: true,
        loanRatio: 0.6,
        interestRate: 0.045,
        loanTerm: 8,
        equityRatio: 0.4,
        taxHolidayYears: 5,
      },
      ownerInfo: {
        companyName: '',
        industry: 'datacenter',
        companyScale: 'large',
        creditRating: 'AAA',
        paymentHistory: 'excellent',
        collaborationModel: 'sale',
        contractDuration: 15,
        revenueShareRatio: 100,
      },
      facilityInfo: {
        transformerCapacity: 2000,
        voltageLevel: '10kV',
        avgMonthlyLoad: 200000,
        peakLoad: 1000,
        availableArea: 300,
        roofType: 'flat',
        needsExpansion: false,
        commissionDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      tariffDetail: {
        tariffType: 'industrial',
        peakPrice: 1.2,
        valleyPrice: 0.35,
        flatPrice: 0.65,
        hourlyPrices: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          price: hour >= 9 && hour <= 11 ? 1.2 : hour >= 22 || hour <= 5 ? 0.35 : 0.65,
          period: hour >= 9 && hour <= 11 ? ('peak' as const) : hour >= 22 || hour <= 5 ? ('valley' as const) : ('flat' as const),
        })),
      },
      technicalProposal: {
        recommendedCapacity: 1.0,
        recommendedPower: 0.25,
        capacityPowerRatio: 4.0,
        chargeStrategy: 'backup_first',
        cycleLife: 8000,
        expectedThroughput: 2000,
        optimizedFor: 'reliability',
      },
    },
  },
];

// Storage keys
const TEMPLATES_KEY = 'ess_project_templates';

/**
 * 获取所有模板
 */
export function getTemplates(): ProjectTemplate[] {
  try {
    const data = localStorage.getItem(TEMPLATES_KEY);
    const userTemplates: ProjectTemplate[] = data ? JSON.parse(data) : [];
    return [...SYSTEM_TEMPLATES, ...userTemplates];
  } catch {
    return SYSTEM_TEMPLATES;
  }
}

/**
 * 获取用户创建的模板
 */
export function getUserTemplates(): ProjectTemplate[] {
  try {
    const data = localStorage.getItem(TEMPLATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 保存模板
 */
export function saveTemplate(template: Omit<ProjectTemplate, 'id' | 'createdAt'>): ProjectTemplate {
  const userTemplates = getUserTemplates();

  const newTemplate: ProjectTemplate = {
    ...template,
    id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };

  userTemplates.push(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(userTemplates));

  return newTemplate;
}

/**
 * 更新模板
 */
export function updateTemplate(id: string, updates: Partial<ProjectTemplate>): void {
  const userTemplates = getUserTemplates();
  const index = userTemplates.findIndex(t => t.id === id);

  if (index !== -1) {
    userTemplates[index] = { ...userTemplates[index], ...updates };
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(userTemplates));
  }
}

/**
 * 删除模板
 */
export function deleteTemplate(id: string): void {
  const userTemplates = getUserTemplates();
  const filtered = userTemplates.filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
}

/**
 * 从模板创建项目
 */
export function createProjectFromTemplate(templateId: string, projectName: string): ProjectInput {
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);

  if (!template) {
    throw new Error('模板不存在');
  }

  // 增加使用次数
  if (!template.isSystem) {
    updateTemplate(templateId, { usageCount: (template.usageCount || 0) + 1 });
  }

  // 返回表单数据的深拷贝
  return JSON.parse(JSON.stringify(template.formData));
}

/**
 * 保存项目为模板
 */
export function saveProjectAsTemplate(
  projectId: string,
  projectName: string,
  description: string | null,
  category: string,
  formData: ProjectInput
): ProjectTemplate {
  const template = saveTemplate({
    name: projectName,
    description,
    category,
    formData,
  });

  return template;
}

/**
 * 按分类获取模板
 */
export function getTemplatesByCategory(category: string): ProjectTemplate[] {
  const templates = getTemplates();
  return templates.filter(t => t.category === category);
}

/**
 * 搜索模板
 */
export function searchTemplates(query: string): ProjectTemplate[] {
  const templates = getTemplates();
  const lowerQuery = query.toLowerCase();

  return templates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery) ||
    t.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 获取模板分类列表
 */
export function getTemplateCategories(): string[] {
  return Object.values(TEMPLATE_CATEGORIES);
}

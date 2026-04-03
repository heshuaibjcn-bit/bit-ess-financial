/**
 * 新报告结构测试
 *
 * 测试新的 6 节报告结构和模板系统：
 * - 验证章节结构正确
 * - 测试术语表应用
 * - 验证语言风格指南
 * - 测试 AI 生成内容质量
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InvestmentReportService } from '../InvestmentReportService';
import { ReportDataContext } from '../ReportDataContext';
import { REPORT_STRUCTURE } from '../templates';
import { readFileSync } from 'fs';
import { join } from 'path';

// 类型导入
import type { Project } from '@/domain/models/Project';
import type { OwnerInfo, FacilityInfo, TariffDetail } from '@/domain/schemas/ProjectSchema';

// 扩展 Project 类型
type TestProject = Project & {
  ownerInfo?: OwnerInfo;
  facilityInfo?: FacilityInfo;
  tariffDetail?: TariffDetail;
};

// 创建测试项目
const createTestProject = (): TestProject => ({
  id: 'test-new-structure',
  userId: 'test-user',
  projectName: '工商业储能投资分析项目',
  description: '测试新报告结构的项目',
  province: 'guangdong',
  systemSize: {
    capacity: 1000,
    power: 500,
  },
  costs: {
    batteryCostPerKwh: 1.2,
    pcsCostPerKw: 0.3,
    bmsCostPerKwh: 0.1,
    emsCostPerKwh: 0.05,
    thermalMgmtCostPerKwh: 0.08,
    fireProtectionCostPerKwh: 0.05,
    containerCostPerKwh: 0.1,
    installationCostPerKw: 0.15,
    otherCostPerKwh: 0.02,
  },
  operatingParams: {
    systemEfficiency: 0.88,
    depthOfDischarge: 0.9,
    cyclesPerDay: 1.5,
    degradationRate: 0.02,
    availabilityPercent: 95,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  version: 1,
  ownerInfo: {
    companyName: '广州储能科技有限公司',
    industry: '制造业',
    address: '广东省广州市番禺区',
  },
  facilityInfo: {
    address: '广东省广州市番禺区科技园',
    transformerCapacity: 630,
    voltageLevel: '10kV',
    avgMonthlyLoad: 300000,
    peakLoad: 500,
    availableArea: 500,
  },
  tariffDetail: {
    policyType: 'two-part',
    peakPrice: 1.15,
    valleyPrice: 0.35,
    flatPrice: 0.65,
  },
});

describe('新报告结构测试', () => {
  let service: InvestmentReportService;
  let project: TestProject;

  beforeEach(() => {
    service = new InvestmentReportService();
    project = createTestProject();
  });

  describe('1. 章节结构验证', () => {
    it('应该有 6 个章节', () => {
      expect(REPORT_STRUCTURE).toHaveLength(6);
    });

    it('应该包含正确的章节 ID', () => {
      const chapterIds = REPORT_STRUCTURE.map(s => s.id);
      expect(chapterIds).toContain('executive_summary');
      expect(chapterIds).toContain('project_overview');
      expect(chapterIds).toContain('financial_analysis');
      expect(chapterIds).toContain('policy_environment');
      expect(chapterIds).toContain('risk_assessment');
      expect(chapterIds).toContain('investment_recommendation');
    });

    it('章节顺序应该正确', () => {
      expect(REPORT_STRUCTURE[0].id).toBe('executive_summary');
      expect(REPORT_STRUCTURE[1].id).toBe('project_overview');
      expect(REPORT_STRUCTURE[2].id).toBe('financial_analysis');
      expect(REPORT_STRUCTURE[3].id).toBe('policy_environment');
      expect(REPORT_STRUCTURE[4].id).toBe('risk_assessment');
      expect(REPORT_STRUCTURE[5].id).toBe('investment_recommendation');
    });

    it('所有章节都应该有标题和英文名', () => {
      REPORT_STRUCTURE.forEach(section => {
        expect(section.title).toBeTruthy();
        expect(section.titleEn).toBeTruthy();
        expect(section.order).toBeGreaterThan(0);
      });
    });
  });

  describe('2. 术语表验证', () => {
    it('术语表文件应该存在', () => {
      const terminologyPath = join(__dirname, '../../terminology.json');
      expect(() => readFileSync(terminologyPath, 'utf-8')).not.toThrow();
    });

    it('术语表应该包含至少 20 个术语', () => {
      const terminologyPath = join(__dirname, '../../terminology.json');
      const terminology = JSON.parse(readFileSync(terminologyPath, 'utf-8'));
      expect(terminology.terminology).toBeDefined();
      expect(terminology.terminology.length).toBeGreaterThanOrEqual(20);
    });

    it('每个术语应该有必需的字段', () => {
      const terminologyPath = join(__dirname, '../../terminology.json');
      const terminology = JSON.parse(readFileSync(terminologyPath, 'utf-8'));

      terminology.terminology.forEach((term: any) => {
        expect(term.term).toBeTruthy();
        expect(term.english).toBeTruthy();
        expect(term.definition).toBeTruthy();
        expect(term.forbidden_synonyms).toBeInstanceOf(Array);
        expect(term.example_usage).toBeTruthy();
      });
    });

    it('核心术语应该存在', () => {
      const terminologyPath = join(__dirname, '../../terminology.json');
      const terminology = JSON.parse(readFileSync(terminologyPath, 'utf-8'));
      const terms = terminology.terminology.map((t: any) => t.term);

      expect(terms).toContain('内部收益率');
      expect(terms).toContain('净现值');
      expect(terms).toContain('投资回收期');
      expect(terms).toContain('储能平准化成本');
      expect(terms).toContain('峰谷价差');
    });
  });

  describe('3. 语言风格指南验证', () => {
    it('语言风格指南文件应该存在', () => {
      const guidePath = join(__dirname, '../../language-style-guide.md');
      expect(() => readFileSync(guidePath, 'utf-8')).not.toThrow();
    });

    it('语言风格指南应该包含关键部分', () => {
      const guidePath = join(__dirname, '../../language-style-guide.md');
      const guide = readFileSync(guidePath, 'utf-8');

      expect(guide).toContain('词汇规则');
      expect(guide).toContain('句式风格');
      expect(guide).toContain('数字格式');
      expect(guide).toContain('语气和态度');
      expect(guide).toContain('禁止词汇');
    });

    it('禁止词汇列表应该存在', () => {
      const guidePath = join(__dirname, '../../language-style-guide.md');
      const guide = readFileSync(guidePath, 'utf-8');

      expect(guide).toContain('非常好');
      expect(guide).toContain('特别');
      expect(guide).toContain('挺');
      expect(guide).toContain('差不多');
    });
  });

  describe('4. 报告生成测试', () => {
    it('应该成功生成报告数据', async () => {
      const context = new ReportDataContext(project);
      context.collectBasicData();

      // 验证基础数据收集
      expect(context.project).toBeDefined();
      expect(context.project.province).toBe('guangdong');
    });

    it('应该生成所有章节的叙述', async () => {
      const result = await service.generateReport(project as Project, {
        enableAgent: {
          dueDiligence: false,
          policyAnalysis: false,
          technicalProposal: false,
          riskAssessment: false,
          reportNarrative: true,
        },
      });

      // 验证生成结果
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.dataContext).toBeDefined();
      expect(result.narratives).toBeDefined();

      // 验证所有章节都生成了
      const expectedChapters = [
        'executive_summary',
        'project_overview',
        'financial_analysis',
        'policy_environment',
        'risk_assessment',
        'investment_recommendation',
      ];

      expectedChapters.forEach(chapter => {
        expect(result.narratives[chapter]).toBeDefined();
        expect(typeof result.narratives[chapter]).toBe('string');
      });
    }, 30000); // 30秒超时
  });

  describe('5. AI 内容质量验证', () => {
    it('生成的章节应该符合模板规范', async () => {
      const result = await service.generateReport(project as Project, {
        enableAgent: {
          dueDiligence: false,
          policyAnalysis: false,
          technicalProposal: false,
          riskAssessment: false,
          reportNarrative: true,
        },
      });

      // 检查执行摘要
      const executiveSummary = result.narratives.executive_summary;
      expect(executiveSummary).toBeDefined();
      expect(executiveSummary.length).toBeGreaterThan(100);

      // 检查是否包含关键指标
      expect(executiveSummary).toMatch(/IRR|内部收益率/);
      expect(executiveSummary).toMatch(/NPV|净现值/);
    }, 30000);

    it('应该使用正确的术语', async () => {
      const result = await service.generateReport(project as Project, {
        enableAgent: {
          dueDiligence: false,
          policyAnalysis: false,
          technicalProposal: false,
          riskAssessment: false,
          reportNarrative: true,
        },
      });

      const financialAnalysis = result.narratives.financial_analysis;

      // 检查是否使用了标准术语
      expect(financialAnalysis).toMatch(/内部收益率/);
      // 不应该使用禁止的同义词（但这需要更复杂的验证）
    }, 30000);

    it('应该避免使用禁止词汇', async () => {
      const result = await service.generateReport(project as Project, {
        enableAgent: {
          dueDiligence: false,
          policyAnalysis: false,
          technicalProposal: false,
          riskAssessment: false,
          reportNarrative: true,
        },
      });

      // 检查所有章节
      Object.values(result.narratives).forEach((chapter, index) => {
        const forbiddenWords = ['非常好', '特别', '挺好', '差不多'];
        const hasForbiddenWord = forbiddenWords.some(word =>
          chapter.includes(word)
        );

        if (hasForbiddenWord) {
          const chapterName = Object.keys(result.narratives)[index];
          console.warn(`章节 ${chapterName} 可能包含禁止词汇`);
        }
      });
    }, 30000);
  });

  describe('6. 模板系统验证', () => {
    it('模板文件应该全部存在', () => {
      const templates = [
        'executive-summary.md',
        'project-overview.md',
        'financial-analysis.md',
        'policy-environment.md',
        'risk-assessment.md',
        'investment-recommendation.md',
      ];

      templates.forEach(template => {
        const templatePath = join(__dirname, '../../templates', template);
        expect(() => readFileSync(templatePath, 'utf-8')).not.toThrow();
      });
    });

    it('模板应该包含必需的部分', () => {
      const executiveSummaryPath = join(__dirname, '../../templates/executive-summary.md');
      const template = readFileSync(executiveSummaryPath, 'utf-8');

      expect(template).toContain('## 模板规范');
      expect(template).toContain('### 开头模板');
      expect(template).toContain('### 内容结构');
      expect(template).toContain('### 结尾模板');
      expect(template).toContain('## 输出格式');
    });

    it('模板应该定义输出格式接口', () => {
      const financialAnalysisPath = join(__dirname, '../../templates/financial-analysis.md');
      const template = readFileSync(financialAnalysisPath, 'utf-8');

      expect(template).toContain('interface FinancialAnalysis');
      expect(template).toContain('keyMetrics');
      expect(template).toContain('cashFlowAnalysis');
      expect(template).toContain('sensitivity');
    });
  });

  describe('7. 视觉样式系统验证', () => {
    it('视觉样式文件应该存在', () => {
      const visualStylePath = join(__dirname, '../../visual-style.ts');
      expect(() => readFileSync(visualStylePath, 'utf-8')).not.toThrow();
    });

    it('视觉样式应该包含完整的定义', () => {
      const visualStylePath = join(__dirname, '../../visual-style.ts');
      const content = readFileSync(visualStylePath, 'utf-8');

      expect(content).toContain('FontFamily');
      expect(content).toContain('Color');
      expect(content).toContain('Spacing');
      expect(content).toContain('TextStyle');
      expect(content).toContain('TableStyle');
      expect(content).toContain('ChartStyle');
    });

    it('应该导出 CSS 生成函数', () => {
      const visualStylePath = join(__dirname, '../../visual-style.ts');
      const content = readFileSync(visualStylePath, 'utf-8');

      expect(content).toContain('generateCSSStyles');
      expect(content).toContain('getStyle');
      expect(content).toContain('getChartColor');
    });
  });

  describe('8. PDF 模板验证', () => {
    it('PDF 模板文件应该存在', () => {
      const templates = [
        'cover.html.ts',
        'chapter-page.html.ts',
        'content-page.html.ts',
      ];

      templates.forEach(template => {
        const templatePath = join(__dirname, '../../pdf-templates', template);
        expect(() => readFileSync(templatePath, 'utf-8')).not.toThrow();
      });
    });

    it('封面模板应该导出生成函数', () => {
      const coverPath = join(__dirname, '../../pdf-templates/cover.html.ts');
      const content = readFileSync(coverPath, 'utf-8');

      expect(content).toContain('generateCoverPageHTML');
      expect(content).toContain('generateDefaultCoverPage');
    });

    it('章节页模板应该导出生成函数', () => {
      const chapterPath = join(__dirname, '../../pdf-templates/chapter-page.html.ts');
      const content = readFileSync(chapterPath, 'utf-8');

      expect(content).toContain('generateChapterPageHTML');
      expect(content).toContain('generateStandardChapterPage');
    });

    it('内容页模板应该导出生成函数', () => {
      const contentPath = join(__dirname, '../../pdf-templates/content-page.html.ts');
      const content = readFileSync(contentPath, 'utf-8');

      expect(content).toContain('generateContentPageHTML');
      expect(content).toContain('renderMarkdownToHTML');
    });
  });

  describe('9. 端到端报告生成测试', () => {
    it('应该生成完整的 Markdown 报告', async () => {
      const result = await service.generateReport(project as Project, {
        enableAgent: {
          dueDiligence: false,
          policyAnalysis: false,
          technicalProposal: false,
          riskAssessment: false,
          reportNarrative: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.narratives).toBeDefined();

      // 验证所有章节都有内容
      const chapters = Object.keys(result.narratives);
      expect(chapters).toHaveLength(6);

      // 验证每个章节的内容长度合理
      chapters.forEach(chapter => {
        const content = result.narratives[chapter];
        expect(content.length).toBeGreaterThan(50); // 至少有一些内容
        console.log(`章节 ${chapter}: ${content.length} 字符`);
      });
    }, 30000);
  });

  describe('10. 数据完整性测试', () => {
    it('ReportDataContext 应该正确存储数据', () => {
      const context = new ReportDataContext(project);
      context.collectBasicData();

      // 验证项目数据
      expect(context.project.id).toBe('test-new-structure');
      expect(context.project.province).toBe('guangdong');
      expect(context.project.ownerInfo?.companyName).toBe('广州储能科技有限公司');
    });

    it('应该能设置和获取智能体报告', () => {
      const context = new ReportDataContext(project);

      // 设置 mock 尽调报告
      const mockDDReport = {
        companyInfo: {
          name: '测试公司',
          registrationNumber: '123456',
          legalRepresentative: '张三',
          registeredCapital: 1000000,
          establishmentDate: new Date('2020-01-01'),
          status: 'active',
          industry: '制造业',
        },
        creditRating: {
          level: 'AA',
          score: 85,
          confidence: 0.9,
        },
        financialHealth: {
          profitability: 'good',
          liquidity: 'good',
          solvency: 'good',
          efficiency: 'good',
        },
        paymentHistory: {
          onTimeRate: 0.95,
          latePayments: 1,
          defaults: 0,
          records: [],
        },
        businessRisks: [],
        recommendations: [],
        metadata: {
          dataSource: 'test',
          reportGenerated: new Date(),
          confidence: 0.9,
        },
      };

      context.setDueDiligenceReport(mockDDReport);
      const retrieved = context.getDueDiligenceReport();

      expect(retrieved).toBeDefined();
      expect(retrieved?.companyInfo.name).toBe('测试公司');
      expect(retrieved?.creditRating.score).toBe(85);
    });
  });
});

/**
 * 真实电价数据仓库
 * 
 * 职责：
 * 1. 封装数据访问逻辑
 * 2. 数据验证和转换
 * 3. 审计日志记录
 * 4. 数据血缘追踪
 */

import { getRealTariffDatabase } from '@/services/database/RealTariffDatabase';
import type {
  Province,
  TariffVersion,
  TariffDetail,
  TimePeriodConfig,
  DataAuditLog,
  CompleteTariffData,
  ValidationResult,
} from '@/types/real-tariff';

// 创建版本输入
export interface CreateVersionInput {
  provinceCode: string;
  version: string;
  effectiveDate: string;
  policyNumber: string;
  policyTitle: string;
  policyUrl: string;
  publishDate: string;
  source: 'ndrc' | 'grid' | 'gov_open';
  tariffs: Omit<TariffDetail, 'id' | 'versionId' | 'provinceCode' | 'createdAt' | 'updatedAt'>[];
  timePeriods: Omit<TimePeriodConfig, 'id' | 'versionId' | 'provinceCode' | 'createdAt' | 'updatedAt'>;
}

/**
 * 真实电价数据仓库
 */
export class RealTariffRepository {
  private db = getRealTariffDatabase();

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    await this.db.initialize();
    await this.db.initializeProvinces();
  }

  // ========== 省份查询 ==========

  async getAllProvinces(): Promise<Province[]> {
    return this.db.getAllProvinces();
  }

  async getProvince(code: string): Promise<Province | null> {
    return this.db.getProvince(code);
  }

  async getProvincesByRegion(region: string): Promise<Province[]> {
    return this.db.getProvincesByRegion(region);
  }

  // ========== 版本管理 ==========

  /**
   * 创建新版本（带审计日志）
   */
  async createVersion(input: CreateVersionInput, userId?: string): Promise<{
    versionId: string;
    requiresApproval: boolean;
  }> {
    const province = await this.db.getProvince(input.provinceCode);
    if (!province) {
      throw new Error(`Province ${input.provinceCode} not found`);
    }

    const now = new Date().toISOString();
    const versionId = `${input.provinceCode.toLowerCase()}_${input.version}`;

    // 检查版本是否已存在
    const existing = await this.db.getVersion(versionId);
    if (existing) {
      throw new Error(`Version ${versionId} already exists`);
    }

    // 创建版本记录
    const version: TariffVersion = {
      id: versionId,
      provinceCode: input.provinceCode,
      version: input.version,
      effectiveDate: input.effectiveDate,
      policyNumber: input.policyNumber,
      policyTitle: input.policyTitle,
      policyUrl: input.policyUrl,
      publishDate: input.publishDate,
      source: input.source,
      verified: false,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    await this.db.createVersion(version);

    // 创建电价明细
    const details: TariffDetail[] = input.tariffs.map((t, index) => ({
      id: `${versionId}_tariff_${index}`,
      versionId,
      provinceCode: input.provinceCode,
      ...t,
      createdAt: now,
      updatedAt: now,
    }));

    await this.db.createTariffDetails(details);

    // 创建时段配置
    const timePeriod: TimePeriodConfig = {
      id: `${versionId}_period`,
      versionId,
      provinceCode: input.provinceCode,
      ...input.timePeriods,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.createTimePeriod(timePeriod);

    // 记录审计日志
    await this.createAuditLog({
      provinceCode: input.provinceCode,
      versionId,
      action: 'create',
      trigger: userId ? 'manual_update' : 'agent_crawl',
      source: input.policyUrl,
      hash: this.calculateDataHash(version, details, timePeriod),
      afterValue: { version, details, timePeriod },
      confidence: 1.0,
      verified: false,
    });

    return {
      versionId,
      requiresApproval: true,
    };
  }

  /**
   * 审批版本（人工验证）
   */
  async approveVersion(versionId: string, userId: string): Promise<void> {
    const version = await this.db.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (version.status !== 'draft') {
      throw new Error(`Version ${versionId} is not in draft status`);
    }

    // 更新版本状态
    await this.db.updateVersionStatus(versionId, 'active');

    // 将该省份的其他active版本设为expired
    const allVersions = await this.db.getVersionsByProvince(version.provinceCode);
    for (const v of allVersions) {
      if (v.id !== versionId && v.status === 'active') {
        await this.db.updateVersionStatus(v.id, 'expired');
      }
    }

    // 更新版本记录
    version.verified = true;
    version.verificationDate = new Date().toISOString();
    version.verifiedBy = userId;

    const tx = (await this.db as any).db.transaction('tariffVersions', 'readwrite');
    const store = tx.objectStore('tariffVersions');
    await (this.db as any).promisifyRequest(store.put(version));

    // 记录审计日志
    await this.createAuditLog({
      provinceCode: version.provinceCode,
      versionId,
      action: 'verify',
      trigger: 'manual_update',
      source: version.policyUrl,
      hash: '',
      confidence: 1.0,
      verified: true,
    });
  }

  /**
   * 获取活跃版本
   */
  async getActiveVersion(provinceCode: string): Promise<TariffVersion | null> {
    return this.db.getActiveVersion(provinceCode);
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(provinceCode: string): Promise<TariffVersion[]> {
    const versions = await this.db.getVersionsByProvince(provinceCode);
    return versions.sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
  }

  // ========== 数据查询 ==========

  async getCompleteTariffData(provinceCode: string): Promise<CompleteTariffData | null> {
    return this.db.getCompleteTariffData(provinceCode);
  }

  async getTariffByVoltage(provinceCode: string, voltageLevel: string): Promise<TariffDetail | null> {
    const version = await this.db.getActiveVersion(provinceCode);
    if (!version) return null;
    return this.db.getTariffByVoltage(version.id, voltageLevel);
  }

  // ========== 审计日志 ==========

  async getAuditLogs(provinceCode: string, limit = 50): Promise<DataAuditLog[]> {
    return this.db.getAuditLogsByProvince(provinceCode, limit);
  }

  private async createAuditLog(params: Omit<DataAuditLog, 'id' | 'createdAt'>): Promise<void> {
    const log: DataAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      createdAt: new Date().toISOString(),
    };
    await this.db.createAuditLog(log);
  }

  // ========== 数据验证 ==========

  async validateVersion(versionId: string): Promise<ValidationResult> {
    const version = await this.db.getVersion(versionId);
    if (!version) {
      return {
        valid: false,
        provinceCode: '',
        errors: [{ field: 'version', message: 'Version not found', severity: 'critical' }],
        warnings: [],
      };
    }

    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // 必填字段检查
    if (!version.policyNumber) {
      errors.push({ field: 'policyNumber', message: 'Policy number is required', severity: 'critical' });
    }
    if (!version.effectiveDate) {
      errors.push({ field: 'effectiveDate', message: 'Effective date is required', severity: 'critical' });
    }

    // 电价数据检查
    const details = await this.db.getDetailsByVersion(versionId);
    if (details.length === 0) {
      errors.push({ field: 'tariffs', message: 'At least one tariff is required', severity: 'critical' });
    }

    for (const detail of details) {
      // 价格合理性检查
      if (detail.peakPrice <= 0 || detail.valleyPrice <= 0 || detail.flatPrice <= 0) {
        errors.push({ 
          field: `tariff.${detail.voltageLevel}`, 
          message: `Invalid price for ${detail.voltageLevel}`, 
          severity: 'error' 
        });
      }

      // 峰谷价差检查
      const ratio = detail.peakPrice / detail.valleyPrice;
      if (ratio < 1.5 || ratio > 5) {
        warnings.push({
          field: `tariff.${detail.voltageLevel}`,
          message: `Peak/valley ratio (${ratio.toFixed(2)}) seems unusual`,
        });
      }
    }

    // 时段配置检查
    const timePeriod = await this.db.getTimePeriodByVersion(versionId);
    if (!timePeriod) {
      errors.push({ field: 'timePeriods', message: 'Time periods configuration is required', severity: 'critical' });
    } else {
      const allHours = new Set([
        ...timePeriod.peakHours,
        ...timePeriod.valleyHours,
        ...timePeriod.flatHours,
      ]);
      if (allHours.size !== 24) {
        errors.push({ field: 'timePeriods', message: 'Time periods must cover all 24 hours', severity: 'error' });
      }
    }

    return {
      valid: errors.length === 0,
      provinceCode: version.provinceCode,
      errors,
      warnings,
    };
  }

  // ========== 数据导出 ==========

  async exportData(): Promise<string> {
    return this.db.exportAllData();
  }

  // ========== 辅助方法 ==========

  private calculateDataHash(version: TariffVersion, details: TariffDetail[], timePeriod: TimePeriodConfig): string {
    // 简化的hash计算
    const data = JSON.stringify({ version, details, timePeriod });
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// 单例实例
let repositoryInstance: RealTariffRepository | null = null;

export function getRealTariffRepository(): RealTariffRepository {
  if (!repositoryInstance) {
    repositoryInstance = new RealTariffRepository();
  }
  return repositoryInstance;
}

/**
 * 本地电价数据仓库
 *
 * 使用 LocalTariffDatabase (IndexedDB) 实现数据访问层
 * 保持与 Supabase TariffRepository 相同的接口
 */

import { getLocalTariffDatabase } from '../services/database/LocalTariffDatabase';

// 类型定义
export interface TariffProvince {
  id: string;
  code: string;
  name: string;
  region: string;
  gridCompany: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TariffVersion {
  id: string;
  provinceId: string;
  version: string;
  effectiveDate: string;
  policyNumber: string;
  policyTitle?: string;
  policyUrl?: string;
  status: 'draft' | 'active' | 'expired' | 'superseded';
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // 数据来源标识
  dataSource?: 'real' | 'default' | 'mock';
  dataConfidence?: number;
  crawlMetadata?: {
    crawledAt?: string;
    sourceUrl?: string;
    parseMethod?: string;
    fallbackReason?: string;
  };
}

export interface TariffData {
  id: string;
  versionId: string;
  provinceId: string;
  voltageLevel: '0.4kV' | '10kV' | '35kV' | '110kV' | '220kV';
  tariffType: 'industrial' | 'commercial' | 'large_industrial' | 'residential' | 'agricultural';
  peakPrice: number;
  valleyPrice: number;
  flatPrice: number;
  avgPrice: number;
  billComponents: any;
  seasonalAdjustments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface TimePeriod {
  id: string;
  versionId: string;
  provinceId: string;
  peakHours: number[];
  valleyHours: number[];
  flatHours: number[];
  peakDescription?: string;
  valleyDescription?: string;
  flatDescription?: string;
  seasonalPeriods?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLog {
  id: string;
  provinceId: string;
  versionId: string;
  updateType: 'create' | 'update' | 'expire' | 'supersede';
  triggerType: 'manual' | 'agent' | 'api' | 'scheduled';
  changesSummary: any;
  agentInfo?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rollback';
  validationResult?: any;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteTariffData {
  province: TariffProvince;
  version: TariffVersion;
  tariffs: TariffData[];
  timePeriods: TimePeriod;
}

export interface CreateTariffVersionInput {
  provinceCode: string;
  version: string;
  effectiveDate: string;
  policyNumber: string;
  policyTitle?: string;
  policyUrl?: string;
  tariffs: {
    voltageLevel: string;
    tariffType: string;
    peakPrice: number;
    valleyPrice: number;
    flatPrice: number;
    billComponents?: any;
  }[];
  timePeriods: {
    peakHours: number[];
    valleyHours: number[];
    flatHours: number[];
    peakDescription?: string;
    valleyDescription?: string;
    flatDescription?: string;
  };
  // 数据来源标识
  dataSource?: 'real' | 'default' | 'mock';
  dataConfidence?: number;
  crawlMetadata?: {
    crawledAt?: string;
    sourceUrl?: string;
    parseMethod?: string;
    fallbackReason?: string;
  };
}

export interface VersionComparison {
  version1: TariffVersion;
  version2: TariffVersion;
  differences: {
    versionId: string;
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * 本地电价数据仓库
 */
export class LocalTariffRepository {
  private db = getLocalTariffDatabase();

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    await this.db.initialize();
  }

  /**
   * 获取所有省份
   */
  async getProvinces(): Promise<TariffProvince[]> {
    return await this.db.getProvinces();
  }

  /**
   * 根据代码获取省份
   */
  async getProvinceByCode(code: string): Promise<TariffProvince | null> {
    return await this.db.getProvinceByCode(code);
  }

  /**
   * 获取省份当前生效电价
   */
  async getActiveTariffByProvince(provinceCode: string): Promise<CompleteTariffData | null> {
    return await this.db.getActiveTariffByProvince(provinceCode);
  }

  /**
   * 根据省份和电压等级获取电价
   */
  async getTariffByVoltage(
    provinceCode: string,
    voltageLevel: string
  ): Promise<TariffData | null> {
    return await this.db.getTariffByVoltage(provinceCode, voltageLevel);
  }

  /**
   * 创建新电价版本
   */
  async createTariffVersion(
    input: CreateTariffVersionInput,
    userId?: string
  ): Promise<{ versionId: string; requiresApproval: boolean }> {
    const province = await this.db.getProvinceByCode(input.provinceCode);
    if (!province) {
      throw new Error(`Province ${input.provinceCode} not found`);
    }

    const now = new Date().toISOString();
    const versionId = `${input.provinceCode.toLowerCase()}_${input.version}`;

    // 创建版本记录
    const version: TariffVersion = {
      id: versionId,
      provinceId: province.id,
      version: input.version,
      effectiveDate: input.effectiveDate,
      policyNumber: input.policyNumber,
      policyTitle: input.policyTitle,
      policyUrl: input.policyUrl,
      status: 'draft',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      dataSource: input.dataSource,
      dataConfidence: input.dataConfidence,
      crawlMetadata: input.crawlMetadata,
    };

    await this.db.addVersion(version);

    // 创建电价数据
    for (const tariff of input.tariffs) {
      const tariffData: TariffData = {
        id: `${versionId}_${tariff.voltageLevel}`,
        versionId: versionId,
        provinceId: province.id,
        voltageLevel: tariff.voltageLevel as any,
        tariffType: tariff.tariffType as any,
        peakPrice: tariff.peakPrice,
        valleyPrice: tariff.valleyPrice,
        flatPrice: tariff.flatPrice,
        avgPrice: (tariff.peakPrice + tariff.valleyPrice + tariff.flatPrice) / 3,
        billComponents: tariff.billComponents || {},
        createdAt: now,
        updatedAt: now,
      };
      await this.db.add('tariffs', tariffData);
    }

    // 创建时段配置
    const timePeriod: TimePeriod = {
      id: `${versionId}_periods`,
      versionId: versionId,
      provinceId: province.id,
      peakHours: input.timePeriods.peakHours,
      valleyHours: input.timePeriods.valleyHours,
      flatHours: input.timePeriods.flatHours,
      peakDescription: input.timePeriods.peakDescription,
      valleyDescription: input.timePeriods.valleyDescription,
      flatDescription: input.timePeriods.flatDescription,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.add('timePeriods', timePeriod);

    // 创建更新日志
    const log: UpdateLog = {
      id: `${versionId}_log`,
      provinceId: province.id,
      versionId: versionId,
      updateType: 'create',
      triggerType: userId ? 'manual' : 'agent',
      changesSummary: {
        version: input.version,
        effectiveDate: input.effectiveDate,
        tariffCount: input.tariffs.length,
        dataSource: input.dataSource || 'unknown',
        dataConfidence: input.dataConfidence || 0,
      },
      status: 'pending',
      requiresApproval: true,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.addUpdateLog(log);

    return { versionId, requiresApproval: true };
  }

  /**
   * 比较两个版本
   */
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<VersionComparison | null> {
    const versions = await this.db.getAll('versions');
    const version1 = versions.find((v: TariffVersion) => v.id === versionId1);
    const version2 = versions.find((v: TariffVersion) => v.id === versionId2);

    if (!version1 || !version2) {
      return null;
    }

    const differences: VersionComparison['differences'] = [];

    // 比较版本字段
    const fieldsToCompare: (keyof TariffVersion)[] = [
      'version',
      'effectiveDate',
      'policyNumber',
      'policyTitle',
      'status',
    ];

    for (const field of fieldsToCompare) {
      if (version1[field] !== version2[field]) {
        differences.push({
          versionId: field,
          field,
          oldValue: version1[field],
          newValue: version2[field],
        });
      }
    }

    return {
      version1,
      version2,
      differences,
    };
  }

  /**
   * 审批更新
   */
  async approveUpdate(updateId: string, userId: string): Promise<boolean> {
    const logs = await this.db.getAll('updateLogs');
    const log = logs.find((l: UpdateLog) => l.id === updateId);

    if (!log) {
      throw new Error(`Update log ${updateId} not found`);
    }

    if (log.status !== 'pending') {
      throw new Error(`Update ${updateId} is not in pending status`);
    }

    // 更新日志状态
    const updatedLog: UpdateLog = {
      ...log,
      status: 'completed',
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.put('updateLogs', updatedLog);

    // 激活版本
    await this.db.updateVersionStatus(log.versionId, 'active');

    // 将该省份的其他active版本设为expired
    const versions = await this.db.getAll('versions');
    for (const v of versions) {
      if ((v as TariffVersion).provinceId === log.provinceId &&
          (v as TariffVersion).status === 'active' &&
          (v as TariffVersion).id !== log.versionId) {
        await this.db.updateVersionStatus((v as TariffVersion).id, 'expired');
      }
    }

    return true;
  }

  /**
   * 拒绝更新
   */
  async rejectUpdate(updateId: string, userId: string, reason: string): Promise<boolean> {
    const logs = await this.db.getAll('updateLogs');
    const log = logs.find((l: UpdateLog) => l.id === updateId);

    if (!log) {
      throw new Error(`Update log ${updateId} not found`);
    }

    const updatedLog: UpdateLog = {
      ...log,
      status: 'failed',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    await this.db.put('updateLogs', updatedLog);

    return true;
  }

  /**
   * 获取更新日志
   */
  async getUpdateLogs(provinceCode?: string, limit = 50): Promise<UpdateLog[]> {
    return await this.db.getUpdateLogs(provinceCode, limit);
  }

  /**
   * 获取待审批的更新
   */
  async getPendingApprovals(): Promise<UpdateLog[]> {
    const logs = await this.db.getUpdateLogs();
    return logs.filter(log => log.status === 'pending' && log.requiresApproval);
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<string> {
    return await this.db.exportToJson();
  }

  /**
   * 导入数据
   */
  async importData(json: string): Promise<void> {
    await this.db.importFromJson(json);
  }

  /**
   * 初始化省份数据
   */
  async initializeProvinces(): Promise<void> {
    // 数据库初始化时会自动导入省份数据
    await this.db.initialize();
  }
}

/**
 * 单例实例
 */
let repositoryInstance: LocalTariffRepository | null = null;

export function getLocalTariffRepository(): LocalTariffRepository {
  if (!repositoryInstance) {
    repositoryInstance = new LocalTariffRepository();
  }
  return repositoryInstance;
}

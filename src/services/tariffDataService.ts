/**
 * Tariff Data Service
 *
 * 管理电价数据的读取、更新和自动同步
 * 数据来源：国家发改委、国家电网、南方电网官网
 */

import { type Province, PROVINCES } from '@/domain/schemas/ProjectSchema';
import type { VoltageLevel, TariffType, HourlyPrice } from '@/domain/schemas/ProjectSchema';
import tariffDataJson from '@/config/tariffData.json';

/**
 * 电价数据接口
 */
export interface TariffInfo {
  tariffType: TariffType;
  name: string;
  peakPrice: number;
  valleyPrice: number;
  flatPrice: number;
  effectiveDate: string;
  policyNumber: string;
}

export interface ProvinceTariffData {
  name: string;
  region: string;
  tariffs: Record<VoltageLevel, TariffInfo>;
  timePeriods: {
    peak: { hours: number[]; description: string };
    valley: { hours: number[]; description: string };
    flat: { hours: number[]; description: string };
  };
}

export interface TariffDataMetadata {
  version: string;
  lastUpdated: string;
  dataSource: string;
  updateUrl: string;
  nextUpdateDate: string;
}

/**
 * 电压等级与电价类型的映射关系
 */
const VOLTAGE_TO_TARIFF_TYPE: Record<VoltageLevel, TariffType> = {
  '0.4kV': 'industrial',
  '10kV': 'large_industrial',
  '35kV': 'large_industrial',
};

/**
 * 本地存储key
 */
const STORAGE_KEYS = {
  TARIFF_DATA: 'ess_tariff_data',
  LAST_UPDATE_CHECK: 'ess_tariff_last_update_check',
  UPDATE_NOTIFICATION_SHOWN: 'ess_tariff_update_notification_shown',
};

/**
 * 电价数据服务类
 */
export class TariffDataService {
  private tariffData: typeof tariffDataJson;
  private cachedData: Map<string, ProvinceTariffData> = new Map();

  constructor() {
    this.tariffData = tariffDataJson as typeof tariffDataJson;
    this.loadFromStorage();
  }

  /**
   * 从localStorage加载数据
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TARIFF_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 如果存储的版本更新，使用存储的版本
        if (parsed.metadata?.version > this.tariffData.metadata.version) {
          this.tariffData = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load tariff data from storage:', e);
    }
  }

  /**
   * 保存到localStorage
   */
  private saveToStorage(data: typeof tariffDataJson): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TARIFF_DATA, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save tariff data to storage:', e);
    }
  }

  /**
   * 获取省份数据
   */
  public getProvinceData(province: Province): ProvinceTariffData | null {
    const cacheKey = province;

    if (this.cachedData.has(cacheKey)) {
      return this.cachedData.get(cacheKey)!;
    }

    const provinceData = this.tariffData.provinces[province as keyof typeof this.tariffData.provinces];
    if (!provinceData) {
      return null;
    }

    this.cachedData.set(cacheKey, provinceData);
    return provinceData;
  }

  /**
   * 根据省份和电压等级获取电价信息
   */
  public getTariffByVoltage(province: Province, voltageLevel: VoltageLevel): TariffInfo | null {
    const provinceData = this.getProvinceData(province);
    if (!provinceData) {
      // 使用默认数据
      return this.getDefaultTariff(voltageLevel);
    }

    return provinceData.tariffs[voltageLevel] || this.getDefaultTariff(voltageLevel);
  }

  /**
   * 获取默认电价数据（未配置的省份）
   */
  private getDefaultTariff(voltageLevel: VoltageLevel): TariffInfo {
    const defaults = this.tariffData.defaults.otherProvinces[voltageLevel];
    const timePeriods = this.tariffData.defaults.timePeriods;

    return {
      ...defaults,
      name: `${voltageLevel}默认电价`,
      effectiveDate: new Date().toISOString().split('T')[0],
      policyNumber: '默认数据',
    };
  }

  /**
   * 根据电压等级获取推荐的电价类型
   */
  public getRecommendedTariffType(voltageLevel: VoltageLevel): TariffType {
    return VOLTAGE_TO_TARIFF_TYPE[voltageLevel];
  }

  /**
   * 生成24小时电价分布
   */
  public generateHourlyPrices(
    province: Province,
    voltageLevel: VoltageLevel
  ): HourlyPrice[] {
    const provinceData = this.getProvinceData(province);
    const tariff = this.getTariffByVoltage(province, voltageLevel);

    if (!tariff) {
      throw new Error(`无法获取 ${province} ${voltageLevel} 的电价数据`);
    }

    // 使用省份的时间段配置，如果没有则使用默认
    const timePeriods = provinceData?.timePeriods || this.tariffData.defaults.timePeriods;

    const periodMap = new Map<number, 'peak' | 'valley' | 'flat'>();
    timePeriods.peak.hours.forEach(h => periodMap.set(h, 'peak'));
    timePeriods.valley.hours.forEach(h => periodMap.set(h, 'valley'));
    timePeriods.flat.hours.forEach(h => periodMap.set(h, 'flat'));

    // 生成24小时电价
    return Array.from({ length: 24 }, (_, hour) => {
      const period = periodMap.get(hour) || 'flat';
      const basePrice = period === 'peak' ? tariff.peakPrice :
                       period === 'valley' ? tariff.valleyPrice :
                       tariff.flatPrice;

      return {
        hour,
        price: basePrice,
        period,
      };
    });
  }

  /**
   * 检查是否需要更新数据
   */
  public needsUpdate(): boolean {
    const lastCheck = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE_CHECK);
    if (!lastCheck) {
      return true;
    }

    const checkDate = new Date(lastCheck);
    const now = new Date();
    const daysSinceLastCheck = Math.floor((now.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));

    // 每30天检查一次更新
    return daysSinceLastCheck >= 30;
  }

  /**
   * 手动检查更新（从远程API）
   */
  public async checkForUpdates(): Promise<boolean> {
    try {
      const response = await fetch(this.tariffData.metadata.updateUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check for updates');
      }

      const remoteData = await response.json();

      // 检查版本号
      if (remoteData.metadata?.version > this.tariffData.metadata.version) {
        // 找到新版本
        return true;
      }

      // 更新最后检查时间
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_CHECK, new Date().toISOString());
      return false;
    } catch (e) {
      console.error('Failed to check for tariff updates:', e);
      return false;
    }
  }

  /**
   * 执行数据更新
   */
  public async updateTariffData(): Promise<void> {
    try {
      const response = await fetch(this.tariffData.metadata.updateUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch updated tariff data');
      }

      const newData = await response.json();

      // 验证数据格式
      if (!this.validateTariffData(newData)) {
        throw new Error('Invalid tariff data format');
      }

      // 更新本地数据
      this.tariffData = newData;
      this.saveToStorage(newData);

      // 清除缓存
      this.cachedData.clear();

      // 更新最后检查时间
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_CHECK, new Date().toISOString());

      // 标记通知已显示（新数据会显示新通知）
      localStorage.removeItem(STORAGE_KEYS.UPDATE_NOTIFICATION_SHOWN);
    } catch (e) {
      console.error('Failed to update tariff data:', e);
      throw e;
    }
  }

  /**
   * 验证电价数据格式
   */
  private validateTariffData(data: any): boolean {
    if (!data?.metadata || !data?.provinces) {
      return false;
    }

    // 检查必需的字段
    const requiredFields = ['version', 'lastUpdated', 'dataSource'];
    for (const field of requiredFields) {
      if (!data.metadata[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取元数据
   */
  public getMetadata(): TariffDataMetadata {
    return this.tariffData.metadata;
  }

  /**
   * 获取数据过期时间（天）
   */
  public getDaysUntilUpdate(): number {
    const nextUpdate = new Date(this.tariffData.metadata.nextUpdateDate);
    const now = new Date();
    const diffTime = nextUpdate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cachedData.clear();
    localStorage.removeItem(STORAGE_KEYS.TARIFF_DATA);
  }
}

/**
 * 单例实例
 */
let tariffServiceInstance: TariffDataService | null = null;

export function getTariffService(): TariffDataService {
  if (!tariffServiceInstance) {
    tariffServiceInstance = new TariffDataService();
  }
  return tariffServiceInstance;
}

/**
 * 便捷函数：根据省份和电压等级获取电价
 */
export function getTariffByVoltage(province: Province, voltageLevel: VoltageLevel): TariffInfo | null {
  return getTariffService().getTariffByVoltage(province, voltageLevel);
}

/**
 * 便捷函数：生成24小时电价分布
 */
export function generateHourlyPrices(province: Province, voltageLevel: VoltageLevel): HourlyPrice[] {
  return getTariffService().generateHourlyPrices(province, voltageLevel);
}

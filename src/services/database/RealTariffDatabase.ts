/**
 * 真实电价数据库 - IndexedDB存储
 * 
 * 特点：
 * 1. 100%真实数据存储
 * 2. 完整的数据审计日志
 * 3. 版本管理和变更追踪
 * 4. 数据血缘追踪
 */

import type {
  Province,
  TariffVersion,
  TariffDetail,
  TimePeriodConfig,
  DataAuditLog,
  CompleteTariffData,
} from '@/types/real-tariff';

import { NATIONWIDE_PROVINCES } from '@/config/nationwide-data-sources';

const DB_NAME = 'EssRealTariffDB';
const DB_VERSION = 2;

// 存储对象名称
const STORES = {
  PROVINCES: 'provinces',
  VERSIONS: 'tariffVersions',
  DETAILS: 'tariffDetails',
  TIME_PERIODS: 'timePeriods',
  AUDIT_LOGS: 'auditLogs',
} as const;

/**
 * 真实电价数据库管理器
 */
export class RealTariffDatabase {
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[RealTariffDB] Database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 省份表
        if (!db.objectStoreNames.contains(STORES.PROVINCES)) {
          const provinceStore = db.createObjectStore(STORES.PROVINCES, { keyPath: 'code' });
          provinceStore.createIndex('region', 'region', { unique: false });
          provinceStore.createIndex('status', 'status', { unique: false });
        }

        // 电价版本表
        if (!db.objectStoreNames.contains(STORES.VERSIONS)) {
          const versionStore = db.createObjectStore(STORES.VERSIONS, { keyPath: 'id' });
          versionStore.createIndex('provinceCode', 'provinceCode', { unique: false });
          versionStore.createIndex('status', 'status', { unique: false });
          versionStore.createIndex('effectiveDate', 'effectiveDate', { unique: false });
        }

        // 电价明细表
        if (!db.objectStoreNames.contains(STORES.DETAILS)) {
          const detailStore = db.createObjectStore(STORES.DETAILS, { keyPath: 'id' });
          detailStore.createIndex('versionId', 'versionId', { unique: false });
          detailStore.createIndex('provinceCode', 'provinceCode', { unique: false });
          detailStore.createIndex('voltageLevel', 'voltageLevel', { unique: false });
        }

        // 时段配置表
        if (!db.objectStoreNames.contains(STORES.TIME_PERIODS)) {
          const periodStore = db.createObjectStore(STORES.TIME_PERIODS, { keyPath: 'id' });
          periodStore.createIndex('versionId', 'versionId', { unique: false });
          periodStore.createIndex('provinceCode', 'provinceCode', { unique: false });
        }

        // 审计日志表
        if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
          const auditStore = db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id' });
          auditStore.createIndex('provinceCode', 'provinceCode', { unique: false });
          auditStore.createIndex('versionId', 'versionId', { unique: false });
          auditStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * 初始化省份数据（首次运行）
   */
  async initializeProvinces(): Promise<void> {
    const existing = await this.getAllProvinces();
    if (existing.length > 0) {
      console.log('[RealTariffDB] Provinces already initialized');
      return;
    }

    const tx = this.db!.transaction(STORES.PROVINCES, 'readwrite');
    const store = tx.objectStore(STORES.PROVINCES);

    for (const province of NATIONWIDE_PROVINCES) {
      await this.promisifyRequest(store.put(province));
    }

    console.log(`[RealTariffDB] Initialized ${NATIONWIDE_PROVINCES.length} provinces`);
  }

  // ========== 省份操作 ==========

  /**
   * 获取所有省份
   */
  async getAllProvinces(): Promise<Province[]> {
    const tx = this.db!.transaction(STORES.PROVINCES, 'readonly');
    const store = tx.objectStore(STORES.PROVINCES);
    return this.promisifyRequest(store.getAll());
  }

  /**
   * 按代码获取省份
   */
  async getProvince(code: string): Promise<Province | null> {
    const tx = this.db!.transaction(STORES.PROVINCES, 'readonly');
    const store = tx.objectStore(STORES.PROVINCES);
    return this.promisifyRequest(store.get(code));
  }

  /**
   * 按区域获取省份
   */
  async getProvincesByRegion(region: string): Promise<Province[]> {
    const tx = this.db!.transaction(STORES.PROVINCES, 'readonly');
    const store = tx.objectStore(STORES.PROVINCES);
    const index = store.index('region');
    return this.promisifyRequest(index.getAll(region));
  }

  // ========== 电价版本操作 ==========

  /**
   * 创建电价版本
   */
  async createVersion(version: TariffVersion): Promise<void> {
    const tx = this.db!.transaction(STORES.VERSIONS, 'readwrite');
    const store = tx.objectStore(STORES.VERSIONS);
    await this.promisifyRequest(store.put(version));
  }

  /**
   * 获取省份的所有版本
   */
  async getVersionsByProvince(code: string): Promise<TariffVersion[]> {
    const tx = this.db!.transaction(STORES.VERSIONS, 'readonly');
    const store = tx.objectStore(STORES.VERSIONS);
    const index = store.index('provinceCode');
    return this.promisifyRequest(index.getAll(code));
  }

  /**
   * 获取生效中的版本
   */
  async getActiveVersion(code: string): Promise<TariffVersion | null> {
    const versions = await this.getVersionsByProvince(code);
    return versions.find(v => v.status === 'active') || null;
  }

  /**
   * 获取特定版本
   */
  async getVersion(id: string): Promise<TariffVersion | null> {
    const tx = this.db!.transaction(STORES.VERSIONS, 'readonly');
    const store = tx.objectStore(STORES.VERSIONS);
    return this.promisifyRequest(store.get(id));
  }

  /**
   * 更新版本状态
   */
  async updateVersionStatus(id: string, status: TariffVersion['status']): Promise<void> {
    const version = await this.getVersion(id);
    if (!version) throw new Error(`Version ${id} not found`);

    version.status = status;
    version.updatedAt = new Date().toISOString();

    const tx = this.db!.transaction(STORES.VERSIONS, 'readwrite');
    const store = tx.objectStore(STORES.VERSIONS);
    await this.promisifyRequest(store.put(version));
  }

  // ========== 电价明细操作 ==========

  /**
   * 批量创建电价明细
   */
  async createTariffDetails(details: TariffDetail[]): Promise<void> {
    const tx = this.db!.transaction(STORES.DETAILS, 'readwrite');
    const store = tx.objectStore(STORES.DETAILS);

    for (const detail of details) {
      await this.promisifyRequest(store.put(detail));
    }
  }

  /**
   * 获取版本的电价明细
   */
  async getDetailsByVersion(versionId: string): Promise<TariffDetail[]> {
    const tx = this.db!.transaction(STORES.DETAILS, 'readonly');
    const store = tx.objectStore(STORES.DETAILS);
    const index = store.index('versionId');
    return this.promisifyRequest(index.getAll(versionId));
  }

  /**
   * 获取特定电压等级的电价
   */
  async getTariffByVoltage(versionId: string, voltageLevel: string): Promise<TariffDetail | null> {
    const details = await this.getDetailsByVersion(versionId);
    return details.find(d => d.voltageLevel === voltageLevel) || null;
  }

  // ========== 时段配置操作 ==========

  /**
   * 创建时段配置
   */
  async createTimePeriod(period: TimePeriodConfig): Promise<void> {
    const tx = this.db!.transaction(STORES.TIME_PERIODS, 'readwrite');
    const store = tx.objectStore(STORES.TIME_PERIODS);
    await this.promisifyRequest(store.put(period));
  }

  /**
   * 获取版本的时段配置
   */
  async getTimePeriodByVersion(versionId: string): Promise<TimePeriodConfig | null> {
    const tx = this.db!.transaction(STORES.TIME_PERIODS, 'readonly');
    const store = tx.objectStore(STORES.TIME_PERIODS);
    const index = store.index('versionId');
    const periods = await this.promisifyRequest(index.getAll(versionId));
    return periods[0] || null;
  }

  // ========== 完整数据获取 ==========

  /**
   * 获取省份的完整电价数据
   */
  async getCompleteTariffData(provinceCode: string): Promise<CompleteTariffData | null> {
    const province = await this.getProvince(provinceCode);
    if (!province) return null;

    const version = await this.getActiveVersion(provinceCode);
    if (!version) return null;

    const [tariffs, timePeriods] = await Promise.all([
      this.getDetailsByVersion(version.id),
      this.getTimePeriodByVersion(version.id),
    ]);

    return {
      province,
      version,
      tariffs,
      timePeriods: timePeriods!,
    };
  }

  // ========== 审计日志操作 ==========

  /**
   * 记录审计日志
   */
  async createAuditLog(log: DataAuditLog): Promise<void> {
    const tx = this.db!.transaction(STORES.AUDIT_LOGS, 'readwrite');
    const store = tx.objectStore(STORES.AUDIT_LOGS);
    await this.promisifyRequest(store.put(log));
  }

  /**
   * 获取省份的审计日志
   */
  async getAuditLogsByProvince(code: string, limit = 50): Promise<DataAuditLog[]> {
    const tx = this.db!.transaction(STORES.AUDIT_LOGS, 'readonly');
    const store = tx.objectStore(STORES.AUDIT_LOGS);
    const index = store.index('provinceCode');
    const logs = await this.promisifyRequest(index.getAll(code));
    
    // 按时间倒序
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs.slice(0, limit);
  }

  /**
   * 获取版本的审计日志
   */
  async getAuditLogsByVersion(versionId: string): Promise<DataAuditLog[]> {
    const tx = this.db!.transaction(STORES.AUDIT_LOGS, 'readonly');
    const store = tx.objectStore(STORES.AUDIT_LOGS);
    const index = store.index('versionId');
    return this.promisifyRequest(index.getAll(versionId));
  }

  // ========== 数据导出 ==========

  /**
   * 导出所有数据为JSON
   */
  async exportAllData(): Promise<string> {
    const [provinces, versions, details, timePeriods, auditLogs] = await Promise.all([
      this.getAllProvinces(),
      this.getAll(STORES.VERSIONS),
      this.getAll(STORES.DETAILS),
      this.getAll(STORES.TIME_PERIODS),
      this.getAll(STORES.AUDIT_LOGS),
    ]);

    return JSON.stringify({
      metadata: {
        exportedAt: new Date().toISOString(),
        version: DB_VERSION,
        totalProvinces: provinces.length,
        totalVersions: versions.length,
      },
      provinces,
      versions,
      details,
      timePeriods,
      auditLogs,
    }, null, 2);
  }

  /**
   * 清空所有数据（谨慎使用）
   */
  async clearAllData(): Promise<void> {
    for (const storeName of Object.values(STORES)) {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await this.promisifyRequest(store.clear());
    }
    console.log('[RealTariffDB] All data cleared');
  }

  // ========== 辅助方法 ==========

  private async getAll(storeName: string): Promise<any[]> {
    const tx = this.db!.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return this.promisifyRequest(store.getAll());
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// 单例实例
let databaseInstance: RealTariffDatabase | null = null;

export function getRealTariffDatabase(): RealTariffDatabase {
  if (!databaseInstance) {
    databaseInstance = new RealTariffDatabase();
  }
  return databaseInstance;
}

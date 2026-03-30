/**
 * 本地电价数据库 - IndexedDB存储
 *
 * 使用IndexedDB在浏览器本地存储电价数据
 * 支持离线访问和数据同步
 */

interface TariffProvince {
  id: string;
  code: string;
  name: string;
  region: string;
  gridCompany: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TariffVersion {
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
}

interface TariffData {
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

interface TimePeriod {
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

interface UpdateLog {
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

/**
 * IndexedDB数据库管理器
 */
class IndexedDBManager {
  private dbName = 'EssTariffDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  /**
   * 打开数据库
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains('provinces')) {
          const provinceStore = db.createObjectStore('provinces', { keyPath: 'id' });
          provinceStore.createIndex('code', 'code', { unique: true });
        }

        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionStore.createIndex('provinceId', 'provinceId');
          versionStore.createIndex('status', 'status');
          versionStore.createIndex('effectiveDate', 'effectiveDate');
        }

        if (!db.objectStoreNames.contains('tariffs')) {
          const tariffStore = db.createObjectStore('tariffs', { keyPath: 'id' });
          tariffStore.createIndex('versionId', 'versionId');
          tariffStore.createIndex('provinceId', 'provinceId');
        }

        if (!db.objectStoreNames.contains('timePeriods')) {
          const periodStore = db.createObjectStore('timePeriods', { keyPath: 'id' });
          periodStore.createIndex('versionId', 'versionId');
          periodStore.createIndex('provinceId', 'provinceId');
        }

        if (!db.objectStoreNames.contains('updateLogs')) {
          const logStore = db.createObjectStore('updateLogs', { keyPath: 'id' });
          logStore.createIndex('provinceId', 'provinceId');
          logStore.createIndex('versionId', 'versionId');
          logStore.createIndex('status', 'status');
          logStore.createIndex('createdAt', 'createdAt');
        }
      };
    });
  }

  /**
   * 获取对象存储
   */
  private getStore(storeName: string): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not opened');
    }
    return this.db.transaction(storeName, 'readwrite').objectStore(storeName);
  }

  /**
   * 添加记录
   */
  async add(storeName: string, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取记录
   */
  async get(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新记录
   */
  async put(storeName: string, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除记录
   */
  async delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有记录
   */
  async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 查询记录
   */
  async query(storeName: string, indexName: string, value: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空存储
   */
  async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * 本地电价数据库服务
 */
export class LocalTariffDatabase {
  private indexedDB: IndexedDBManager;

  constructor() {
    this.indexedDB = new IndexedDBManager();
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    await this.indexedDB.open();
    await this.initializeProvinces();
    await this.importFromLocalData();
  }

  /**
   * 初始化省份数据
   */
  private async initializeProvinces(): Promise<void> {
    const existing = await this.indexedDB.getAll('provinces');
    if (existing.length === 0) {
      const provinces = this.getProvinceData();
      for (const province of provinces) {
        await this.indexedDB.add('provinces', province);
      }
    }
  }

  /**
   * 获取省份数据
   */
  private getProvinceData(): TariffProvince[] {
    const now = new Date().toISOString();
    return [
      { id: 'gd', code: 'GD', name: '广东省', region: '南方电网', gridCompany: '南方电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'gx', code: 'GX', name: '广西壮族自治区', region: '南方电网', gridCompany: '南方电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'yn', code: 'YN', name: '云南省', region: '南方电网', gridCompany: '南方电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'gz', code: 'GZ', name: '贵州省', region: '南方电网', gridCompany: '南方电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'hn', code: 'HN', name: '海南省', region: '南方电网', gridCompany: '南方电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'zj', code: 'ZJ', name: '浙江省', region: '华东电网', gridCompany: '国家电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'js', code: 'JS', name: '江苏省', region: '华东电网', gridCompany: '国家电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'sh', code: 'SH', name: '上海市', region: '华东电网', gridCompany: '国家电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'ah', code: 'AH', name: '安徽省', region: '华东电网', gridCompany: '国家电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'fj', code: 'FJ', name: '福建省', region: '华东电网', gridCompany: '国家电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'sd', code: 'SD', name: '山东省', region: '华北电网', gridCompany: '国家电网', isActive: true, createdAt: now, updatedAt: now },
      { id: 'bj', code: 'BJ', name: '北京市', region: '华北电网', gridCompany: '国家电网', isActive: true, createdAt: now, updatedAt: now },
    ];
  }

  /**
   * 从本地JSON导入数据
   */
  private async importFromLocalData(): Promise<void> {
    try {
      // 检查是否已经导入过数据
      const existingVersions = await this.indexedDB.getAll('versions');
      if (existingVersions.length > 0) {
        console.log('Data already imported, skipping...');
        return;
      }

      const response = await fetch('/src/config/tariffData.json');
      const data = await response.json();

      // 导入每个省份的数据
      for (const [key, provinceData] of Object.entries(data.provinces)) {
        const province = await this.getProvinceByCode(key.toUpperCase());
        if (!province) continue;

        // 创建版本
        const version: TariffVersion = {
          id: `${key.toLowerCase()}_${data.metadata.version}`,
          provinceId: province.id,
          version: data.metadata.version,
          effectiveDate: data.metadata.lastUpdated,
          policyNumber: provinceData.tariffs?.['0.4kV']?.policyNumber || '未知',
          policyTitle: data.metadata.dataSource,
          status: 'active',
          createdAt: data.metadata.lastUpdated,
          updatedAt: data.metadata.lastUpdated,
        };

        await this.indexedDB.put('versions', version);

        // 导入电价数据
        for (const [voltageLevel, tariff] of Object.entries(provinceData.tariffs)) {
          const t = tariff as any;
          const tariffData: TariffData = {
            id: `${version.id}_${voltageLevel}`,
            versionId: version.id,
            provinceId: province.id,
            voltageLevel: voltageLevel as any,
            tariffType: t.tariffType,
            peakPrice: t.peakPrice,
            valleyPrice: t.valleyPrice,
            flatPrice: t.flatPrice,
            avgPrice: (t.peakPrice + t.valleyPrice + t.flatPrice) / 3,
            billComponents: t.billComponents || {},
            createdAt: data.metadata.lastUpdated,
            updatedAt: data.metadata.lastUpdated,
          };
          await this.indexedDB.put('tariffs', tariffData);
        }

        // 导入时段配置
        const timePeriod: TimePeriod = {
          id: `${version.id}_periods`,
          versionId: version.id,
          provinceId: province.id,
          peakHours: provinceData.timePeriods.peak.hours,
          valleyHours: provinceData.timePeriods.valley.hours,
          flatHours: provinceData.timePeriods.flat.hours,
          peakDescription: provinceData.timePeriods.peak.description,
          valleyDescription: provinceData.timePeriods.valley.description,
          flatDescription: provinceData.timePeriods.flat.description,
          createdAt: data.metadata.lastUpdated,
          updatedAt: data.metadata.lastUpdated,
        };
        await this.indexedDB.put('timePeriods', timePeriod);
      }

      console.log('Successfully imported tariff data for', Object.keys(data.provinces).length, 'provinces');
    } catch (error) {
      console.error('Failed to import local data:', error);
    }
  }

  /**
   * 获取所有省份
   */
  async getProvinces(): Promise<TariffProvince[]> {
    await this.indexedDB.open();
    return await this.indexedDB.getAll('provinces');
  }

  /**
   * 根据代码获取省份
   */
  async getProvinceByCode(code: string): Promise<TariffProvince | null> {
    await this.indexedDB.open();
    const provinces = await this.indexedDB.query('provinces', 'code', code.toUpperCase());
    return provinces[0] || null;
  }

  /**
   * 获取省份当前生效电价
   */
  async getActiveTariffByProvince(provinceCode: string): Promise<{
    province: TariffProvince;
    version: TariffVersion;
    tariffs: TariffData[];
    timePeriods: TimePeriod;
  } | null> {
    await this.indexedDB.open();

    const province = await this.getProvinceByCode(provinceCode);
    if (!province) return null;

    // 获取active版本
    const versions = await this.indexedDB.query('versions', 'provinceId', province.id);
    const activeVersion = versions.find((v: TariffVersion) => v.status === 'active');
    if (!activeVersion) return null;

    // 获取电价数据
    const tariffs = await this.indexedDB.query('tariffs', 'versionId', activeVersion.id);

    // 获取时段配置
    const timePeriods = await this.indexedDB.query('timePeriods', 'versionId', activeVersion.id);
    const timePeriod = timePeriods[0];

    return {
      province,
      version: activeVersion,
      tariffs,
      timePeriods: timePeriod,
    };
  }

  /**
   * 根据省份和电压等级获取电价
   */
  async getTariffByVoltage(provinceCode: string, voltageLevel: string): Promise<TariffData | null> {
    await this.indexedDB.open();

    const province = await this.getProvinceByCode(provinceCode);
    if (!province) return null;

    const versions = await this.indexedDB.query('versions', 'provinceId', province.id);
    const activeVersion = versions.find((v: TariffVersion) => v.status === 'active');
    if (!activeVersion) return null;

    const tariffs = await this.indexedDB.query('tariffs', 'versionId', activeVersion.id);
    const tariff = tariffs.find((t: TariffData) => t.voltageLevel === voltageLevel);

    return tariff || null;
  }

  /**
   * 添加新版本
   */
  async addVersion(version: TariffVersion): Promise<void> {
    await this.indexedDB.open();
    await this.indexedDB.put('versions', version);
  }

  /**
   * 通用添加方法
   */
  async add(storeName: string, data: any): Promise<void> {
    await this.indexedDB.open();
    await this.indexedDB.put(storeName, data);
  }

  /**
   * 获取所有记录（用于Repository）
   */
  async getAll(storeName: string): Promise<any[]> {
    await this.indexedDB.open();
    return await this.indexedDB.getAll(storeName);
  }

  /**
   * 更新记录（用于Repository）
   */
  async put(storeName: string, data: any): Promise<void> {
    await this.indexedDB.open();
    await this.indexedDB.put(storeName, data);
  }

  /**
   * 更新版本状态
   */
  async updateVersionStatus(versionId: string, status: TariffVersion['status']): Promise<void> {
    await this.indexedDB.open();
    const version = await this.indexedDB.get('versions', versionId);
    if (version) {
      version.status = status;
      version.updatedAt = new Date().toISOString();
      await this.indexedDB.put('versions', version);
    }
  }

  /**
   * 添加更新日志
   */
  async addUpdateLog(log: UpdateLog): Promise<void> {
    await this.indexedDB.open();
    await this.indexedDB.add('updateLogs', log);
  }

  /**
   * 获取更新日志
   */
  async getUpdateLogs(provinceCode?: string, limit = 50): Promise<UpdateLog[]> {
    await this.indexedDB.open();

    let logs = await this.indexedDB.getAll('updateLogs');

    // 按时间倒序排序
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (provinceCode) {
      const province = await this.getProvinceByCode(provinceCode);
      if (province) {
        logs = logs.filter((log) => log.provinceId === province.id);
      }
    }

    return logs.slice(0, limit);
  }

  /**
   * 导出数据为JSON
   */
  async exportToJson(): Promise<string> {
    await this.indexedDB.open();

    const provinces = await this.indexedDB.getAll('provinces');
    const versions = await this.indexedDB.getAll('versions');
    const tariffs = await this.indexedDB.getAll('tariffs');
    const timePeriods = await this.indexedDB.getAll('timePeriods');
    const logs = await this.indexedDB.getAll('updateLogs');

    return JSON.stringify({
      provinces,
      versions,
      tariffs,
      timePeriods,
      logs,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * 从JSON导入数据
   */
  async importFromJson(json: string): Promise<void> {
    const data = JSON.parse(json);

    await this.indexedDB.open();

    // 清空现有数据
    await this.indexedDB.clear('provinces');
    await this.indexedDB.clear('versions');
    await this.indexedDB.clear('tariffs');
    await this.indexedDB.clear('timePeriods');
    await this.indexedDB.clear('updateLogs');

    // 导入新数据
    for (const province of data.provinces || []) {
      await this.indexedDB.add('provinces', province);
    }
    for (const version of data.versions || []) {
      await this.indexedDB.add('versions', version);
    }
    for (const tariff of data.tariffs || []) {
      await this.indexedDB.add('tariffs', tariff);
    }
    for (const period of data.timePeriods || []) {
      await this.indexedDB.add('timePeriods', period);
    }
    for (const log of data.logs || []) {
      await this.indexedDB.add('updateLogs', log);
    }
  }
}

/**
 * 单例实例
 */
let localDatabaseInstance: LocalTariffDatabase | null = null;

export function getLocalTariffDatabase(): LocalTariffDatabase {
  if (!localDatabaseInstance) {
    localDatabaseInstance = new LocalTariffDatabase();
  }
  return localDatabaseInstance;
}

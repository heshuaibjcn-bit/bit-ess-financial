/**
 * ProvinceDataRepository - Repository for loading and managing province policy data
 *
 * This repository handles:
 * - Loading province data from JSON files
 * - Caching province data in memory
 * - Querying provinces by code
 * - Data validation using schemas
 */

import type { ProvinceData } from '../schemas/ProvinceSchema';
import { ProvinceDataSchema } from '../schemas/ProvinceSchema';

// Mapping of province slugs to file codes
const PROVINCE_CODE_MAP: Record<string, string> = {
  guangdong: 'GD',
  shandong: 'SD',
  zhejiang: 'ZJ',
  jiangsu: 'JS',
  shanghai: 'SH',
  anhui: 'AH',
  hunan: 'HN',
  hubei: 'HB',
  henan: 'HA',
  jiangxi: 'JX',
  beijing: 'BJ',
  tianjin: 'TJ',
  hebei: 'HE',
  shanxi: 'SX',
  neimenggu: 'NM',
  liaoning: 'LN',
  jilin: 'JL',
  heilongjiang: 'HL',
  shaanxi: 'SN',
  gansu: 'GS',
  qinghai: 'QH',
  ningxia: 'NX',
  xinjiang: 'XJ',
  sichuan: 'SC',
  chongqing: 'CQ',
  yunnan: 'YN',
  guizhou: 'GZ',
  xizang: 'XZ',
  guangxi: 'GX',
  hainan: 'HI',
  fujian: 'FJ',
};

/**
 * Repository class for managing province data
 */
export class ProvinceDataRepository {
  private cache: Map<string, ProvinceData> = new Map();
  private dataVersion: string | null = null;

  /**
   * Load province data from JSON file
   * @param provinceSlug - Province slug (e.g., 'guangdong', 'shandong')
   * @returns Promise<ProvinceData | null> - Province data or null if not found
   */
  async loadProvince(provinceSlug: string): Promise<ProvinceData | null> {
    // Check cache first
    if (this.cache.has(provinceSlug)) {
      return this.cache.get(provinceSlug)!;
    }

    // Get province code
    const code = PROVINCE_CODE_MAP[provinceSlug];
    if (!code) {
      console.warn(`Unknown province slug: ${provinceSlug}, using default data`);
      const defaultData = this.getDefaultProvinceData(provinceSlug);
      this.cache.set(provinceSlug, defaultData);
      return defaultData;
    }

    try {
      // Load JSON file from public directory
      const response = await fetch(`/data/provinces/${provinceSlug}.json`);
      if (!response.ok) {
        console.warn(`Failed to load province data: ${provinceSlug}, using default data`);
        const defaultData = this.getDefaultProvinceData(provinceSlug);
        this.cache.set(provinceSlug, defaultData);
        return defaultData;
      }

      const rawData = await response.json();

      // Validate data against schema
      const validatedData = ProvinceDataSchema.parse(rawData);

      // Cache the validated data
      this.cache.set(provinceSlug, validatedData);

      return validatedData;
    } catch (error) {
      console.error(`Error loading province data for ${provinceSlug}:`, error);
      console.warn(`Using default province data for ${provinceSlug}`);
      const defaultData = this.getDefaultProvinceData(provinceSlug);
      this.cache.set(provinceSlug, defaultData);
      return defaultData;
    }
  }

  /**
   * Get default province data when JSON file is not available
   * @param provinceSlug - Province slug
   * @returns ProvinceData - Default province data
   */
  private getDefaultProvinceData(provinceSlug: string): ProvinceData {
    const regionMap: Record<string, string> = {
      guangdong: 'south',
      guangxi: 'south',
      hainan: 'south',
      fujian: 'south',
      yunnan: 'south',
      guizhou: 'south',
      sichuan: 'south',
      chongqing: 'south',
      xizang: 'south',

      jiangsu: 'east',
      shanghai: 'east',
      zhejiang: 'east',
      anhui: 'east',
      shandong: 'east',

      beijing: 'north',
      tianjin: 'north',
      hebei: 'north',
      shanxi: 'north',
      neimenggu: 'north',

      henan: 'central',
      hubei: 'central',
      hunan: 'central',
      jiangxi: 'central',

      liaoning: 'northeast',
      jilin: 'northeast',
      heilongjiang: 'northeast',

      shaanxi: 'northwest',
      gansu: 'northwest',
      qinghai: 'northwest',
      ningxia: 'northwest',
      xinjiang: 'northwest',
    };

    const regionDefaults: Record<string, any> = {
      south: { peakPrice: 1.15, valleyPrice: 0.35, flatPrice: 0.65 },
      east: { peakPrice: 1.20, valleyPrice: 0.40, flatPrice: 0.70 },
      north: { peakPrice: 1.10, valleyPrice: 0.33, flatPrice: 0.62 },
      central: { peakPrice: 1.12, valleyPrice: 0.36, flatPrice: 0.64 },
      northeast: { peakPrice: 1.08, valleyPrice: 0.32, flatPrice: 0.60 },
      northwest: { peakPrice: 1.05, valleyPrice: 0.30, flatPrice: 0.58 },
    };

    const region = regionMap[provinceSlug] || 'east';
    const defaults = regionDefaults[region] || regionDefaults.east;

    // Generate 24-hour price profile
    const hourlyPrices: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      if (hour >= 8 && hour < 11) {
        hourlyPrices.push(defaults.peakPrice); // Morning peak
      } else if (hour >= 14 && hour < 17) {
        hourlyPrices.push(defaults.peakPrice); // Afternoon peak
      } else if (hour >= 23 || hour < 7) {
        hourlyPrices.push(defaults.valleyPrice); // Night valley
      } else {
        hourlyPrices.push(defaults.flatPrice); // Flat rate
      }
    }

    return {
      provinceCode: provinceSlug,
      provinceName: this.getProvinceName(provinceSlug),
      region,
      pricing: {
        peakPrice: defaults.peakPrice,
        valleyPrice: defaults.valleyPrice,
        flatPrice: defaults.flatPrice,
      },
      hourlyPrices,
      capacityCompensation: { available: false, type: 'none', price: 0 },
      demandResponse: { available: false, price: 0, annualRevenue: 0 },
      auxiliaryServices: {
        available: false,
        peaking: { available: false, price: 0, callsPerYear: 0 },
        frequency: { available: false, price: 0, callsPerYear: 0 },
        voltage: { available: false, price: 0, callsPerYear: 0 },
      },
      policy: {
        stability: 'medium' as const,
        confidence: 0.7,
        trend: 'stable' as const,
      },
      _source: 'default',
      _note: '使用默认省份数据',
    } as ProvinceData;
  }

  /**
   * Get Chinese name for province
   */
  private getProvinceName(provinceSlug: string): string {
    const names: Record<string, string> = {
      guangdong: '广东省',
      shandong: '山东省',
      zhejiang: '浙江省',
      jiangsu: '江苏省',
      shanghai: '上海市',
      anhui: '安徽省',
      hunan: '湖南省',
      hubei: '湖北省',
      henan: '河南省',
      jiangxi: '江西省',
      beijing: '北京市',
      tianjin: '天津市',
      hebei: '河北省',
      shanxi: '山西省',
      neimenggu: '内蒙古自治区',
      liaoning: '辽宁省',
      jilin: '吉林省',
      heilongjiang: '黑龙江省',
      shaanxi: '陕西省',
      gansu: '甘肃省',
      qinghai: '青海省',
      ningxia: '宁夏回族自治区',
      xinjiang: '新疆维吾尔自治区',
      sichuan: '四川省',
      chongqing: '重庆市',
      yunnan: '云南省',
      guizhou: '贵州省',
      xizang: '西藏自治区',
      guangxi: '广西壮族自治区',
      hainan: '海南省',
      fujian: '福建省',
    };
    return names[provinceSlug] || provinceSlug;
  }

  /**
   * Get province data by slug (with cache)
   * @param provinceSlug - Province slug
   * @returns Promise<ProvinceData | null> - Province data or null if not found
   */
  async getProvince(provinceSlug: string): Promise<ProvinceData | null> {
    return this.loadProvince(provinceSlug);
  }

  /**
   * Get multiple provinces at once
   * @param provinceSlugs - Array of province slugs
   * @returns Promise<Map<string, ProvinceData>> - Map of province slug to data
   */
  async getProvinces(provinceSlugs: string[]): Promise<Map<string, ProvinceData>> {
    const results = new Map<string, ProvinceData>();

    await Promise.all(
      provinceSlugs.map(async (slug) => {
        const data = await this.getProvince(slug);
        if (data) {
          results.set(slug, data);
        }
      })
    );

    return results;
  }

  /**
   * Get all cached provinces
   * @returns Map<string, ProvinceData> - All cached province data
   */
  getAllCached(): Map<string, ProvinceData> {
    return new Map(this.cache);
  }

  /**
   * Clear cache (useful for testing or data updates)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload provinces for better performance
   * @param provinceSlugs - Array of province slugs to preload
   */
  async preload(provinceSlugs: string[]): Promise<void> {
    await Promise.all(
      provinceSlugs.map((slug) => this.getProvince(slug))
    );
  }

  /**
   * Check if a province is supported
   * @param provinceSlug - Province slug to check
   * @returns boolean - True if province is supported
   */
  isSupported(provinceSlug: string): boolean {
    return provinceSlug in PROVINCE_CODE_MAP;
  }

  /**
   * Get list of all supported province slugs
   * @returns string[] - Array of province slugs
   */
  getSupportedProvinces(): string[] {
    return Object.keys(PROVINCE_CODE_MAP);
  }

  /**
   * Get province code from slug
   * @param provinceSlug - Province slug
   * @returns string | undefined - Province code or undefined
   */
  getCode(provinceSlug: string): string | undefined {
    return PROVINCE_CODE_MAP[provinceSlug];
  }
}

// Singleton instance
export const provinceDataRepository = new ProvinceDataRepository();

// Convenience functions
export const getProvince = (slug: string) => provinceDataRepository.getProvince(slug);
export const getProvinces = (slugs: string[]) => provinceDataRepository.getProvinces(slugs);
export const isProvinceSupported = (slug: string) => provinceDataRepository.isSupported(slug);
export const getSupportedProvinces = () => provinceDataRepository.getSupportedProvinces();

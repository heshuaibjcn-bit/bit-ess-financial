/**
 * 电价数据仓库 - TariffRepository
 *
 * 负责电价数据的CRUD操作、版本控制、数据验证等
 */

import { supabase } from '@/lib/supabase';

/**
 * 电价省份
 */
export interface TariffProvince {
  id: string;
  code: string;
  name: string;
  region: string;
  grid_company: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 电价版本
 */
export interface TariffVersion {
  id: string;
  province_id: string;
  version: string;
  effective_date: string;
  policy_number: string;
  policy_title?: string;
  policy_url?: string;
  status: 'draft' | 'active' | 'expired' | 'superseded';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 电价数据
 */
export interface TariffData {
  id: string;
  version_id: string;
  province_id: string;
  voltage_level: '0.4kV' | '10kV' | '35kV' | '110kV' | '220kV';
  tariff_type: 'industrial' | 'commercial' | 'large_industrial' | 'residential' | 'agricultural';
  peak_price: number;
  valley_price: number;
  flat_price: number;
  avg_price: number;
  bill_components: any;
  seasonal_adjustments?: any[];
  created_at: string;
  updated_at: string;
}

/**
 * 时间段配置
 */
export interface TariffTimePeriod {
  id: string;
  version_id: string;
  province_id: string;
  peak_hours: number[];
  valley_hours: number[];
  flat_hours: number[];
  peak_description?: string;
  valley_description?: string;
  flat_description?: string;
  seasonal_periods?: any[];
  created_at: string;
  updated_at: string;
}

/**
 * 电价更新日志
 */
export interface TariffUpdateLog {
  id: string;
  province_id: string;
  version_id: string;
  update_type: 'create' | 'update' | 'expire' | 'supersede';
  trigger_type: 'manual' | 'agent' | 'api' | 'scheduled';
  changes_summary: any;
  agent_info?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rollback';
  validation_result?: any;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 完整的电价数据（包含版本、价格、时间段）
 */
export interface CompleteTariffData {
  province: TariffProvince;
  version: TariffVersion;
  tariffs: TariffData[];
  time_periods: TariffTimePeriod;
}

/**
 * 创建电价版本输入
 */
export interface CreateTariffVersionInput {
  province_code: string;
  version: string;
  effective_date: string;
  policy_number: string;
  policy_title?: string;
  policy_url?: string;
  notes?: string;
  tariffs: Array<{
    voltage_level: string;
    tariff_type: string;
    peak_price: number;
    valley_price: number;
    flat_price: number;
    bill_components: any;
  }>;
  time_periods: {
    peak_hours: number[];
    valley_hours: number[];
    flat_hours: number[];
    peak_description?: string;
    valley_description?: string;
    flat_description?: string;
  };
  trigger_type?: 'manual' | 'agent' | 'api' | 'scheduled';
  agent_info?: any;
}

/**
 * 电价数据仓库类
 */
export class TariffRepository {
  /**
   * 获取所有省份列表
   */
  async getProvinces(): Promise<TariffProvince[]> {
    const { data, error } = await supabase
      .from('tariff_provinces')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * 根据代码获取省份
   */
  async getProvinceByCode(code: string): Promise<TariffProvince | null> {
    const { data, error } = await supabase
      .from('tariff_provinces')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * 获取省份当前生效的完整电价数据
   */
  async getActiveTariffByProvince(provinceCode: string): Promise<CompleteTariffData | null> {
    // 先获取省份
    const province = await this.getProvinceByCode(provinceCode);
    if (!province) return null;

    // 获取当前生效的版本
    const { data: version, error: versionError } = await supabase
      .from('tariff_versions')
      .select('*')
      .eq('province_id', province.id)
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (versionError || !version) return null;

    // 获取该版本的所有电价数据
    const { data: tariffs, error: tariffsError } = await supabase
      .from('tariff_data')
      .select('*')
      .eq('version_id', version.id);

    if (tariffsError) throw tariffsError;

    // 获取时间段配置
    const { data: timePeriods, error: periodsError } = await supabase
      .from('tariff_time_periods')
      .select('*')
      .eq('version_id', version.id)
      .single();

    if (periodsError) throw periodsError;

    return {
      province,
      version,
      tariffs: tariffs || [],
      time_periods: timePeriods as TariffTimePeriod,
    };
  }

  /**
   * 根据省份和电压等级获取电价
   */
  async getTariffByVoltage(
    provinceCode: string,
    voltageLevel: string
  ): Promise<TariffData | null> {
    const completeData = await this.getActiveTariffByProvince(provinceCode);
    if (!completeData) return null;

    const tariff = completeData.tariffs.find(t => t.voltage_level === voltageLevel);
    return tariff || null;
  }

  /**
   * 创建新的电价版本
   */
  async createTariffVersion(input: CreateTariffVersionInput, userId?: string): Promise<{
    success: boolean;
    version_id?: string;
    requires_approval: boolean;
    validation_result: any;
    error?: string;
  }> {
    try {
      // 1. 验证输入数据
      const validation = await this.validateTariffData(input);
      if (!validation.is_valid) {
        return {
          success: false,
          requires_approval: false,
          validation_result: validation,
        };
      }

      // 2. 获取省份
      const province = await this.getProvinceByCode(input.province_code);
      if (!province) {
        return {
          success: false,
          requires_approval: false,
          validation_result: { is_valid: false, errors: ['省份不存在'] },
        };
      }

      // 3. 检查是否需要审批（智能体创建的需要审批）
      const requiresApproval = input.trigger_type === 'agent';

      // 4. 创建版本记录
      const { data: version, error: versionError } = await supabase
        .from('tariff_versions')
        .insert({
          province_id: province.id,
          version: input.version,
          effective_date: input.effective_date,
          policy_number: input.policy_number,
          policy_title: input.policy_title,
          policy_url: input.policy_url,
          notes: input.notes,
          status: requiresApproval ? 'draft' : 'active',
          created_by: userId,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // 5. 如果不需要审批，创建电价数据和时间段
      if (!requiresApproval) {
        await this.createTariffData(version.id, input.tariffs);
        await this.createTimePeriods(version.id, province.id, input.time_periods);

        // 将旧版本标记为过期
        await this.expireOldVersions(province.id, version.id);
      }

      // 6. 创建更新日志
      await this.createUpdateLog({
        province_id: province.id,
        version_id: version.id,
        update_type: 'create',
        trigger_type: input.trigger_type || 'manual',
        agent_info: input.agent_info,
        status: requiresApproval ? 'pending' : 'completed',
        requires_approval: requiresApproval,
        validation_result: validation,
      });

      return {
        success: true,
        version_id: version.id,
        requires_approval: requiresApproval,
        validation_result: validation,
      };
    } catch (error: any) {
      return {
        success: false,
        requires_approval: false,
        validation_result: { is_valid: false, errors: [error.message] },
        error: error.message,
      };
    }
  }

  /**
   * 验证电价数据
   */
  private async validateTariffData(input: CreateTariffVersionInput): Promise<{
    is_valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本字段验证
    if (!input.province_code || input.province_code.length !== 2) {
      errors.push('省份代码无效');
    }

    if (!input.version || !/^\d+\.\d+\.\d+$/.test(input.version)) {
      errors.push('版本号格式无效，应为 x.y.z');
    }

    if (!input.effective_date || isNaN(Date.parse(input.effective_date))) {
      errors.push('生效日期无效');
    }

    if (!input.policy_number) {
      errors.push('政策文号不能为空');
    }

    // 电价数据验证
    if (!input.tariffs || input.tariffs.length === 0) {
      errors.push('电价数据不能为空');
    } else {
      const requiredVoltages = ['0.4kV', '10kV', '35kV'];
      const providedVoltages = input.tariffs.map(t => t.voltage_level);

      for (const voltage of requiredVoltages) {
        if (!providedVoltages.includes(voltage)) {
          warnings.push(`缺少 ${voltage} 电压等级数据`);
        }
      }

      for (const tariff of input.tariffs) {
        if (tariff.peak_price <= tariff.valley_price) {
          errors.push(`${tariff.voltage_level}: 峰时电价必须大于谷时电价`);
        }

        if (tariff.peak_price <= 0 || tariff.valley_price <= 0 || tariff.flat_price <= 0) {
          errors.push(`${tariff.voltage_level}: 电价必须大于0`);
        }

        const avg = (tariff.peak_price + tariff.valley_price + tariff.flat_price) / 3;
        if (Math.abs(tariff.avg_price - avg) > 0.1) {
          warnings.push(`${tariff.voltage_level}: 平均电价与计算值差异较大`);
        }
      }
    }

    // 时间段验证
    if (!input.time_periods) {
      errors.push('时间段配置不能为空');
    } else {
      const allHours = new Set([
        ...input.time_periods.peak_hours,
        ...input.time_periods.valley_hours,
        ...input.time_periods.flat_hours,
      ]);

      if (allHours.size !== 24) {
        errors.push('时间段配置必须覆盖24小时且不重复');
      }

      for (const hour of allHours) {
        if (hour < 0 || hour > 23) {
          errors.push(`无效的小时数: ${hour}`);
        }
      }
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 创建电价数据
   */
  private async createTariffData(versionId: string, tariffs: CreateTariffVersionInput['tariffs']): Promise<void> {
    const records = tariffs.map(tariff => ({
      version_id: versionId,
      voltage_level: tariff.voltage_level,
      tariff_type: tariff.tariff_type,
      peak_price: tariff.peak_price,
      valley_price: tariff.valley_price,
      flat_price: tariff.flat_price,
      avg_price: (tariff.peak_price + tariff.valley_price + tariff.flat_price) / 3,
      bill_components: tariff.bill_components,
    }));

    const { error } = await supabase.from('tariff_data').insert(records);
    if (error) throw error;
  }

  /**
   * 创建时间段配置
   */
  private async createTimePeriods(
    versionId: string,
    provinceId: string,
    timePeriods: CreateTariffVersionInput['time_periods']
  ): Promise<void> {
    const { error } = await supabase.from('tariff_time_periods').insert({
      version_id: versionId,
      province_id: provinceId,
      peak_hours: timePeriods.peak_hours,
      valley_hours: timePeriods.valley_hours,
      flat_hours: timePeriods.flat_hours,
      peak_description: timePeriods.peak_description,
      valley_description: timePeriods.valley_description,
      flat_description: timePeriods.flat_description,
    });

    if (error) throw error;
  }

  /**
   * 将旧版本标记为过期
   */
  private async expireOldVersions(provinceId: string, newVersionId: string): Promise<void> {
    const { error } = await supabase
      .from('tariff_versions')
      .update({ status: 'expired' })
      .eq('province_id', provinceId)
      .eq('status', 'active')
      .neq('id', newVersionId);

    if (error) throw error;
  }

  /**
   * 创建更新日志
   */
  private async createUpdateLog(log: Omit<TariffUpdateLog, 'id' | 'created_at' | 'updated_at' | 'changes_summary'>): Promise<void> {
    const { error } = await supabase.from('tariff_update_logs').insert({
      ...log,
      changes_summary: {
        new_version: log.version_id,
        fields_changed: [],
        price_changes: [],
      },
    });

    if (error) throw error;
  }

  /**
   * 获取省份的版本历史
   */
  async getVersionHistory(provinceCode: string): Promise<TariffVersion[]> {
    const province = await this.getProvinceByCode(provinceCode);
    if (!province) return [];

    const { data, error } = await supabase
      .from('tariff_versions')
      .select('*')
      .eq('province_id', province.id)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * 比较两个版本的差异
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<{
    version1: TariffVersion;
    version2: TariffVersion;
    changes: Array<{
      voltage_level: string;
      field: string;
      old_value: number;
      new_value: number;
      change_percent: number;
    }>;
  } | null> {
    // 获取两个版本
    const [v1, v2] = await Promise.all([
      supabase.from('tariff_versions').select('*').eq('id', versionId1).single(),
      supabase.from('tariff_versions').select('*').eq('id', versionId2).single(),
    ]);

    if (v1.error || v2.error || !v1.data || !v2.data) return null;

    // 获取两个版本的价格数据
    const [tariffs1, tariffs2] = await Promise.all([
      supabase.from('tariff_data').select('*').eq('version_id', versionId1),
      supabase.from('tariff_data').select('*').eq('version_id', versionId2),
    ]);

    if (tariffs1.error || tariffs2.error) return null;

    const changes: any[] = [];

    // 比较每个电压等级的价格
    for (const t1 of tariffs1.data || []) {
      const t2 = (tariffs2.data || []).find(t => t.voltage_level === t1.voltage_level);
      if (!t2) continue;

      const priceFields = [
        { key: 'peak_price', name: '峰时电价' },
        { key: 'valley_price', name: '谷时电价' },
        { key: 'flat_price', name: '平时电价' },
      ];

      for (const field of priceFields) {
        const oldValue = t1[field.key as keyof typeof t1] as number;
        const newValue = t2[field.key as keyof typeof t2] as number;

        if (oldValue !== newValue) {
          const changePercent = ((newValue - oldValue) / oldValue) * 100;
          changes.push({
            voltage_level: t1.voltage_level,
            field: field.name,
            old_value: oldValue,
            new_value: newValue,
            change_percent: Number(changePercent.toFixed(2)),
          });
        }
      }
    }

    return {
      version1: v1.data,
      version2: v2.data,
      changes,
    };
  }

  /**
   * 获取待审批的更新
   */
  async getPendingApprovals(): Promise<Array<TariffUpdateLog & { province: TariffProvince; version: TariffVersion }>> {
    const { data, error } = await supabase
      .from('tariff_update_logs')
      .select(`
        *,
        province:tariff_provinces(*),
        version:tariff_versions(*)
      `)
      .eq('status', 'pending')
      .eq('requires_approval', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  }

  /**
   * 批准更新
   */
  async approveUpdate(updateId: string, userId: string): Promise<boolean> {
    try {
      // 获取更新记录
      const { data: update, error: updateError } = await supabase
        .from('tariff_update_logs')
        .select('*')
        .eq('id', updateId)
        .single();

      if (updateError || !update) throw new Error('更新记录不存在');

      // 激活版本
      await supabase
        .from('tariff_versions')
        .update({ status: 'active' })
        .eq('id', update.version_id);

      // 将旧版本标记为过期
      await supabase
        .from('tariff_versions')
        .update({ status: 'expired' })
        .eq('province_id', update.province_id)
        .eq('status', 'active')
        .neq('id', update.version_id);

      // 更新日志状态
      const { error: updateLogError } = await supabase
        .from('tariff_update_logs')
        .update({
          status: 'completed',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', updateId);

      if (updateLogError) throw updateLogError;

      return true;
    } catch (error) {
      console.error('批准更新失败:', error);
      return false;
    }
  }

  /**
   * 拒绝更新
   */
  async rejectUpdate(updateId: string, userId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tariff_update_logs')
        .update({
          status: 'failed',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', updateId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('拒绝更新失败:', error);
      return false;
    }
  }

  /**
   * 获取更新日志
   */
  async getUpdateLogs(provinceCode?: string, limit = 50): Promise<Array<TariffUpdateLog & { province: TariffProvince }>> {
    let query = supabase
      .from('tariff_update_logs')
      .select(`
        *,
        province:tariff_provinces(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (provinceCode) {
      const province = await this.getProvinceByCode(provinceCode);
      if (province) {
        query = query.eq('province_id', province.id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  /**
   * 初始化省份数据
   */
  async initializeProvinces(): Promise<void> {
    const provinces = [
      { code: 'GD', name: '广东省', region: '南方电网', grid_company: '南方电网' },
      { code: 'GX', name: '广西壮族自治区', region: '南方电网', grid_company: '南方电网' },
      { code: 'YN', name: '云南省', region: '南方电网', grid_company: '南方电网' },
      { code: 'GZ', name: '贵州省', region: '南方电网', grid_company: '南方电网' },
      { code: 'HN', name: '海南省', region: '南方电网', grid_company: '南方电网' },
      // 华东电网
      { code: 'ZJ', name: '浙江省', region: '华东电网', grid_company: '国家电网' },
      { code: 'JS', name: '江苏省', region: '华东电网', grid_company: '国家电网' },
      { code: 'SH', name: '上海市', region: '华东电网', grid_company: '国家电网' },
      { code: 'AH', name: '安徽省', region: '华东电网', grid_company: '国家电网' },
      { code: 'FJ', name: '福建省', region: '华东电网', grid_company: '国家电网' },
      // 华北电网
      { code: 'BJ', name: '北京市', region: '华北电网', grid_company: '国家电网' },
      { code: 'TJ', name: '天津市', region: '华北电网', grid_company: '国家电网' },
      { code: 'HE', name: '河北省', region: '华北电网', grid_company: '国家电网' },
      { code: 'SX', name: '山西省', region: '华北电网', grid_company: '国家电网' },
      { code: 'NM', name: '内蒙古自治区', region: '华北电网', grid_company: '国家电网' },
      { code: 'SD', name: '山东省', region: '华北电网', grid_company: '国家电网' },
      // 其他区域
      { code: 'HA', name: '河南省', region: '华中电网', grid_company: '国家电网' },
      { code: 'HB', name: '湖北省', region: '华中电网', grid_company: '国家电网' },
      { code: 'HN', name: '湖南省', region: '华中电网', grid_company: '国家电网' },
      { code: 'JX', name: '江西省', region: '华中电网', grid_company: '国家电网' },
      { code: 'SC', name: '四川省', region: '华中电网', grid_company: '国家电网' },
      { code: 'CQ', name: '重庆市', region: '华中电网', grid_company: '国家电网' },
      { code: 'SN', name: '陕西省', region: '西北电网', grid_company: '国家电网' },
      { code: 'GS', name: '甘肃省', region: '西北电网', grid_company: '国家电网' },
      { code: 'QH', name: '青海省', region: '西北电网', grid_company: '国家电网' },
      { code: 'NX', name: '宁夏回族自治区', region: '西北电网', grid_company: '国家电网' },
      { code: 'XJ', name: '新疆维吾尔自治区', region: '西北电网', grid_company: '国家电网' },
      { code: 'LN', name: '辽宁省', region: '东北电网', grid_company: '国家电网' },
      { code: 'JL', name: '吉林省', region: '东北电网', grid_company: '国家电网' },
      { code: 'HL', name: '黑龙江省', region: '东北电网', grid_company: '国家电网' },
    ];

    for (const province of provinces) {
      const { error } = await supabase
        .from('tariff_provinces')
        .upsert({ ...province, is_active: true }, { onConflict: 'code' });

      if (error) {
        console.error(`初始化省份 ${province.name} 失败:`, error);
      }
    }
  }
}

/**
 * 单例实例
 */
let tariffRepositoryInstance: TariffRepository | null = null;

export function getTariffRepository(): TariffRepository {
  if (!tariffRepositoryInstance) {
    tariffRepositoryInstance = new TariffRepository();
  }
  return tariffRepositoryInstance;
}

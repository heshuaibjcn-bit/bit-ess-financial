/**
 * 全国电价数据库架构 - Supabase Schema
 *
 * 电价数据表结构设计
 */

import { Database } from './supabase-schema';

/**
 * 扩展数据库架构，添加电价相关表
 */
export interface TariffDatabase extends Database {
  public: {
    Tables: Database['public']['Tables'] & {
      // 电价省份表
      tariff_provinces: {
        Row: {
          id: string;
          code: string; // 省份代码，如 'GD', 'ZJ'
          name: string; // 省份名称，如 '广东省'
          region: string; // 区域，如 '南方电网', '华东电网'
          grid_company: string; // 电网公司，如 '南方电网', '国家电网'
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          region: string;
          grid_company: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          region?: string;
          grid_company?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };

      // 电价版本表
      tariff_versions: {
        Row: {
          id: string;
          province_id: string;
          version: string; // 版本号，如 '1.0.0'
          effective_date: string; // 生效日期
          policy_number: string; // 政策文号，如 '粤发改价格〔2025〕583号'
          policy_title?: string; // 政策标题
          policy_url?: string; // 政策文件URL
          status: 'draft' | 'active' | 'expired' | 'superseded';
          notes?: string; // 备注说明
          created_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          province_id: string;
          version: string;
          effective_date: string;
          policy_number: string;
          policy_title?: string;
          policy_url?: string;
          status?: 'draft' | 'active' | 'expired' | 'superseded';
          notes?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          province_id?: string;
          version?: string;
          effective_date?: string;
          policy_number?: string;
          policy_title?: string;
          policy_url?: string;
          status?: 'draft' | 'active' | 'expired' | 'superseded';
          notes?: string;
          updated_at?: string;
        };
      };

      // 电价数据表
      tariff_data: {
        Row: {
          id: string;
          version_id: string; // 关联 tariff_versions.id
          province_id: string; // 关联 tariff_provinces.id
          voltage_level: '0.4kV' | '10kV' | '35kV' | '110kV' | '220kV';
          tariff_type: 'industrial' | 'commercial' | 'large_industrial' | 'residential' | 'agricultural';

          // 价格数据
          peak_price: number; // 峰时电价
          valley_price: number; // 谷时电价
          flat_price: number; // 平时电价
          avg_price: number; // 平均电价

          // 电费单组成（JSON）
          bill_components: {
            energyFee: {
              peak: number;
              valley: number;
              flat: number;
            };
            basicFee?: {
              type: 'capacity' | 'demand';
              price: number;
              description: string;
            };
            powerFactorAdjustment?: {
              standard: number;
              rate: number;
            };
            governmentSurcharges: {
              renewableEnergy: number;
              reservoirFund: number;
              ruralGridRepayment: number;
              total: number;
            };
          };

          // 季节性调整（可选）
          seasonal_adjustments?: {
            season: 'summer' | 'winter' | 'transitional';
            multiplier: number;
            description?: string;
          }[];

          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version_id?: string;
          province_id?: string;
          voltage_level?: '0.4kV' | '10kV' | '35kV' | '110kV' | '220kV';
          tariff_type?: 'industrial' | 'commercial' | 'large_industrial' | 'residential' | 'agricultural';
          peak_price?: number;
          valley_price?: number;
          flat_price?: number;
          avg_price?: number;
          bill_components?: any;
          seasonal_adjustments?: any[];
          updated_at?: string;
        };
      };

      // 时间段配置表
      tariff_time_periods: {
        Row: {
          id: string;
          version_id: string; // 关联 tariff_versions.id
          province_id: string; // 关联 tariff_provinces.id

          // 峰谷平时段配置
          peak_hours: number[]; // 峰时段小时数 [8, 9, 10, 11, ...]
          valley_hours: number[]; // 谷时段小时数
          flat_hours: number[]; // 平时段小时数

          // 描述信息
          peak_description?: string;
          valley_description?: string;
          flat_description?: string;

          // 季节性时段调整（可选）
          seasonal_periods?: {
            season: 'summer' | 'winter';
            peak_hours?: number[];
            valley_hours?: number[];
            flat_hours?: number[];
          }[];

          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version_id: string;
          province_id: string;
          peak_hours: number[];
          valley_hours: number[];
          flat_hours: number[];
          peak_description?: string;
          valley_description?: string;
          flat_description?: string;
          seasonal_periods?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version_id?: string;
          province_id?: string;
          peak_hours?: number[];
          valley_hours?: number[];
          flat_hours?: number[];
          peak_description?: string;
          valley_description?: string;
          flat_description?: string;
          seasonal_periods?: any[];
          updated_at?: string;
        };
      };

      // 电价更新日志表
      tariff_update_logs: {
        Row: {
          id: string;
          province_id: string;
          version_id: string;

          // 更新信息
          update_type: 'create' | 'update' | 'expire' | 'supersede';
          trigger_type: 'manual' | 'agent' | 'api' | 'scheduled';

          // 变更摘要
          changes_summary: {
            previous_version?: string;
            new_version: string;
            fields_changed: string[];
            price_changes: {
              voltage_level: string;
              field: string;
              old_value: number;
              new_value: number;
              change_percent: number;
            }[];
          };

          // 智能体信息（如果由智能体触发）
          agent_info?: {
            agent_name: string;
            agent_version: string;
            confidence: number;
            source_urls: string[];
            parse_duration_ms: number;
          };

          // 状态
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'rollback';

          // 验证信息
          validation_result?: {
            is_valid: boolean;
            errors: string[];
            warnings: string[];
          };

          // 审批信息
          requires_approval: boolean;
          approved_by?: string;
          approved_at?: string;
          rejection_reason?: string;

          // 元数据
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          province_id: string;
          version_id: string;
          update_type: 'create' | 'update' | 'expire' | 'supersede';
          trigger_type: 'manual' | 'agent' | 'api' | 'scheduled';
          changes_summary: any;
          agent_info?: any;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'rollback';
          validation_result?: any;
          requires_approval: boolean;
          approved_by?: string;
          approved_at?: string;
          rejection_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          province_id?: string;
          version_id?: string;
          update_type?: 'create' | 'update' | 'expire' | 'supersede';
          trigger_type?: 'manual' | 'agent' | 'api' | 'scheduled';
          changes_summary?: any;
          agent_info?: any;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'rollback';
          validation_result?: any;
          requires_approval?: boolean;
          approved_by?: string;
          approved_at?: string;
          rejection_reason?: string;
          updated_at?: string;
        };
      };

      // 电价通知订阅表
      tariff_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          province_ids: string[]; // 关注的省份ID列表
          voltage_levels: string[]; // 关注的电压等级
          notification_types: ('price_change' | 'new_policy' | 'version_update')[];
          threshold_percent?: number; // 变化阈值（百分比）
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          province_ids: string[];
          voltage_levels: string[];
          notification_types: ('price_change' | 'new_policy' | 'version_update')[];
          threshold_percent?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          province_ids?: string[];
          voltage_levels?: string[];
          notification_types?: ('price_change' | 'new_policy' | 'version_update')[];
          threshold_percent?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}

/**
 * 电价数据查询视图
 */
export interface TariffViews {
  // 当前生效电价视图
  active_tariffs_view: {
    Row: {
      province_code: string;
      province_name: string;
      version: string;
      effective_date: string;
      policy_number: string;
      voltage_level: string;
      tariff_type: string;
      peak_price: number;
      valley_price: number;
      flat_price: number;
      avg_price: number;
      peak_valley_spread: number; // 峰谷价差
    };
  };

  // 电价变化历史视图
  tariff_change_history_view: {
    Row: {
      province_name: string;
      change_date: string;
      old_version: string;
      new_version: string;
      voltage_level: string;
      price_field: string;
      old_value: number;
      new_value: number;
      change_percent: number;
      update_type: string;
    };
  };
}

/**
 * 电价相关函数
 */
export interface TariffFunctions {
  // 获取省份当前生效电价
  get_active_tariff: {
    Args: {
      province_code: string;
      voltage_level: string;
    };
    Returns: TariffDatabase['public']['Tables']['tariff_data']['Row'];
  };

  // 比较两个版本电价差异
  compare_tariff_versions: {
    Args: {
      version_id_1: string;
      version_id_2: string;
    };
    Returns: {
      province_id: string;
      changes: Array<{
        voltage_level: string;
        field: string;
        old_value: number;
        new_value: number;
        change_percent: number;
      }>;
    };
  };

  // 批量导入电价数据
  import_tariff_data: {
    Args: {
      data: any[];
      created_by: string;
    };
    Returns: {
      success: boolean;
      imported: number;
      failed: number;
      errors: string[];
    };
  };

  // 智能体创建电价更新
  agent_create_tariff_update: {
    Args: {
      province_code: string;
      parsed_data: any;
      agent_info: any;
    };
    Returns: {
      success: boolean;
      version_id: string;
      requires_approval: boolean;
      validation_result: any;
    };
  };
}

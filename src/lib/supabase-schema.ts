/**
 * Supabase Database Schema Types
 *
 * This file defines TypeScript types for the Supabase database schema.
 * Generate types from your Supabase project using:
 * `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase-schema.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer' | 'guest'
          avatar_url?: string | null
          mfa_enabled: boolean
          mfa_secret?: string | null
          failed_login_attempts: number
          is_locked: boolean
          lock_until?: string | null
          requires_password_change: boolean
          last_login_at?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer' | 'guest'
          avatar_url?: string | null
          mfa_enabled?: boolean
          mfa_secret?: string | null
          failed_login_attempts?: number
          is_locked?: boolean
          lock_until?: string | null
          requires_password_change?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer' | 'guest'
          avatar_url?: string | null
          mfa_enabled?: boolean
          mfa_secret?: string | null
          failed_login_attempts?: number
          is_locked?: boolean
          lock_until?: string | null
          requires_password_change?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description?: string | null
          province: string
          capacity: number
          investment: number
          electricity_price: number
          peak_price: number
          valley_price: number
          discharge_cycles_per_day: number
          daily_charge_hours: number
          system_efficiency: number
          battery_unit_cost: number
          pcs_unit_cost: number
          bms_unit_cost: number
          ems_unit_cost: number
          installation_cost_per_watt: number
          annual_om_cost_percent: number
          electricity_price_increase_rate: number
          battery_annual_degradation_rate: number
          benchmark_irr?: number | null
          benchmark_npv?: number | null
          benchmark_payback_period?: number | null
          calculated_irr: number
          calculated_npv: number
          calculated_payback_period: number
          calculated_lcoe: number
          is_demo: boolean
          created_at: string
          updated_at: string
          last_calculated_at?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          province: string
          capacity: number
          investment: number
          electricity_price: number
          peak_price: number
          valley_price: number
          discharge_cycles_per_day: number
          daily_charge_hours: number
          system_efficiency: number
          battery_unit_cost: number
          pcs_unit_cost: number
          bms_unit_cost: number
          ems_unit_cost: number
          installation_cost_per_watt: number
          annual_om_cost_percent: number
          electricity_price_increase_rate: number
          battery_annual_degradation_rate: number
          benchmark_irr?: number | null
          benchmark_npv?: number | null
          benchmark_payback_period?: number | null
          calculated_irr?: number
          calculated_npv?: number
          calculated_payback_period?: number
          calculated_lcoe?: number
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          last_calculated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          province?: string
          capacity?: number
          investment?: number
          electricity_price?: number
          peak_price?: number
          valley_price?: number
          discharge_cycles_per_day?: number
          daily_charge_hours?: number
          system_efficiency?: number
          battery_unit_cost?: number
          pcs_unit_cost?: number
          bms_unit_cost?: number
          ems_unit_cost?: number
          installation_cost_per_watt?: number
          annual_om_cost_percent?: number
          electricity_price_increase_rate?: number
          battery_annual_degradation_rate?: number
          benchmark_irr?: number | null
          benchmark_npv?: number | null
          benchmark_payback_period?: number | null
          calculated_irr?: number
          calculated_npv?: number
          calculated_payback_period?: number
          calculated_lcoe?: number
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          last_calculated_at?: string | null
        }
      }
      calculations: {
        Row: {
          id: string
          project_id: string
          user_id: string
          input_data: Json
          result_data: Json
          benchmark_comparison?: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          input_data: Json
          result_data: Json
          benchmark_comparison?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          input_data?: Json
          result_data?: Json
          benchmark_comparison?: Json | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          project_id: string
          user_id: string
          type: 'financial' | 'technical' | 'benchmark' | 'custom'
          format: 'pdf' | 'excel' | 'json'
          title: string
          description?: string | null
          file_path?: string | null
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          type: 'financial' | 'technical' | 'benchmark' | 'custom'
          format: 'pdf' | 'excel' | 'json'
          title: string
          description?: string | null
          file_path?: string | null
          data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          type?: 'financial' | 'technical' | 'benchmark' | 'custom'
          format?: 'pdf' | 'excel' | 'json'
          title?: string
          description?: string | null
          file_path?: string | null
          data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          timestamp: string
          user_id: string
          user_role: string
          action: string
          resource: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success: boolean
          error_message?: string | null
        }
        Insert: {
          id?: string
          timestamp?: string
          user_id: string
          user_role: string
          action: string
          resource: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          error_message?: string | null
        }
        Update: {
          id?: string
          timestamp?: string
          user_id?: string
          user_role?: string
          action?: string
          resource?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          error_message?: string | null
        }
      }
      security_events: {
        Row: {
          id: string
          type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'configuration' | 'data_export' | 'system'
          severity: 'low' | 'medium' | 'high' | 'critical'
          timestamp: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          description: string
          details?: Json | null
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'configuration' | 'data_export' | 'system'
          severity: 'low' | 'medium' | 'high' | 'critical'
          timestamp?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          description: string
          details?: Json | null
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'configuration' | 'data_export' | 'system'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          timestamp?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          description?: string
          details?: Json | null
          resolved?: boolean
          created_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          project_id: string
          shared_by_user_id: string
          shared_to_user_id?: string | null
          share_token?: string | null
          permission: 'view' | 'edit' | 'admin'
          expires_at?: string | null
          access_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          shared_by_user_id: string
          shared_to_user_id?: string | null
          share_token?: string | null
          permission: 'view' | 'edit' | 'admin'
          expires_at?: string | null
          access_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          shared_by_user_id?: string
          shared_to_user_id?: string | null
          share_token?: string | null
          permission?: 'view' | 'edit' | 'admin'
          expires_at?: string | null
          access_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer' | 'guest'
      report_type: 'financial' | 'technical' | 'benchmark' | 'custom'
      report_format: 'pdf' | 'excel' | 'json'
      share_permission: 'view' | 'edit' | 'admin'
      security_event_type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'configuration' | 'data_export' | 'system'
      security_severity: 'low' | 'medium' | 'high' | 'critical'
    }
  }
}
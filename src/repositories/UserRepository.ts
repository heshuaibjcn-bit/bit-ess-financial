/**
 * User Repository
 *
 * Handles all user-related database operations
 */

import { BaseRepository } from './BaseRepository';
import { supabase, getCurrentUser } from '../lib/supabase';
import { Database } from '../lib/supabase-schema';
import { UserRole } from '../services/security/RBAC';

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * Extended user data
 */
export interface UserWithStats extends UserRow {
  project_count?: number;
  total_investment?: number;
  last_calculation_at?: string;
}

/**
 * User repository
 */
export class UserRepository extends BaseRepository<'users'> {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserRow | null> {
    return this.findOne({ email });
  }

  /**
   * Find user by auth ID
   */
  async findByAuthId(authId: string): Promise<UserRow | null> {
    return this.findById(authId);
  }

  /**
   * Get user with statistics
   */
  async getWithStats(userId: string): Promise<UserWithStats | null> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        projects!projects_user_id_fkey(
          count,
          investment
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const projects = (data as any).projects || [];
    const projectCount = projects.length;
    const totalInvestment = projects.reduce((sum: number, p: any) => sum + (p.investment || 0), 0);

    return {
      ...data,
      project_count: projectCount,
      total_investment: totalInvestment,
    };
  }

  /**
   * Create user from auth data
   */
  async createFromAuth(authData: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  }): Promise<UserRow> {
    const userData: UserInsert = {
      id: authData.id,
      email: authData.email,
      name: authData.name || authData.email.split('@')[0],
      avatar_url: authData.avatar_url,
      role: 'user',
      mfa_enabled: false,
      failed_login_attempts: 0,
      is_locked: false,
      requires_password_change: false,
    };

    return this.create(userData);
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, role: UserRole): Promise<UserRow> {
    return this.update(userId, { role });
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId: string): Promise<UserRow> {
    return this.update(userId, {
      last_login_at: new Date().toISOString(),
    });
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedAttempts(userId: string): Promise<UserRow> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const failedAttempts = user.failed_login_attempts + 1;
    const updateData: UserUpdate = {
      failed_login_attempts: failedAttempts,
    };

    // Lock account if too many failed attempts
    if (failedAttempts >= 5) {
      updateData.is_locked = true;
      updateData.lock_until = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
    }

    return this.update(userId, updateData);
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedAttempts(userId: string): Promise<UserRow> {
    return this.update(userId, {
      failed_login_attempts: 0,
      is_locked: false,
      lock_until: null,
    });
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }

    if (user.is_locked && user.lock_until) {
      // Check if lock has expired
      const lockUntil = new Date(user.lock_until);
      if (lockUntil > new Date()) {
        return true;
      } else {
        // Lock expired, reset
        await this.update(userId, {
          is_locked: false,
          lock_until: null,
        });
        return false;
      }
    }

    return user.is_locked;
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string, secret: string): Promise<UserRow> {
    return this.update(userId, {
      mfa_enabled: true,
      mfa_secret: secret,
    });
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<UserRow> {
    return this.update(userId, {
      mfa_enabled: false,
      mfa_secret: null,
    });
  }

  /**
   * Require password change
   */
  async requirePasswordChange(userId: string): Promise<UserRow> {
    return this.update(userId, {
      requires_password_change: true,
    });
  }

  /**
   * Mark password as changed
   */
  async passwordChanged(userId: string): Promise<UserRow> {
    return this.update(userId, {
      requires_password_change: false,
    });
  }

  /**
   * Get all users by role
   */
  async findByRole(role: UserRole): Promise<UserRow[]> {
    return this.findMany({ role });
  }

  /**
   * Search users
   */
  async search(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<UserRow[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const searchQuery = supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (options?.limit) {
      searchQuery.limit(options.limit);
    }

    if (options?.offset) {
      searchQuery.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await searchQuery;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get or create user from auth
   */
  async getOrCreateFromAuth(authData: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  }): Promise<UserRow> {
    try {
      // Try to find existing user
      const existing = await this.findById(authData.id);
      if (existing) {
        return existing;
      }
    } catch (error) {
      // User doesn't exist, create new
    }

    return this.createFromAuth(authData);
  }

  /**
   * Sync auth user to database
   */
  async syncAuthUser(): Promise<UserRow | null> {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return null;
    }

    const userMetadata = authUser.user_metadata || {};
    return this.getOrCreateFromAuth({
      id: authUser.id,
      email: authUser.email || '',
      name: userMetadata.name || userMetadata.full_name,
      avatar_url: userMetadata.avatar_url,
    });
  }
}

/**
 * Global user repository instance
 */
export const userRepository = new UserRepository();
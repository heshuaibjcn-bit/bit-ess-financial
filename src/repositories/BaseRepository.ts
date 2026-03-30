/**
 * Base Repository Class
 *
 * Provides common database operations for all repositories
 */

import { supabase, db } from '../lib/supabase';
import { Database } from '../lib/supabase-schema';

export type TableName = keyof Database['public']['Tables'];

export interface RepositoryOptions {
  select?: string;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

/**
 * Base repository with common CRUD operations
 */
export class BaseRepository<T extends TableName> {
  constructor(protected tableName: T) {}

  /**
   * Find all records
   */
  async findAll(options?: RepositoryOptions) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    let query = supabase
      .from(this.tableName)
      .select(options?.select || '*');

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Find one record by ID
   */
  async findById(id: string, options?: RepositoryOptions) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select(options?.select || '*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Find records matching filter
   */
  async findMany(filter: object, options?: RepositoryOptions) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    let query = supabase
      .from(this.tableName)
      .select(options?.select || '*');

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Find one record matching filter
   */
  async findOne(filter: object, options?: RepositoryOptions) {
    const records = await this.findMany(filter, {
      ...options,
      limit: 1,
    });

    return records?.[0] || null;
  }

  /**
   * Create a new record
   */
  async create(data: Database['public']['Tables'][T]['Insert']) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }

  /**
   * Create multiple records
   */
  async createMany(data: Database['public']['Tables'][T]['Insert'][]) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select();

    if (error) {
      throw error;
    }

    return result;
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<Database['public']['Tables'][T]['Update']>) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }

  /**
   * Update records matching filter
   */
  async updateMany(
    filter: object,
    data: Partial<Database['public']['Tables'][T]['Update']>
  ) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    let query = supabase
      .from(this.tableName)
      .update(data);

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select();

    if (error) {
      throw error;
    }

    return result;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Delete records matching filter
   */
  async deleteMany(filter: object) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    let query = supabase
      .from(this.tableName)
      .delete();

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Count records matching filter
   */
  async count(filter?: object): Promise<number> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(filter: object): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }

  /**
   * Upsert record (insert or update)
   */
  async upsert(data: Database['public']['Tables'][T]['Insert']) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data: result, error } = await supabase
      .from(this.tableName)
      .upsert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }
}
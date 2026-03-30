/**
 * Supabase Database Integration
 *
 * Real-time database with:
 * - PostgreSQL backend
 * - Real-time subscriptions
 * - Row-level security (RLS)
 * - Authentication integration
 * - File storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase-schema';

/**
 * Supabase configuration
 */
const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  // In production, use service role key for admin operations
  serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

/**
 * Validate Supabase configuration
 */
function validateConfig(): boolean {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.warn('Supabase configuration missing. Database features will be disabled.');
    return false;
  }
  return true;
}

/**
 * Create Supabase client with default configuration
 */
export function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!validateConfig()) {
    return null;
  }

  return createClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      db: {
        schema: 'public',
      },
    }
  );
}

/**
 * Global Supabase client instance
 */
export const supabase = createSupabaseClient();

/**
 * Supabase admin client (for server-side operations)
 * WARNING: Only use this in secure contexts!
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> | null {
  if (!supabaseConfig.serviceRoleKey) {
    console.warn('Supabase service role key not configured.');
    return null;
  }

  return createClient<Database>(
    supabaseConfig.url,
    supabaseConfig.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return data.session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return data.user;
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in user
 */
export async function signIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out user
 */
export async function signOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}

/**
 * Real-time subscription manager
 */
export class RealtimeSubscription {
  private channel: ReturnType<SupabaseClient<Database>['channel']> | null = null;
  private subscriptions: Map<string, (payload: any) => void> = new Map();

  constructor(private tableName: string) {
    if (supabase) {
      this.channel = supabase.channel(`table-db-changes-${tableName}`);
    }
  }

  /**
   * Subscribe to INSERT events
   */
  onInsert(callback: (payload: any) => void): this {
    if (this.channel) {
      const eventType = 'INSERT';
      this.subscriptions.set(eventType, callback);
      this.channel.on(
        'postgres_changes',
        {
          event: eventType,
          schema: 'public',
          table: this.tableName,
        },
        callback
      );
    }
    return this;
  }

  /**
   * Subscribe to UPDATE events
   */
  onUpdate(callback: (payload: any) => void): this {
    if (this.channel) {
      const eventType = 'UPDATE';
      this.subscriptions.set(eventType, callback);
      this.channel.on(
        'postgres_changes',
        {
          event: eventType,
          schema: 'public',
          table: this.tableName,
        },
        callback
      );
    }
    return this;
  }

  /**
   * Subscribe to DELETE events
   */
  onDelete(callback: (payload: any) => void): this {
    if (this.channel) {
      const eventType = 'DELETE';
      this.subscriptions.set(eventType, callback);
      this.channel.on(
        'postgres_changes',
        {
          event: eventType,
          schema: 'public',
          table: this.tableName,
        },
        callback
      );
    }
    return this;
  }

  /**
   * Subscribe to all events
   */
  onAll(callback: (payload: any) => void): this {
    this.onInsert(callback);
    this.onUpdate(callback);
    this.onDelete(callback);
    return this;
  }

  /**
   * Subscribe with filter
   */
  onFilter(filter: object, callback: (payload: any) => void): this {
    if (this.channel) {
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          filter,
        },
        callback
      );
    }
    return this;
  }

  /**
   * Start subscription
   */
  async subscribe(): Promise<void> {
    if (this.channel) {
      const { error } = await this.channel.subscribe();
      if (error) {
        console.error('Subscription error:', error);
        throw error;
      }
    }
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribe(): void {
    if (this.channel) {
      this.subscriptions.clear();
      supabase?.removeChannel(this.channel);
    }
  }
}

/**
 * Create a real-time subscription
 */
export function createRealtimeSubscription(tableName: string): RealtimeSubscription {
  return new RealtimeSubscription(tableName);
}

/**
 * File storage operations
 */
export const storage = {
  /**
   * Upload file
   */
  async upload(bucket: string, path: string, file: File): Promise<string | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    return data.path;
  },

  /**
   * Get public URL
   */
  getPublicUrl(bucket: string, path: string): string | null {
    if (!supabase) return null;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Delete file
   */
  async delete(bucket: string, paths: string[]): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    return !error;
  },

  /**
   * List files
   */
  async list(bucket: string, path?: string): Promise<any[] | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      console.error('List error:', error);
      return null;
    }

    return data;
  },
};

/**
 * Database helper functions
 */
export const db = {
  /**
   * Select records
   */
  async select<T>(
    table: keyof Database['public']['Tables'],
    columns?: string
  ) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };

    let query = supabase.from(table).select(columns || '*');
    return query;
  },

  /**
   * Insert record
   */
  async insert<T>(
    table: keyof Database['public']['Tables'],
    data: T
  ) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };

    return supabase.from(table).insert(data);
  },

  /**
   * Update record
   */
  async update<T>(
    table: keyof Database['public']['Tables'],
    data: T,
    filter: object
  ) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };

    return supabase.from(table).update(data).match(filter);
  },

  /**
   * Delete record
   */
  async delete(
    table: keyof Database['public']['Tables'],
    filter: object
  ) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };

    return supabase.from(table).delete().match(filter);
  },

  /**
   * RPC call
   */
  async rpc<T>(
    functionName: string,
    params?: object
  ) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };

    return supabase.rpc(functionName, params);
  },
};
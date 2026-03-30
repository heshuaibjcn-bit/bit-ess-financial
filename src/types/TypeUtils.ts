/**
 * Enhanced Type Utilities
 *
 * Advanced TypeScript utilities for better type safety and runtime validation
 */

import { z } from 'zod';

/**
 * Branded types for type safety
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Create a branded type
 */
export function brand<T, B>(value: T, _brand: B): Brand<T, B> {
  return value as Brand<T, B>;
}

/**
 * Common branded types
 */
export type UserId = Brand<string, 'UserId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type Email = Brand<string, 'Email'>;
export type PositiveNumber = Brand<number, 'PositiveNumber'>;
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Type guards
 */
export function isUserId(value: string): value is UserId {
  return typeof value === 'string' && value.length > 0;
}

export function isProjectId(value: string): value is ProjectId {
  return typeof value === 'string' && value.length > 0;
}

export function isEmail(value: string): value is Email {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPositiveNumber(value: number): value is PositiveNumber {
  return typeof value === 'number' && value > 0;
}

export function isPercentage(value: number): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Result type for error handling
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Unwrap result or throw
 */
export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Option type for nullable values
 */
export type Option<T> = Some<T> | None;

interface Some<T> {
  _type: 'some';
  value: T;
}

interface None {
  _type: 'none';
}

/**
 * Create a some option
 */
export function some<T>(value: T): Option<T> {
  return { _type: 'some', value };
}

/**
 * Create a none option
 */
export const none: Option<never> = { _type: 'none' };

/**
 * Check if option is some
 */
export function isSome<T>(option: Option<T>): option is Some<T> {
  return option._type === 'some';
}

/**
 * Check if option is none
 */
export function isNone<T>(option: Option<T>): option is None {
  return option._type === 'none';
}

/**
 * Get option value or default
 */
export function getOptionValue<T>(option: Option<T>, defaultValue: T): T {
  return isSome(option) ? option.value : defaultValue;
}

/**
 * Schema validator with runtime type checking
 */
export class SchemaValidator<T> {
  constructor(private schema: z.ZodSchema<T>) {}

  /**
   * Validate data against schema
   */
  validate(data: unknown): Result<T, z.ZodError> {
    const result = this.schema.safeParse(data);
    return result.success ? ok(result.data) : err(result.error);
  }

  /**
   * Validate data or throw
   */
  validateOrThrow(data: unknown): T {
    return unwrapResult(this.validate(data));
  }

  /**
   * Validate async data
   */
  async validateAsync(data: unknown): AsyncResult<T, z.ZodError> {
    const result = await this.schema.safeParseAsync(data);
    return result.success ? ok(result.data) : err(result.error);
  }

  /**
   * Partial validation
   */
  validatePartial(data: unknown): Result<Partial<T>, z.ZodError> {
    const partialSchema = this.schema.partial();
    const result = partialSchema.safeParse(data);
    return result.success ? ok(result.data) : err(result.error);
  }

  /**
   * Create validator with refinements
   */
  withRefinement<U extends T>(
    refinement: (data: T) => data is U,
    message: string
  ): SchemaValidator<U> {
    const refinedSchema = this.schema.refine(refinement, { message });
    return new SchemaValidator(refinedSchema as z.ZodSchema<U>);
  }
}

/**
 * Create schema validator
 */
export function createValidator<T>(schema: z.ZodSchema<T>): SchemaValidator<T> {
  return new SchemaValidator(schema);
}

/**
 * Type-safe enum
 */
export function createEnum<T extends Record<string, string | number>>(values: T): T {
  return values;
}

/**
 * Type-safe record
 */
export function createRecord<K extends PropertyKey, V>(entries: [K, V][]): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep required type
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Deep nullable type
 */
export type DeepNullable<T> = {
  [P in keyof T]: T[P] extends object ? DeepNullable<T[P]> : T[P] | null;
};

/**
 * Pick by value type
 */
export type PickByValueType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

/**
 * Omit by value type
 */
export type OmitByValueType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

/**
 * Make required properties nullable
 */
export type NullableRequired<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Extract promise type
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : never;

/**
 * Extract array type
 */
export type ArrayType<T> = T extends (infer U)[] ? U : never;

/**
 * Extract function parameters
 */
export type Parameters<T> = T extends (...args: infer P) => any ? P : never;

/**
 * Extract function return type
 */
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

/**
 * Union to intersection
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

/**
 * Tuple type
 */
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [...R, T]>;

/**
* Reverse tuple
*/
export type Reverse<T extends any[]> = T extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : [];

/**
* Flatten nested array
*/
export type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends any[]
    ? [...Flatten<First>, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : [];

/**
* Path type for nested object access
*/
export type Path<T> = T extends object
  ? {
      [P in keyof T]: P extends string | number
        ? T[P] extends object
          ? P | `${P}.${Path<T[P]>}`
          : P
        : never;
    }[keyof T]
  : never;

/**
* Path value type
*/
export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest & Path<T[K]>>
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
* Safe nested object access
*/
export function get<T, P extends Path<T>>(obj: T, path: P): PathValue<T, P> {
  const keys = (path as string).split('.');
  let result: any = obj;

  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) {
      return result as PathValue<T, P>;
    }
  }

  return result as PathValue<T, P>;
}

/**
* Runtime type checking utilities
*/
export const TypeUtils = {
  isObject: (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  isArray: (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  },

  isString: (value: unknown): value is string => {
    return typeof value === 'string';
  },

  isNumber: (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value);
  },

  isBoolean: (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  },

  isNull: (value: unknown): value is null => {
    return value === null;
  },

  isUndefined: (value: unknown): value is undefined => {
    return value === undefined;
  },

  isFunction: (value: unknown): value is Function => {
    return typeof value === 'function';
  },

  isDate: (value: unknown): value is Date => {
    return value instanceof Date && !isNaN(value.getTime());
  },

  isEmpty: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  deepClone: <T>(value: T): T => {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (value instanceof Date) {
      return new Date(value.getTime()) as T;
    }

    if (Array.isArray(value)) {
      return value.map(item => TypeUtils.deepClone(item)) as T;
    }

    const cloned = {} as T;
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        cloned[key] = TypeUtils.deepClone(value[key]);
      }
    }

    return cloned;
  },

  deepMerge: <T extends object>(target: T, ...sources: Partial<T>[]): T => {
    if (!sources.length) return target;

    const source = sources.shift();
    if (!source) return target;

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (TypeUtils.isObject(targetValue) && TypeUtils.isObject(sourceValue)) {
          target[key] = TypeUtils.deepMerge(targetValue, sourceValue);
        } else {
          target[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }

    return TypeUtils.deepMerge(target, ...sources);
  },

  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },

  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },
};

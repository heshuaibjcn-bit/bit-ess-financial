/**
 * Domain Layer Index
 *
 * Central export point for all domain layer interfaces, models, and services.
 * This provides a clean API for the application layer to interact with.
 */

// Models
export * from './models';

// Schemas
export * from './schemas/ProjectSchema';
export * from './schemas/ProvinceSchema';

// Repository interfaces
export * from './repositories/interfaces';

// Service interfaces
export * from './services/interfaces';

// Service implementations (singleton instances)
export { provinceDataRepository } from './repositories/ProvinceDataRepository';
export { BenchmarkEngine } from './services/BenchmarkEngine';
export { SensitivityAnalyzer } from './services/SensitivityAnalyzer';
export { ScenarioBuilder } from './services/ScenarioBuilder';

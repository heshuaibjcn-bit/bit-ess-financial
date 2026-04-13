import { describe, it, expect } from 'vitest';
import { ProjectInputSchemaRefined, ProjectInputSchema } from '@/domain/schemas/ProjectSchema';

describe('ProjectSchema', () => {
  describe('Province validation', () => {
    it('should accept valid provinces', () => {
      const result = ProjectInputSchema.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 2.0, duration: 4 },
        costs: {
          batteryCostPerKwh: 500,
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          depthOfDischarge: 0.85,
          cyclesPerDay: 2,
          degradationRate: 0.02,
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid province', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'invalid-province' as any,
        systemSize: { capacity: 2000, power: 500 },
        costs: {
          battery: 0.5,
          pcs: 0.15,
          bms: 0.05,
          ems: 0.03,
          thermalManagement: 0.04,
          fireProtection: 0.02,
          container: 0.03,
          installation: 0.08,
          other: 0.02,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          dod: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.02,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('无效');
      }
    });
  });

  describe('System size validation', () => {
    it('should reject capacity > 100 MW', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 150, duration: 4 }, // > 100 MW
        costs: {
          batteryCostPerKwh: 500,
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          depthOfDischarge: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.02,
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('不能超过100');
      }
    });

    it('should reject negative capacity', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: -100, power: 500 },
        costs: {
          battery: 0.5,
          pcs: 0.15,
          bms: 0.05,
          ems: 0.03,
          thermalManagement: 0.04,
          fireProtection: 0.02,
          container: 0.03,
          installation: 0.08,
          other: 0.02,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          dod: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.02,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('系统容量必须大于0');
      }
    });
  });

  describe('Cost validation', () => {
    it('should reject battery cost > 5000 ¥/kWh', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 2.0, duration: 4 },
        costs: {
          batteryCostPerKwh: 10000, // Too high (> 5000)
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          depthOfDischarge: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.02,
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('电池单价似乎过高');
      }
    });
  });

  describe('Operating params validation', () => {
    it('should reject system efficiency > 100%', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 2.0, duration: 4 },
        costs: {
          batteryCostPerKwh: 500,
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        operatingParams: {
          systemEfficiency: 1.5, // > 100%
          depthOfDischarge: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.02,
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('系统效率不能超过100');
      }
    });

    it('should reject DOD > system efficiency', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 2.0, duration: 4 },
        costs: {
          batteryCostPerKwh: 500,
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        operatingParams: {
          systemEfficiency: 0.85,
          depthOfDischarge: 0.95, // > efficiency
          cyclesPerDay: 2,
          degradationRate: 0.02,
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('项目配置');
      }
    });

    it('should reject degradation rate > 10%', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 2.0, duration: 4 },
        costs: {
          batteryCostPerKwh: 500,
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          depthOfDischarge: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.15, // > 10%
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('衰减');
      }
    });
  });

  describe('Financing validation', () => {
    it('should reject loan ratio > 90%', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 2.0, duration: 4 },
        costs: {
          batteryCostPerKwh: 500,
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        financing: {
          hasLoan: true,
          equityRatio: 0.05,
          loanRatio: 0.95, // > 90%
          interestRate: 0.045,
          loanTerm: 10,
          taxHolidayYears: 6,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          depthOfDischarge: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.02,
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('贷款比例');
      }
    });

    it('should reject interest rate > 20%', () => {
      const result = ProjectInputSchemaRefined.safeParse({
        province: 'guangdong',
        systemSize: { capacity: 2.0, duration: 4 },
        costs: {
          batteryCostPerKwh: 500,
          pcsCostPerKw: 150,
          emsCost: 60000,
          installationCostPerKw: 160,
          gridConnectionCost: 0,
          landCost: 0,
          developmentCost: 0,
          permittingCost: 0,
          contingencyPercent: 0,
        },
        financing: {
          hasLoan: true,
          equityRatio: 0.4,
          loanRatio: 0.6,
          interestRate: 0.25, // > 20%
          loanTerm: 10,
          taxHolidayYears: 6,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          depthOfDischarge: 0.9,
          cyclesPerDay: 2,
          degradationRate: 0.02,
          availabilityPercent: 0.97,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('利率');
      }
    });
  });
});

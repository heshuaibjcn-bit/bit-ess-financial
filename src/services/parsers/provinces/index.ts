/**
 * 省份电价解析器统一导出
 * 
 * 导入此文件会自动注册所有省份解析器
 */

// 导入基类和注册中心
export {
  BaseProvinceParser,
  parserRegistry,
  getParserRegistry,
  type IProvinceTariffParser,
  type TimePeriodConfig,
  type SeasonalPeriod,
} from '../ProvinceParserRegistry';

// 导入并注册各省份解析器（导入即注册）
import './GuangdongParser';
import './ZhejiangParser';
import './JiangsuParser';
import './ShanghaiParser';
import './HunanParser';
import './HubeiParser';
import './SichuanParser';
import './AnhuiParser';
import './FujianParser';

// 导出便捷函数
import { parserRegistry } from '../ProvinceParserRegistry';

/**
 * 获取指定省份的解析器
 */
export function getProvinceParser(provinceCode: string) {
  return parserRegistry.getParser(provinceCode);
}

/**
 * 获取所有已注册的解析器
 */
export function getAllProvinceParsers() {
  return parserRegistry.getAllParsers();
}

/**
 * 获取所有已注册的省份代码
 */
export function getRegisteredProvinces() {
  return parserRegistry.getRegisteredProvinces();
}

/**
 * 根据内容自动选择合适的解析器
 */
export function findParserForContent(text: string, metadata: any) {
  return parserRegistry.findParserForContent(text, metadata);
}

/**
 * 检查是否已注册指定省份的解析器
 */
export function hasProvinceParser(provinceCode: string) {
  return parserRegistry.hasParser(provinceCode);
}

// 省份代码到名称的映射
export const PROVINCE_CODE_MAP: Record<string, string> = {
  GD: '广东省',
  ZJ: '浙江省',
  JS: '江苏省',
  SH: '上海市',
  HN: '湖南省',
  HB: '湖北省',
  SC: '四川省',
  AH: '安徽省',
  FJ: '福建省',
  BJ: '北京市',
  TJ: '天津市',
  HE: '河北省',
  SX: '山西省',
  NM: '内蒙古自治区',
  LN: '辽宁省',
  JL: '吉林省',
  HL: '黑龙江省',
  JX: '江西省',
  HA: '河南省',
  GX: '广西壮族自治区',
  HI: '海南省',
  CQ: '重庆市',
  GZ: '贵州省',
  YN: '云南省',
  SN: '陕西省',
  GS: '甘肃省',
  QH: '青海省',
  NX: '宁夏回族自治区',
  XJ: '新疆维吾尔自治区',
  XZ: '西藏自治区',
};

/**
 * 根据省份代码获取省份名称
 */
export function getProvinceNameByCode(code: string): string {
  return PROVINCE_CODE_MAP[code] || code;
}

/**
 * 前端使用后端API的示例代码
 *
 * 将此代码复制到你的前端项目中使用
 */

// ============= 配置 =============

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ============= 类型定义 =============

interface TariffApiResponse {
  success: boolean;
  province: string;
  data?: ParsedTariffData;
  error?: string;
  crawledAt?: string;
}

interface ParsedTariffData {
  policyNumber: string;
  policyTitle: string;
  effectiveDate: string;
  tariffs: Array<{
    voltageLevel: string;
    tariffType: string;
    peakPrice: number;
    valleyPrice: number;
    flatPrice: number;
  }>;
  timePeriods: {
    peakHours: number[];
    valleyHours: number[];
    flatHours: number[];
    peakDescription?: string;
    valleyDescription?: string;
    flatDescription?: string;
  };
}

// ============= API客户端 =============

/**
 * 获取省份电价数据
 */
export async function fetchTariffData(
  provinceCode: string
): Promise<TariffApiResponse> {
  try {
    console.log(`[API] Fetching tariff data for ${provinceCode}`);

    const response = await fetch(`${API_BASE_URL}/api/tariff/${provinceCode}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log(`[API] Success:`, result);
    return result;
  } catch (error) {
    console.error(`[API] Error:`, error);
    return {
      success: false,
      province: provinceCode,
      error: (error as Error).message,
    };
  }
}

/**
 * 批量获取多个省份
 */
export async function fetchBatchTariffData(
  provinceCodes: string[]
): Promise<TariffApiResponse[]> {
  try {
    console.log(`[API] Batch fetching for ${provinceCodes.length} provinces`);

    const response = await fetch(`${API_BASE_URL}/api/tariff/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provinces: provinceCodes }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log(`[API] Batch success:`, result);
    return result.results;
  } catch (error) {
    console.error(`[API] Batch error:`, error);
    throw error;
  }
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return await response.json();
}

// ============= React Hook示例 =============

/**
 * 使用电价数据的Hook
 */
export function useTariffData(provinceCode: string) {
  const [data, setData] = useState<ParsedTariffData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchTariffData(provinceCode);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (provinceCode) {
      fetchData();
    }
  }, [provinceCode]);

  return { data, loading, error, refetch: fetchData };
}

// ============= 组件使用示例 =============

/**
 * 在组件中使用
 */
export function TariffDataComponent({ provinceCode }: { provinceCode: string }) {
  const { data, loading, error, refetch } = useTariffData(provinceCode);

  if (loading) {
    return <div>正在加载电价数据...</div>;
  }

  if (error) {
    return (
      <div>
        <p>加载失败：{error}</p>
        <button onClick={() => refetch()}>重试</button>
      </div>
    );
  }

  if (!data) {
    return <div>暂无数据</div>;
  }

  return (
    <div>
      <h2>{data.policyTitle}</h2>
      <p>文号：{data.policyNumber}</p>
      <p>生效日期：{data.effectiveDate}</p>

      <h3>电价数据</h3>
      <table>
        <thead>
          <tr>
            <th>电压等级</th>
            <th>峰时电价</th>
            <th>平时电价</th>
            <th>谷时电价</th>
          </tr>
        </thead>
        <tbody>
          {data.tariffs.map((tariff, index) => (
            <tr key={index}>
              <td>{tariff.voltageLevel}</td>
              <td>¥{tariff.peakPrice.toFixed(3)}</td>
              <td>¥{tariff.flatPrice.toFixed(3)}</td>
              <td>¥{tariff.valleyPrice.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============= 更新现有的TariffDataCrawler =============

/**
 * 更新 src/services/agents/TariffDataCrawler.ts
 * 使用后端API而不是直接爬取
 */

export class TariffDataCrawlerWithAPI {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = API_BASE_URL) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async crawlGuangdong(): Promise<any> {
    return this.fetchFromAPI('GD');
  }

  async crawlZhejiang(): Promise<any> {
    return this.fetchFromAPI('ZJ');
  }

  async crawlJiangsu(): Promise<any> {
    return this.fetchFromAPI('JS');
  }

  private async fetchFromAPI(provinceCode: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/api/tariff/${provinceCode}`);
    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: {
          notice: {
            title: result.data.policyTitle,
            url: '',
            publishDate: result.data.effectiveDate,
            source: provinceCode,
            type: 'html' as const,
          },
          parsed: result.data,
        },
        source: 'API',
        crawledAt: result.crawledAt,
      };
    } else {
      return {
        success: false,
        error: result.error,
        source: 'API',
        crawledAt: new Date().toISOString(),
      };
    }
  }
}

// ============= 使用示例 =============

/**
 * 在LocalTariffUpdateAgent中使用
 */
import { getTariffDataCrawlerWithAPI } from './TariffDataCrawlerWithAPI';

// 替换原来的爬虫实例
const crawler = new TariffDataCrawlerWithAPI(process.env.VITE_API_BASE_URL);

// 正常使用
const result = await crawler.crawlGuangdong();

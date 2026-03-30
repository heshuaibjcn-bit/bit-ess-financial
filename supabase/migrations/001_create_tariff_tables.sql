-- ================================================
-- 全国电价数据库 - Supabase SQL 迁移脚本
-- ================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. 电价省份表
-- ================================================
CREATE TABLE IF NOT EXISTS tariff_provinces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(2) UNIQUE NOT NULL, -- 省份代码，如 'GD', 'ZJ'
  name VARCHAR(50) NOT NULL, -- 省份名称
  region VARCHAR(50) NOT NULL, -- 区域
  grid_company VARCHAR(50) NOT NULL, -- 电网公司
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tariff_provinces_code ON tariff_provinces(code);
CREATE INDEX idx_tariff_provinces_region ON tariff_provinces(region);

-- ================================================
-- 2. 电价版本表
-- ================================================
CREATE TABLE IF NOT EXISTS tariff_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  province_id UUID NOT NULL REFERENCES tariff_provinces(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL, -- 版本号，如 '1.0.0'
  effective_date DATE NOT NULL,
  policy_number VARCHAR(100) NOT NULL, -- 政策文号
  policy_title TEXT, -- 政策标题
  policy_url TEXT, -- 政策文件URL
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'superseded')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(province_id, version)
);

-- 索引
CREATE INDEX idx_tariff_versions_province_id ON tariff_versions(province_id);
CREATE INDEX idx_tariff_versions_status ON tariff_versions(status);
CREATE INDEX idx_tariff_versions_effective_date ON tariff_versions(effective_date);

-- ================================================
-- 3. 电价数据表
-- ================================================
CREATE TABLE IF NOT EXISTS tariff_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES tariff_versions(id) ON DELETE CASCADE,
  province_id UUID NOT NULL REFERENCES tariff_provinces(id) ON DELETE CASCADE,
  voltage_level VARCHAR(10) NOT NULL CHECK (voltage_level IN ('0.4kV', '10kV', '35kV', '110kV', '220kV')),
  tariff_type VARCHAR(20) NOT NULL CHECK (tariff_type IN ('industrial', 'commercial', 'large_industrial', 'residential', 'agricultural')),

  -- 价格数据
  peak_price DECIMAL(10, 4) NOT NULL,
  valley_price DECIMAL(10, 4) NOT NULL,
  flat_price DECIMAL(10, 4) NOT NULL,
  avg_price DECIMAL(10, 4) NOT NULL,

  -- 电费单组成（JSON）
  bill_components JSONB NOT NULL,

  -- 季节性调整（可选）
  seasonal_adjustments JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(version_id, province_id, voltage_level)
);

-- 索引
CREATE INDEX idx_tariff_data_version_id ON tariff_data(version_id);
CREATE INDEX idx_tariff_data_province_id ON tariff_data(province_id);
CREATE INDEX idx_tariff_data_voltage_level ON tariff_data(voltage_level);

-- ================================================
-- 4. 时间段配置表
-- ================================================
CREATE TABLE IF NOT EXISTS tariff_time_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES tariff_versions(id) ON DELETE CASCADE,
  province_id UUID NOT NULL REFERENCES tariff_provinces(id) ON DELETE CASCADE,

  -- 峰谷平时段配置
  peak_hours INTEGER[] NOT NULL CHECK (array_length(peak_hours, 1) > 0),
  valley_hours INTEGER[] NOT NULL CHECK (array_length(valley_hours, 1) > 0),
  flat_hours INTEGER[] NOT NULL CHECK (array_length(flat_hours, 1) > 0),

  -- 描述信息
  peak_description TEXT,
  valley_description TEXT,
  flat_description TEXT,

  -- 季节性时段调整（可选）
  seasonal_periods JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(version_id, province_id)
);

-- 索引
CREATE INDEX idx_tariff_time_periods_version_id ON tariff_time_periods(version_id);
CREATE INDEX idx_tariff_time_periods_province_id ON tariff_time_periods(province_id);

-- ================================================
-- 5. 电价更新日志表
-- ================================================
CREATE TABLE IF NOT EXISTS tariff_update_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  province_id UUID NOT NULL REFERENCES tariff_provinces(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES tariff_versions(id) ON DELETE CASCADE,

  -- 更新信息
  update_type VARCHAR(20) NOT NULL CHECK (update_type IN ('create', 'update', 'expire', 'supersede')),
  trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('manual', 'agent', 'api', 'scheduled')),

  -- 变更摘要（JSON）
  changes_summary JSONB NOT NULL,

  -- 智能体信息（如果由智能体触发）
  agent_info JSONB,

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rollback')),

  -- 验证信息
  validation_result JSONB,

  -- 审批信息
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tariff_update_logs_province_id ON tariff_update_logs(province_id);
CREATE INDEX idx_tariff_update_logs_version_id ON tariff_update_logs(version_id);
CREATE INDEX idx_tariff_update_logs_status ON tariff_update_logs(status);
CREATE INDEX idx_tariff_update_logs_created_at ON tariff_update_logs(created_at DESC);

-- ================================================
-- 6. 电价通知订阅表
-- ================================================
CREATE TABLE IF NOT EXISTS tariff_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  province_ids UUID[] NOT NULL,
  voltage_levels VARCHAR(10)[] NOT NULL,
  notification_types VARCHAR(50)[] NOT NULL CHECK (array_elements(notification_types) <@ ARRAY['price_change', 'new_policy', 'version_update']::VARCHAR(50)[]),
  threshold_percent DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tariff_subscriptions_user_id ON tariff_subscriptions(user_id);
CREATE INDEX idx_tariff_subscriptions_is_active ON tariff_subscriptions(is_active);

-- ================================================
-- 视图：当前生效电价
-- ================================================
CREATE OR REPLACE VIEW active_tariffs_view AS
SELECT
  tp.code AS province_code,
  tp.name AS province_name,
  tv.version,
  tv.effective_date,
  tv.policy_number,
  td.voltage_level,
  td.tariff_type,
  td.peak_price,
  td.valley_price,
  td.flat_price,
  td.avg_price,
  (td.peak_price - td.valley_price) AS peak_valley_spread
FROM tariff_provinces tp
JOIN tariff_versions tv ON tv.province_id = tp.id AND tv.status = 'active'
JOIN tariff_data td ON td.version_id = tv.id
WHERE tp.is_active = true
ORDER BY tp.code, td.voltage_level;

-- ================================================
-- 视图：电价变化历史
-- ================================================
CREATE OR REPLACE VIEW tariff_change_history_view AS
SELECT
  tp.name AS province_name,
  tul.created_at AS change_date,
  COALESCE(tul.changes_summary->>'previous_version', 'N/A') AS old_version,
  tv.version AS new_version,
  td.voltage_level,
  pc->>'field' AS price_field,
  (pc->>'old_value')::DECIMAL AS old_value,
  (pc->>'new_value')::DECIMAL AS new_value,
  (pc->>'change_percent')::DECIMAL AS change_percent,
  tul.update_type
FROM tariff_update_logs tul
JOIN tariff_provinces tp ON tp.id = tul.province_id
JOIN tariff_versions tv ON tv.id = tul.version_id
JOIN tariff_data td ON td.version_id = tv.id,
  jsonb_array_elements(tul.changes_summary->'price_changes') AS pc
WHERE tul.status = 'completed'
ORDER BY tul.created_at DESC;

-- ================================================
-- 函数：获取省份当前生效电价
-- ================================================
CREATE OR REPLACE FUNCTION get_active_tariff(p_province_code VARCHAR, p_voltage_level VARCHAR)
RETURNS TABLE (
  id UUID,
  version_id UUID,
  province_id UUID,
  voltage_level VARCHAR,
  tariff_type VARCHAR,
  peak_price DECIMAL,
  valley_price DECIMAL,
  flat_price DECIMAL,
  avg_price DECIMAL,
  bill_components JSONB,
  peak_hours INTEGER[],
  valley_hours INTEGER[],
  flat_hours INTEGER[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.version_id,
    td.province_id,
    td.voltage_level,
    td.tariff_type,
    td.peak_price,
    td.valley_price,
    td.flat_price,
    td.avg_price,
    td.bill_components,
    ttp.peak_hours,
    ttp.valley_hours,
    ttp.flat_hours
  FROM tariff_provinces tp
  JOIN tariff_versions tv ON tv.province_id = tp.id AND tv.status = 'active'
  JOIN tariff_data td ON td.version_id = tv.id AND td.voltage_level = p_voltage_level
  JOIN tariff_time_periods ttp ON ttp.version_id = tv.id
  WHERE tp.code = UPPER(p_province_code)
    AND tp.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 函数：比较两个版本电价差异
-- ================================================
CREATE OR REPLACE FUNCTION compare_tariff_versions(p_version_id_1 UUID, p_version_id_2 UUID)
RETURNS TABLE (
  province_id UUID,
  voltage_level VARCHAR,
  field VARCHAR,
  old_value DECIMAL,
  new_value DECIMAL,
  change_percent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td1.province_id,
    td1.voltage_level,
    '峰时电价'::VARCHAR AS field,
    td1.peak_price AS old_value,
    td2.peak_price AS new_value,
    ((td2.peak_price - td1.peak_price) / td1.peak_price * 100)::DECIMAL(10, 2) AS change_percent
  FROM tariff_data td1
  JOIN tariff_data td2 ON td2.province_id = td1.province_id AND td2.voltage_level = td1.voltage_level
  WHERE td1.version_id = p_version_id_1
    AND td2.version_id = p_version_id_2
    AND td1.peak_price != td2.peak_price

  UNION ALL

  SELECT
    td1.province_id,
    td1.voltage_level,
    '谷时电价'::VARCHAR,
    td1.valley_price,
    td2.valley_price,
    ((td2.valley_price - td1.valley_price) / td1.valley_price * 100)::DECIMAL(10, 2)
  FROM tariff_data td1
  JOIN tariff_data td2 ON td2.province_id = td1.province_id AND td2.voltage_level = td1.voltage_level
  WHERE td1.version_id = p_version_id_1
    AND td2.version_id = p_version_id_2
    AND td1.valley_price != td2.valley_price

  UNION ALL

  SELECT
    td1.province_id,
    td1.voltage_level,
    '平时电价'::VARCHAR,
    td1.flat_price,
    td2.flat_price,
    ((td2.flat_price - td1.flat_price) / td1.flat_price * 100)::DECIMAL(10, 2)
  FROM tariff_data td1
  JOIN tariff_data td2 ON td2.province_id = td1.province_id AND td2.voltage_level = td1.voltage_level
  WHERE td1.version_id = p_version_id_1
    AND td2.version_id = p_version_id_2
    AND td1.flat_price != td2.flat_price;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 触发器：更新 updated_at 字段
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_tariff_provinces_updated_at BEFORE UPDATE ON tariff_provinces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_versions_updated_at BEFORE UPDATE ON tariff_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_data_updated_at BEFORE UPDATE ON tariff_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_time_periods_updated_at BEFORE UPDATE ON tariff_time_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_update_logs_updated_at BEFORE UPDATE ON tariff_update_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_subscriptions_updated_at BEFORE UPDATE ON tariff_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 行级安全策略（RLS）
-- ================================================
ALTER TABLE tariff_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_time_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_subscriptions ENABLE ROW LEVEL SECURITY;

-- 公开读取电价数据（所有人可读）
CREATE POLICY "Public read access to provinces" ON tariff_provinces
  FOR SELECT USING (true);

CREATE POLICY "Public read access to active tariffs" ON tariff_versions
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public read access to tariff data" ON tariff_data
  FOR SELECT USING (true);

CREATE POLICY "Public read access to time periods" ON tariff_time_periods
  FOR SELECT USING (true);

CREATE POLICY "Public read access to update logs" ON tariff_update_logs
  FOR SELECT USING (true);

-- 只有管理员可以写入
CREATE POLICY "Admin write access to provinces" ON tariff_provinces
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin write access to versions" ON tariff_versions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin write access to tariff data" ON tariff_data
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin write access to time periods" ON tariff_time_periods
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin write access to update logs" ON tariff_update_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 用户只能管理自己的订阅
CREATE POLICY "Users manage own subscriptions" ON tariff_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- ================================================
-- 完成
-- ================================================
-- 添加注释
COMMENT ON TABLE tariff_provinces IS '电价省份表';
COMMENT ON TABLE tariff_versions IS '电价版本表';
COMMENT ON TABLE tariff_data IS '电价数据表';
COMMENT ON TABLE tariff_time_periods IS '时段配置表';
COMMENT ON TABLE tariff_update_logs IS '电价更新日志表';
COMMENT ON TABLE tariff_subscriptions IS '电价通知订阅表';

COMMENT ON VIEW active_tariffs_view IS '当前生效电价视图';
COMMENT ON VIEW tariff_change_history_view IS '电价变化历史视图';

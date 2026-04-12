import { Card, Empty, Form, Select, Space, Statistic, Table, message } from "antd";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendPeriod, type ProvinceSamplingResp } from "../../api/client";
import { ChartCard } from "../../components/common/ChartCard";
import { PageTitle } from "../../components/common/PageTitle";

export function ProvinceSamplingPage() {
  const [periods, setPeriods] = useState<BackendPeriod[]>([]);
  const [periodCode, setPeriodCode] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [sampling, setSampling] = useState<ProvinceSamplingResp | null>(null);

  const loadSampling = async (code?: string, cityName?: string) => {
    setLoading(true);
    try {
      const data = await api.provinceSampling(code, cityName);
      setSampling(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载取样分析失败");
      setSampling(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const periodList = await api.listPeriods();
        setPeriods(periodList);
        const first = periodList[0]?.period_code;
        setPeriodCode(first);
        await loadSampling(first, undefined);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "初始化取样分析失败");
      }
    };
    void init();
  }, []);

  const cityOptions = useMemo(
    () => (sampling?.by_city ?? []).map((item) => ({ label: item.city, value: item.city })),
    [sampling],
  );

  const periodOptions = useMemo(
    () => periods.map((item) => ({ value: item.period_code, label: item.period_name })),
    [periods],
  );

  const pieOption = useMemo(
    () => ({
      tooltip: { trigger: "item" },
      legend: { orient: "vertical", left: "left" },
      series: [
        {
          name: "企业占比",
          type: "pie",
          radius: ["38%", "70%"],
          label: { formatter: "{b} {d}%" },
          data: (sampling?.by_city ?? []).map((item) => ({ name: item.city, value: item.enterprise_count })),
        },
      ],
    }),
    [sampling],
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="取样分析" desc="展示各市企业样本数量、占比与地区筛选结果。" />
      <Card className="soft-card" loading={loading}>
        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="调查期">
            <Select
              placeholder="请选择调查期"
              style={{ width: 220 }}
              value={periodCode}
              options={periodOptions}
              onChange={(value) => {
                setPeriodCode(value);
                setCity(undefined);
                void loadSampling(value, undefined);
              }}
            />
          </Form.Item>
          <Form.Item label="地区筛选">
            <Select
              allowClear
              placeholder="请选择地市"
              style={{ width: 220 }}
              value={city}
              onChange={(value) => {
                setCity(value);
                void loadSampling(periodCode, value);
              }}
              options={cityOptions}
            />
          </Form.Item>
        </Form>

        <Space size={16} wrap style={{ marginBottom: 16 }}>
          <Card size="small">
            <Statistic title="样本企业总数" value={sampling?.total_enterprises ?? 0} suffix="家" />
          </Card>
          <Card size="small">
            <Statistic title="覆盖地市" value={sampling?.city_count ?? 0} suffix="个" />
          </Card>
        </Space>

        <Table
          rowKey="city"
          locale={{ emptyText: <Empty description="未查询到符合条件的数据，请调整筛选条件" /> }}
          dataSource={(sampling?.by_city ?? []).map((item) => ({
            ...item,
            ratio_text: `${(item.ratio * 100).toFixed(1)}%`,
          }))}
          pagination={false}
          columns={[
            { title: "地市", dataIndex: "city" },
            { title: "企业数量", dataIndex: "enterprise_count" },
            { title: "占比", dataIndex: "ratio_text" },
          ]}
        />
      </Card>
      <ChartCard title="各市样本占比饼图" option={pieOption} loading={loading} height={360} />
    </Space>
  );
}

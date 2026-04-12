import { Button, Card, Empty, Form, Input, Select, Space, Table, Tabs, message } from "antd";
import { useEffect, useMemo, useState } from "react";

import {
  api,
  type BackendPeriod,
  type ProvinceCompareResp,
  type ProvinceMultiDimResp,
  type ProvinceTrendResp,
} from "../../api/client";
import { ChartCard } from "../../components/common/ChartCard";
import { PageTitle } from "../../components/common/PageTitle";

export function ProvinceAnalysisPage() {
  const [periods, setPeriods] = useState<BackendPeriod[]>([]);
  const [periodA, setPeriodA] = useState<string | undefined>(undefined);
  const [periodB, setPeriodB] = useState<string | undefined>(undefined);
  const [compareDimension, setCompareDimension] = useState<"region" | "nature" | "industry">("region");
  const [trendPeriods, setTrendPeriods] = useState<string[]>([]);
  const [multiDimPeriod, setMultiDimPeriod] = useState<string | undefined>(undefined);
  const [multiDimDimension, setMultiDimDimension] = useState<"region" | "nature" | "industry">("region");
  const [multiDimCity, setMultiDimCity] = useState<string>("");
  const [multiDimNature, setMultiDimNature] = useState<string>("");
  const [multiDimIndustry, setMultiDimIndustry] = useState<string>("");
  const [compareData, setCompareData] = useState<ProvinceCompareResp | null>(null);
  const [trendData, setTrendData] = useState<ProvinceTrendResp | null>(null);
  const [multiDimData, setMultiDimData] = useState<ProvinceMultiDimResp | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCompare = async (a: string, b: string, dimension: "region" | "nature" | "industry") => {
    try {
      const data = await api.provinceCompare(a, b, dimension);
      setCompareData(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载对比分析失败");
      setCompareData(null);
    }
  };

  const loadTrend = async (codes?: string[]) => {
    try {
      const data = await api.provinceTrend(codes);
      setTrendData(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载趋势分析失败");
      setTrendData({ points: [] });
    }
  };

  const loadMultiDim = async (params: {
    periodCode?: string;
    dimension: "region" | "nature" | "industry";
    city?: string;
    nature?: string;
    industry?: string;
  }) => {
    try {
      const data = await api.provinceMultiDim(params);
      setMultiDimData(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载多维分析失败");
      setMultiDimData(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const periodList = await api.listPeriods();
        setPeriods(periodList);
        const a = periodList[1]?.period_code ?? periodList[0]?.period_code;
        const b = periodList[0]?.period_code;
        if (a && b) {
          setPeriodA(a);
          setPeriodB(b);
          await loadCompare(a, b, "region");
        }
        const defaultTrend = periodList.slice(0, 6).map((item) => item.period_code).reverse();
        setTrendPeriods(defaultTrend);
        await loadTrend(defaultTrend);
        const firstPeriod = periodList[0]?.period_code;
        setMultiDimPeriod(firstPeriod);
        await loadMultiDim({ periodCode: firstPeriod, dimension: "region" });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "初始化分析页面失败");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const periodOptions = useMemo(
    () => periods.map((p) => ({ value: p.period_code, label: p.period_name })),
    [periods],
  );

  const compareOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["调查期A", "调查期B"] },
      xAxis: { type: "category", data: (compareData?.by_city ?? []).map((item) => item.city) },
      yAxis: { type: "value" },
      series: [
        {
          name: "调查期A",
          type: "line",
          smooth: true,
          data: (compareData?.by_city ?? []).map((item) => item.survey_a),
        },
        {
          name: "调查期B",
          type: "line",
          smooth: true,
          data: (compareData?.by_city ?? []).map((item) => item.survey_b),
        },
      ],
    }),
    [compareData],
  );

  const trendOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: (trendData?.points ?? []).map((item) => item.period_name) },
      yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
      series: [{ type: "line", smooth: true, areaStyle: {}, data: (trendData?.points ?? []).map((item) => item.change_ratio) }],
    }),
    [trendData],
  );

  const multiDimOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: (multiDimData?.items ?? []).map((item) => item.value) },
      yAxis: { type: "value" },
      series: [
        {
          type: "bar",
          data: (multiDimData?.items ?? []).map((item) => item.change_total),
        },
      ],
    }),
    [multiDimData],
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="图表分析" desc="支持对比分析与趋势分析，图表与表格联动展示。" />
      <Tabs
        items={[
          {
            key: "compare",
            label: "对比分析",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card className="soft-card" loading={loading}>
                  <Form layout="inline" style={{ rowGap: 8 }}>
                    <Form.Item label="调查期A">
                      <Select
                        value={periodA}
                        style={{ width: 220 }}
                        options={periodOptions}
                        onChange={(value) => {
                          setPeriodA(value);
                          if (periodB) {
                            void loadCompare(value, periodB, compareDimension);
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item label="调查期B">
                      <Select
                        value={periodB}
                        style={{ width: 220 }}
                        options={periodOptions}
                        onChange={(value) => {
                          setPeriodB(value);
                          if (periodA) {
                            void loadCompare(periodA, value, compareDimension);
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item label="分析维度">
                      <Select
                        value={compareDimension}
                        style={{ width: 200 }}
                        options={[
                          { value: "region", label: "地区" },
                          { value: "nature", label: "企业性质" },
                          { value: "industry", label: "行业" },
                        ]}
                        onChange={(value: "region" | "nature" | "industry") => {
                          setCompareDimension(value);
                          if (periodA && periodB) {
                            void loadCompare(periodA, periodB, value);
                          }
                        }}
                      />
                    </Form.Item>
                  </Form>
                </Card>
                <ChartCard title="岗位对比趋势" option={compareOption} loading={loading} height={360} />
                <Card className="soft-card">
                  <Table
                    rowKey="metric"
                    pagination={false}
                    locale={{ emptyText: <Empty description="暂无对比分析数据" /> }}
                    dataSource={(compareData?.metrics ?? []).map((item) => ({
                      metric: item.metric,
                      valueA: item.value_a,
                      valueB: item.value_b,
                      ratio: item.ratio,
                    }))}
                    columns={[
                      { title: "指标", dataIndex: "metric" },
                      { title: "调查期A", dataIndex: "valueA" },
                      { title: "调查期B", dataIndex: "valueB" },
                      { title: "变化占比", dataIndex: "ratio" },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: "trend",
            label: "趋势分析",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card className="soft-card" loading={loading}>
                  <Form layout="inline">
                    <Form.Item label="连续调查期">
                      <Select
                        mode="multiple"
                        value={trendPeriods}
                        style={{ width: 520 }}
                        options={periodOptions}
                        onChange={(value) => {
                          setTrendPeriods(value);
                          void loadTrend(value);
                        }}
                      />
                    </Form.Item>
                  </Form>
                </Card>
                <ChartCard title="岗位变化数量占比趋势(%)" option={trendOption} loading={loading} height={420} />
                <Card className="soft-card">
                  <Table
                    rowKey="period_code"
                    pagination={false}
                    locale={{ emptyText: <Empty description="暂无趋势数据" /> }}
                    dataSource={(trendData?.points ?? []).map((item) => ({
                      ...item,
                      ratio_text: `${item.change_ratio.toFixed(2)}%`,
                    }))}
                    columns={[
                      { title: "调查期", dataIndex: "period_name" },
                      { title: "岗位变化总数", dataIndex: "change_total" },
                      { title: "岗位变化数量占比", dataIndex: "ratio_text" },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: "multi",
            label: "多维分析",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card className="soft-card" loading={loading}>
                  <Form layout="inline" style={{ rowGap: 8 }}>
                    <Form.Item label="调查期">
                      <Select
                        value={multiDimPeriod}
                        style={{ width: 220 }}
                        options={periodOptions}
                        onChange={(value) => setMultiDimPeriod(value)}
                      />
                    </Form.Item>
                    <Form.Item label="维度">
                      <Select
                        value={multiDimDimension}
                        style={{ width: 180 }}
                        options={[
                          { value: "region", label: "地区" },
                          { value: "nature", label: "企业性质" },
                          { value: "industry", label: "行业" },
                        ]}
                        onChange={(value: "region" | "nature" | "industry") => setMultiDimDimension(value)}
                      />
                    </Form.Item>
                    <Form.Item label="地区筛选">
                      <Input value={multiDimCity} onChange={(e) => setMultiDimCity(e.target.value)} placeholder="可选" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item label="企业性质筛选">
                      <Input value={multiDimNature} onChange={(e) => setMultiDimNature(e.target.value)} placeholder="可选" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item label="行业筛选">
                      <Input value={multiDimIndustry} onChange={(e) => setMultiDimIndustry(e.target.value)} placeholder="可选" style={{ width: 160 }} />
                    </Form.Item>
                    <Button
                      type="primary"
                      onClick={() =>
                        void loadMultiDim({
                          periodCode: multiDimPeriod,
                          dimension: multiDimDimension,
                          city: multiDimCity || undefined,
                          nature: multiDimNature || undefined,
                          industry: multiDimIndustry || undefined,
                        })
                      }
                    >
                      查询分析
                    </Button>
                  </Form>
                </Card>

                <ChartCard title="多维岗位变化总数" option={multiDimOption} loading={loading} height={360} />

                <Card className="soft-card">
                  <Table
                    rowKey="value"
                    pagination={false}
                    locale={{ emptyText: <Empty description="暂无多维分析数据" /> }}
                    dataSource={(multiDimData?.items ?? []).map((item) => ({
                      ...item,
                      change_ratio_text: `${item.change_ratio.toFixed(2)}%`,
                    }))}
                    columns={[
                      { title: "维度值", dataIndex: "value" },
                      { title: "企业总数", dataIndex: "enterprise_count" },
                      { title: "建档期总岗位数", dataIndex: "base_total" },
                      { title: "调查期总岗位数", dataIndex: "survey_total" },
                      { title: "岗位变化总数", dataIndex: "change_total" },
                      { title: "岗位减少总数", dataIndex: "decrease_total" },
                      { title: "岗位变化数量占比", dataIndex: "change_ratio_text" },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
}

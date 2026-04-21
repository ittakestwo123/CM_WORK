import { Card, Col, Empty, Form, Row, Select, Space, Statistic, Table, message } from "antd";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendPeriod, type ProvinceSummaryResp } from "../../api/client";
import { ChartCard } from "../../components/common/ChartCard";
import { PageTitle } from "../../components/common/PageTitle";
import { CHART_AXIS_LABEL, CHART_COLORS, CHART_LEGEND, CHART_SPLIT_LINE, CHART_TOOLTIP_AXIS } from "../../styles/chartTheme";

export function ProvinceSummaryPage() {
  const [periods, setPeriods] = useState<BackendPeriod[]>([]);
  const [summary, setSummary] = useState<ProvinceSummaryResp | null>(null);
  const [periodCode, setPeriodCode] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const loadSummary = async (code?: string) => {
    setLoading(true);
    try {
      const data = await api.provinceSummary(code);
      setSummary(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载汇总数据失败");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const periodList = await api.listPeriods();
        setPeriods(periodList);
        const firstCode = periodList[0]?.period_code;
        setPeriodCode(firstCode);
        await loadSummary(firstCode);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载调查期失败");
      }
    };
    void init();
  }, []);

  const periodOptions = useMemo(
    () => periods.map((item) => ({ value: item.period_code, label: item.period_name })),
    [periods],
  );

  const cityBarOption = useMemo(
    () => ({
      color: [CHART_COLORS[0], CHART_COLORS[1]],
      tooltip: CHART_TOOLTIP_AXIS,
      legend: { ...CHART_LEGEND, data: ["建档期", "调查期"] },
      grid: { left: 40, right: 20, top: 36, bottom: 40 },
      xAxis: { type: "category", axisLabel: CHART_AXIS_LABEL, data: (summary?.by_city ?? []).map((item) => item.city) },
      yAxis: { type: "value", axisLabel: CHART_AXIS_LABEL, splitLine: CHART_SPLIT_LINE },
      series: [
        {
          name: "建档期",
          type: "bar",
          barMaxWidth: 30,
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          data: (summary?.by_city ?? []).map((item) => item.base_total),
        },
        {
          name: "调查期",
          type: "bar",
          barMaxWidth: 30,
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          data: (summary?.by_city ?? []).map((item) => item.survey_total),
        },
      ],
    }),
    [summary],
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="数据汇总" desc="按调查期与地区维度进行统计汇总。" />
      <Card className="soft-card filter-panel" loading={loading}>
        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="调查期">
            <Select
              style={{ width: 220 }}
              value={periodCode}
              options={periodOptions}
              onChange={(value) => {
                setPeriodCode(value);
                void loadSummary(value);
              }}
            />
          </Form.Item>
          <Form.Item label="地区维度">
            <Select style={{ width: 180 }} value="city" options={[{ value: "city", label: "地市" }]} />
          </Form.Item>
        </Form>

        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}><Card className="soft-card metric-card"><Statistic title="企业总数" value={summary?.enterprise_total ?? 0} suffix="家" /></Card></Col>
          <Col xs={24} sm={12} lg={6}><Card className="soft-card metric-card"><Statistic title="建档期总岗位数" value={summary?.base_total ?? 0} /></Card></Col>
          <Col xs={24} sm={12} lg={6}><Card className="soft-card metric-card"><Statistic title="调查期总岗位数" value={summary?.survey_total ?? 0} /></Card></Col>
          <Col xs={24} sm={12} lg={6}><Card className="soft-card metric-card"><Statistic title="岗位变化总数" value={summary?.change_total ?? 0} /></Card></Col>
        </Row>

        <Table
          style={{ marginTop: 16 }}
          locale={{ emptyText: <Empty description="暂无汇总数据" /> }}
          dataSource={(summary?.by_city ?? []).map((item) => ({ ...item, key: item.city }))}
          columns={[
            { title: "地市", dataIndex: "city" },
            { title: "企业总数", dataIndex: "enterprise_count" },
            { title: "建档期总岗位数", dataIndex: "base_total" },
            { title: "调查期总岗位数", dataIndex: "survey_total" },
            { title: "变化", dataIndex: "change_total" },
          ]}
        />
      </Card>
      <ChartCard title="地市岗位对比" subtitle="建档期与调查期岗位规模对比" option={cityBarOption} loading={loading} height={360} />
    </Space>
  );
}

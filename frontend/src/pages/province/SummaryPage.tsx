import { Card, Col, Empty, Form, Row, Select, Space, Statistic, Table, message } from "antd";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendPeriod, type ProvinceSummaryResp } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";

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

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="数据汇总" desc="按调查期与地区维度进行统计汇总。" />
      <Card className="soft-card" loading={loading}>
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
          <Col span={6}><Card><Statistic title="企业总数" value={summary?.enterprise_total ?? 0} suffix="家" /></Card></Col>
          <Col span={6}><Card><Statistic title="建档期总岗位数" value={summary?.base_total ?? 0} /></Card></Col>
          <Col span={6}><Card><Statistic title="调查期总岗位数" value={summary?.survey_total ?? 0} /></Card></Col>
          <Col span={6}><Card><Statistic title="岗位变化总数" value={summary?.change_total ?? 0} /></Card></Col>
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
    </Space>
  );
}

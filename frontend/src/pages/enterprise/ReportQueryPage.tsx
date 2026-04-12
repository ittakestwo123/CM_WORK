import { Button, Card, Drawer, Empty, Form, Select, Space, Table, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendReport } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";

const { Text } = Typography;

export function EnterpriseReportQueryPage() {
  const [filters, setFilters] = useState<{ periodCode?: string; status?: string }>({});
  const [detail, setDetail] = useState<BackendReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<BackendReport[]>([]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.listMyReports();
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const hasFilters = Boolean(filters.periodCode || filters.status);

  const data = useMemo(
    () =>
      reports.filter((item) => {
        if (filters.periodCode && item.period_code !== filters.periodCode) return false;
        if (filters.status && item.status !== filters.status) return false;
        return true;
      }),
    [reports, filters],
  );

  const periodOptions = useMemo(() => {
    const m = new Map<string, string>();
    reports.forEach((item) => {
      if (!m.has(item.period_code)) m.set(item.period_code, item.period_name ?? item.period_code);
    });
    return Array.from(m.entries()).map(([value, label]) => ({ value, label }));
  }, [reports]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="企业数据查询" desc="按调查期和状态查询历史报表，支持查看详情（仅浏览，不导出）。" />
      <Card className="soft-card" loading={loading}>
        <Form
          layout="inline"
          onValuesChange={(_, values) => setFilters(values)}
          style={{ marginBottom: 16, rowGap: 8 }}
        >
          <Form.Item label="调查期" name="periodCode">
            <Select
              allowClear
              placeholder="请选择调查期"
              style={{ width: 220 }}
              options={periodOptions}
            />
          </Form.Item>
          <Form.Item label="报表状态" name="status">
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="请选择报表状态"
              options={["草稿", "待市审", "待省审", "市审退回", "省审退回", "省审通过", "已上报部委"].map(
                (item) => ({ value: item, label: item }),
              )}
            />
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          locale={{
            emptyText: <Empty description={hasFilters ? "未查询到符合条件的数据，请调整筛选条件后重试" : "暂无报表数据"} />,
          }}
          dataSource={data}
          columns={[
            { title: "调查期", dataIndex: "period_name" },
            {
              title: "报表状态",
              dataIndex: "status",
              render: (value: string) => <StatusTag status={value} />,
            },
            { title: "建档期就业人数", dataIndex: "base_employment" },
            { title: "调查期就业人数", dataIndex: "survey_employment" },
            { title: "提交时间", dataIndex: "last_submitted_at", render: (v?: string | null) => v ?? "-" },
            {
              title: "审核状态",
              dataIndex: "status",
              render: (value: string) => <StatusTag status={value} />,
            },
            {
              title: "操作",
              render: (_, record) => (
                <Button type="link" onClick={() => setDetail(record)}>
                  查看详情
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Drawer title="报表详情" width={540} open={!!detail} onClose={() => setDetail(null)}>
        {detail ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text>企业：{detail.enterprise_name ?? `企业${detail.enterprise_id}`}</Text>
            <Text>调查期：{detail.period_name}</Text>
            <Text>建档期就业人数：{detail.base_employment}</Text>
            <Text>调查期就业人数：{detail.survey_employment}</Text>
            <Text>原因说明：{detail.decrease_reason_detail ?? "-"}</Text>
            <Text>
              状态：<StatusTag status={detail.status} />
            </Text>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}

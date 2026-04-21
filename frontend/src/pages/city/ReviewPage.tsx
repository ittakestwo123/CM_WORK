import { Alert, Button, Card, Drawer, Empty, Form, Input, Select, Space, Table, Timeline } from "antd";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendReport } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { useResponsive } from "../../hooks/useResponsive";
import { showActionMessage } from "../../utils/feedback";

export function CityReviewPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [detail, setDetail] = useState<BackendReport | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BackendReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<BackendReport[]>([]);
  const { isMobile } = useResponsive();

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.listCityReports();
      setReports(data);
    } catch (error) {
      const text = error instanceof Error ? error.message : "加载市级审核列表失败";
      showActionMessage("查询", text, "error");
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

  const onApprove = async (report: BackendReport) => {
    try {
      await api.cityApprove(report.id);
      showActionMessage("审核通过", `${report.period_name ?? report.period_code}`);
      await loadReports();
    } catch (error) {
      const text = error instanceof Error ? error.message : "审核失败";
      showActionMessage("审核通过", text, "error");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="数据审核" desc="市级审核本辖区企业上报数据，支持通过与退回修改。" extra={<StatusTag status="待市审" />} />
      <Card className="soft-card filter-panel" loading={loading}>
        <Form layout="inline" onValuesChange={(_, values) => setFilters(values)} style={{ rowGap: 8, marginBottom: 16 }}>
          <Form.Item label="调查期" name="periodCode">
            <Select allowClear style={{ width: 220 }} placeholder="请选择调查期" options={periodOptions} />
          </Form.Item>
          <Form.Item label="报表状态" name="status">
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="请选择状态"
              options={["待市审", "市审退回", "待省审"].map((item) => ({ value: item, label: item }))}
            />
          </Form.Item>
        </Form>

        {isMobile ? (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {data.length === 0 ? <Empty description={hasFilters ? "未查询到符合条件的数据，请调整筛选条件" : "暂无待审核数据"} /> : null}
            {data.map((item) => (
              <Card key={item.id} size="small" className="soft-card section-card" title={item.period_name ?? item.period_code}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>企业ID：{item.enterprise_id}</div>
                  <div>建档期：{item.base_employment}</div>
                  <div>调查期：{item.survey_employment}</div>
                  <StatusTag status={item.status} />
                  <Space wrap>
                    <Button size="small" onClick={() => setDetail(item)}>
                      查看详情
                    </Button>
                    <Button size="small" type="primary" onClick={() => onApprove(item)}>
                      审核通过
                    </Button>
                    <Button size="small" danger onClick={() => setRejectTarget(item)}>
                      退回修改
                    </Button>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        ) : (
          <Table
            rowKey="id"
            locale={{
              emptyText: <Empty description={hasFilters ? "未查询到符合条件的数据，请调整筛选条件" : "暂无待审核数据"} />,
            }}
            dataSource={data}
            columns={[
              { title: "企业ID", dataIndex: "enterprise_id" },
              { title: "调查期", dataIndex: "period_name" },
              { title: "建档期就业人数", dataIndex: "base_employment" },
              {
                title: "调查期就业人数",
                dataIndex: "survey_employment",
                render: (value: number, row) => (
                  <span style={row.survey_employment < row.base_employment * 0.9 ? { color: "#d48806", fontWeight: 600 } : {}}>{value}</span>
                ),
              },
              { title: "状态", dataIndex: "status", render: (value: string) => <StatusTag status={value} /> },
              { title: "提交时间", dataIndex: "last_submitted_at", render: (v?: string | null) => v ?? "-" },
              {
                title: "操作",
                render: (_, row) => (
                  <Space>
                    <Button size="small" onClick={() => setDetail(row)}>
                      查看详情
                    </Button>
                    <Button size="small" type="primary" onClick={() => onApprove(row)}>
                      审核通过
                    </Button>
                    <Button size="small" danger onClick={() => setRejectTarget(row)}>
                      退回修改
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Drawer width={isMobile ? "100%" : 560} title="报表详情" open={!!detail} onClose={() => setDetail(null)}>
        {detail ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            {detail.survey_employment < detail.base_employment * 0.9 ? (
              <Alert type="warning" showIcon message="检测到就业人数明显下降，请重点核查。" />
            ) : null}
            <Timeline
              items={[
                { children: "草稿" },
                { children: "企业上报" },
                { children: "市级审核中" },
                { color: "blue", children: detail.status === "市审退回" ? "市级退回" : "市级通过" },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        placement="bottom"
        height={isMobile ? 280 : 320}
        open={!!rejectTarget}
        title="退回修改"
        onClose={() => setRejectTarget(null)}
      >
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.cityReject(rejectTarget!.id, values.reason);
              showActionMessage("退回", `报表 ${rejectTarget?.id}（原因：${values.reason}）`, "warning");
              setRejectTarget(null);
              await loadReports();
            } catch (error) {
              const text = error instanceof Error ? error.message : "退回失败";
              showActionMessage("退回", text, "error");
            }
          }}
        >
          <Form.Item label="退回原因" name="reason" rules={[{ required: true, message: "请填写退回原因" }]}>
            <Input.TextArea rows={4} placeholder="请输入退回原因" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            确认退回
          </button>
        </Form>
      </Drawer>
    </Space>
  );
}

import { Button, Card, Drawer, Empty, Form, Select, Space, Table, Typography } from "antd";
import { useMemo, useState } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { reportList, surveyPeriods } from "../../mock/data";
import type { ReportRecord } from "../../types";

const { Text } = Typography;

export function EnterpriseReportQueryPage() {
  const [filters, setFilters] = useState<{ periodCode?: string; status?: string }>({});
  const [detail, setDetail] = useState<ReportRecord | null>(null);

  const data = useMemo(
    () =>
      reportList.filter((item) => {
        if (filters.periodCode && item.periodCode !== filters.periodCode) return false;
        if (filters.status && item.status !== filters.status) return false;
        return true;
      }),
    [filters],
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="企业数据查询" desc="按调查期和状态查询历史报表，支持查看详情（仅浏览，不导出）。" />
      <Card className="soft-card">
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
              options={surveyPeriods.map((item) => ({ value: item.periodCode, label: item.periodName }))}
            />
          </Form.Item>
          <Form.Item label="报表状态" name="status">
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="请选择报表状态"
              options={["草稿", "待市审", "市审通过", "市审退回", "待省审", "省审通过", "省审退回", "已上报"].map(
                (item) => ({ value: item, label: item }),
              )}
            />
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          locale={{ emptyText: <Empty description="暂无报表数据" /> }}
          dataSource={data}
          columns={[
            { title: "调查期", dataIndex: "periodName" },
            {
              title: "报表状态",
              dataIndex: "status",
              render: (value: string) => <StatusTag status={value} />,
            },
            { title: "建档期就业人数", dataIndex: "baseEmployment" },
            { title: "调查期就业人数", dataIndex: "surveyEmployment" },
            { title: "提交时间", dataIndex: "submitTime" },
            {
              title: "审核状态",
              dataIndex: "status",
              render: (value: string) => <Text type="secondary">{value}</Text>,
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
            <Text>企业：{detail.enterpriseName}</Text>
            <Text>调查期：{detail.periodName}</Text>
            <Text>建档期就业人数：{detail.baseEmployment}</Text>
            <Text>调查期就业人数：{detail.surveyEmployment}</Text>
            <Text>原因说明：{detail.reason ?? "-"}</Text>
            <Text>状态：{detail.status}</Text>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}

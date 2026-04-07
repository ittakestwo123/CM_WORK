import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Timeline,
  message,
} from "antd";
import { useMemo, useState } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { reportList, surveyPeriods } from "../../mock/data";
import type { ReportRecord } from "../../types";

export function CityReviewPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [detail, setDetail] = useState<ReportRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReportRecord | null>(null);

  const data = useMemo(
    () =>
      reportList.filter((item) => {
        if (filters.periodCode && item.periodCode !== filters.periodCode) return false;
        if (filters.enterpriseName && !item.enterpriseName.includes(filters.enterpriseName)) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (filters.region && !item.region.includes(filters.region)) return false;
        return true;
      }),
    [filters],
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="数据审核" desc="市级审核本辖区企业上报数据，支持通过与退回修改。" />
      <Card className="soft-card">
        <Form layout="inline" onValuesChange={(_, values) => setFilters(values)} style={{ rowGap: 8, marginBottom: 16 }}>
          <Form.Item label="调查期" name="periodCode">
            <Select
              allowClear
              style={{ width: 200 }}
              placeholder="请选择调查期"
              options={surveyPeriods.map((item) => ({ value: item.periodCode, label: item.periodName }))}
            />
          </Form.Item>
          <Form.Item label="企业名称" name="enterpriseName">
            <Input style={{ width: 180 }} placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item label="报表状态" name="status">
            <Select
              allowClear
              style={{ width: 160 }}
              placeholder="请选择状态"
              options={["待市审", "市审通过", "市审退回", "待省审"].map((item) => ({ value: item, label: item }))}
            />
          </Form.Item>
          <Form.Item label="所属地区" name="region">
            <Input style={{ width: 160 }} placeholder="请输入地区" />
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          locale={{ emptyText: <Empty description="暂无待审核数据" /> }}
          dataSource={data}
          columns={[
            { title: "企业名称", dataIndex: "enterpriseName" },
            { title: "调查期", dataIndex: "periodName" },
            { title: "建档期就业人数", dataIndex: "baseEmployment" },
            {
              title: "调查期就业人数",
              dataIndex: "surveyEmployment",
              render: (value: number, row) => (
                <span style={row.surveyEmployment < row.baseEmployment * 0.9 ? { color: "#d48806", fontWeight: 600 } : {}}>{value}</span>
              ),
            },
            { title: "状态", dataIndex: "status", render: (value: string) => <StatusTag status={value} /> },
            { title: "提交时间", dataIndex: "submitTime" },
            {
              title: "操作",
              render: (_, row) => (
                <Space>
                  <Button type="link" onClick={() => setDetail(row)}>
                    查看详情
                  </Button>
                  <Button type="link" onClick={() => message.success(`已审核通过：${row.enterpriseName}`)}>
                    审核通过
                  </Button>
                  <Button type="link" danger onClick={() => setRejectTarget(row)}>
                    退回修改
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer width={560} title="报表详情" open={!!detail} onClose={() => setDetail(null)}>
        {detail ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            {detail.surveyEmployment < detail.baseEmployment * 0.9 ? (
              <Alert type="warning" showIcon message="检测到就业人数明显下降，请重点核查。" />
            ) : null}
            <Timeline
              items={[
                { children: "草稿" },
                { children: "已上报" },
                { children: "市级审核中" },
                { color: "blue", children: detail.status === "市审退回" ? "市级退回" : "市级通过" },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>

      <Modal
        open={!!rejectTarget}
        title="退回修改"
        onCancel={() => setRejectTarget(null)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={(values) => {
            message.info(`已退回：${rejectTarget?.enterpriseName}，原因：${values.reason}`);
            setRejectTarget(null);
          }}
        >
          <Form.Item label="退回原因" name="reason" rules={[{ required: true, message: "请填写退回原因" }]}>
            <Input.TextArea rows={4} placeholder="请输入退回原因" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            确认退回
          </button>
        </Form>
      </Modal>
    </Space>
  );
}

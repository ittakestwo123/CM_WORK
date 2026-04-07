import { Button, Card, Col, Descriptions, Drawer, Empty, Form, Input, Modal, Row, Select, Space, Table, Timeline, message } from "antd";
import { useMemo, useState } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { reportList, surveyPeriods } from "../../mock/data";
import type { ReportRecord } from "../../types";

export function ProvinceReportManagePage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [detail, setDetail] = useState<ReportRecord | null>(null);
  const [editTarget, setEditTarget] = useState<ReportRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReportRecord | null>(null);

  const data = useMemo(
    () =>
      reportList.filter((item) => {
        if (filters.periodCode && item.periodCode !== filters.periodCode) return false;
        if (filters.region && !item.region.includes(filters.region)) return false;
        if (filters.enterpriseName && !item.enterpriseName.includes(filters.enterpriseName)) return false;
        if (filters.status && item.status !== filters.status) return false;
        return true;
      }),
    [filters],
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="省级报表管理" desc="支持省审通过、退回修改、数据修订与上报部委。" />
      <Card className="soft-card">
        <Form layout="inline" onValuesChange={(_, values) => setFilters(values)} style={{ marginBottom: 16, rowGap: 8 }}>
          <Form.Item label="调查期" name="periodCode">
            <Select
              allowClear
              style={{ width: 210 }}
              placeholder="请选择调查期"
              options={surveyPeriods.map((item) => ({ value: item.periodCode, label: item.periodName }))}
            />
          </Form.Item>
          <Form.Item label="地区" name="region">
            <Input style={{ width: 160 }} placeholder="请输入地区" />
          </Form.Item>
          <Form.Item label="企业名称" name="enterpriseName">
            <Input style={{ width: 180 }} placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item label="报表状态" name="status">
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="请选择报表状态"
              options={["待省审", "省审通过", "省审退回", "已上报", "待市审", "市审通过"].map((item) => ({
                value: item,
                label: item,
              }))}
            />
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          locale={{ emptyText: <Empty description="暂无报表数据" /> }}
          dataSource={data}
          columns={[
            { title: "企业名称", dataIndex: "enterpriseName" },
            { title: "调查期", dataIndex: "periodName" },
            { title: "建档期就业人数", dataIndex: "baseEmployment" },
            { title: "调查期就业人数", dataIndex: "surveyEmployment" },
            { title: "状态", dataIndex: "status", render: (v: string) => <StatusTag status={v} /> },
            { title: "市级审核时间", dataIndex: "cityReviewTime", render: (v: string) => v ?? "-" },
            {
              title: "操作",
              render: (_, row) => (
                <Space wrap>
                  <Button type="link" onClick={() => setDetail(row)}>
                    查看
                  </Button>
                  <Button type="link" onClick={() => message.success(`省审通过：${row.enterpriseName}`)}>
                    审核通过
                  </Button>
                  <Button type="link" danger onClick={() => setRejectTarget(row)}>
                    退回修改
                  </Button>
                  <Button type="link" onClick={() => setEditTarget(row)}>
                    数据修改
                  </Button>
                  <Button type="link" onClick={() => message.success(`已上报部委：${row.enterpriseName}`)}>
                    上报部委
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer width={780} title="报表详情" open={!!detail} onClose={() => setDetail(null)}>
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="企业基础信息">
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="企业名称">{detail.enterpriseName}</Descriptions.Item>
                    <Descriptions.Item label="所属地区">{detail.region}</Descriptions.Item>
                    <Descriptions.Item label="调查期">{detail.periodName}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="报表信息">
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="建档期就业人数">{detail.baseEmployment}</Descriptions.Item>
                    <Descriptions.Item label="调查期就业人数">{detail.surveyEmployment}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <StatusTag status={detail.status} />
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            <Card size="small" title="原因说明">
              {detail.reason ?? "无"}
            </Card>
            <Card size="small" title="审核流转记录">
              <Timeline
                items={[
                  { children: "草稿" },
                  { children: "企业上报" },
                  { children: "市级审核通过" },
                  { children: `省级处理：${detail.status}` },
                ]}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal title="数据修改" open={!!editTarget} onCancel={() => setEditTarget(null)} footer={null}>
        <Form
          layout="vertical"
          initialValues={editTarget ?? {}}
          key={editTarget?.id ?? "edit"}
          onFinish={(values) => {
            message.success(`已保存修订值：建档期 ${values.baseEmployment}，调查期 ${values.surveyEmployment}`);
            setEditTarget(null);
          }}
        >
          <Form.Item label="建档期就业人数" name="baseEmployment" rules={[{ required: true, message: "请输入建档期人数" }]}>
            <Input placeholder="请输入建档期就业人数" />
          </Form.Item>
          <Form.Item label="调查期就业人数" name="surveyEmployment" rules={[{ required: true, message: "请输入调查期人数" }]}>
            <Input placeholder="请输入调查期就业人数" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            保存修改
          </button>
        </Form>
      </Modal>

      <Modal title="退回修改" open={!!rejectTarget} onCancel={() => setRejectTarget(null)} footer={null}>
        <Form
          layout="vertical"
          onFinish={(values) => {
            message.warning(`已退回 ${rejectTarget?.enterpriseName}，原因：${values.reason}`);
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

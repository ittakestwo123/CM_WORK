import { Button, Card, Empty, Form, Input, Modal, Select, Space, Table, message } from "antd";
import { useMemo, useState } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { enterpriseList, surveyPeriods } from "../../mock/data";
import type { EnterpriseRecord } from "../../types";

export function ProvinceFilingApprovalPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [rejectTarget, setRejectTarget] = useState<EnterpriseRecord | null>(null);

  const data = useMemo(
    () =>
      enterpriseList.filter((item) => {
        if (filters.region && !item.region.includes(filters.region)) return false;
        if (filters.name && !item.name.includes(filters.name)) return false;
        return true;
      }),
    [filters],
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageTitle title="企业备案审批" desc="省级对企业备案进行查看、通过或退回。" />
      <Card className="soft-card">
        <Form layout="inline" onValuesChange={(_, v) => setFilters(v)} style={{ marginBottom: 16, rowGap: 8 }}>
          <Form.Item label="调查期" name="period">
            <Select
              style={{ width: 200 }}
              allowClear
              placeholder="请选择调查期"
              options={surveyPeriods.map((item) => ({ value: item.periodCode, label: item.periodName }))}
            />
          </Form.Item>
          <Form.Item label="地区" name="region">
            <Input style={{ width: 160 }} placeholder="请输入地区" />
          </Form.Item>
          <Form.Item label="企业名称" name="name">
            <Input style={{ width: 180 }} placeholder="请输入企业名称" />
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          locale={{ emptyText: <Empty description="暂无备案数据" /> }}
          dataSource={data}
          columns={[
            { title: "企业名称", dataIndex: "name" },
            { title: "组织机构代码", dataIndex: "orgCode" },
            { title: "所属地区", dataIndex: "region" },
            { title: "联系人", dataIndex: "contact" },
            { title: "备案状态", dataIndex: "filingStatus", render: (v: string) => <StatusTag status={v} /> },
            {
              title: "操作",
              render: (_, row) => (
                <Space>
                  <Button type="link" onClick={() => message.info(`查看：${row.name}`)}>
                    查看
                  </Button>
                  <Button type="link" onClick={() => message.success(`已通过：${row.name}`)}>
                    审核通过
                  </Button>
                  <Button type="link" danger onClick={() => setRejectTarget(row)}>
                    退回
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="退回备案" open={!!rejectTarget} onCancel={() => setRejectTarget(null)} footer={null}>
        <Form
          layout="vertical"
          onFinish={(values) => {
            message.warning(`已退回 ${rejectTarget?.name}，原因：${values.reason}`);
            setRejectTarget(null);
          }}
        >
          <Form.Item label="退回原因" name="reason" rules={[{ required: true, message: "请填写退回原因" }]}>
            <Input.TextArea rows={4} placeholder="请输入退回原因" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            提交
          </button>
        </Form>
      </Modal>
    </Space>
  );
}

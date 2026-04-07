import { Button, Card, Form, Input, Progress, Select, Space, Table, Tabs, Tag, message } from "antd";
import { useState } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { surveyPeriods } from "../../mock/data";

const userRows = [
  { key: "u1", username: "enterprise_user", role: "企业", region: "昆明市", status: "启用" },
  { key: "u2", username: "city_reviewer", role: "市级", region: "昆明市", status: "启用" },
  { key: "u3", username: "province_admin", role: "省级", region: "云南省", status: "启用" },
];

const roleRows = [
  { key: "r1", role: "企业角色", permission: "企业备案、数据填报、通知查看" },
  { key: "r2", role: "市级角色", permission: "市级审核、通知发布" },
  { key: "r3", role: "省级角色", permission: "备案审批、报表管理、系统管理" },
];

export function ProvinceSystemManagePage() {
  const [loading, setLoading] = useState(false);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="系统管理" desc="上报时限、用户、角色及系统监控统一管理。" />
      <Tabs
        items={[
          {
            key: "period",
            label: "上报时限",
            children: (
              <Card className="soft-card">
                <Form layout="inline" style={{ marginBottom: 12 }}>
                  <Form.Item label="调查期名称">
                    <Input style={{ width: 280 }} placeholder="请输入调查期名称" />
                  </Form.Item>
                  <Form.Item label="类型">
                    <Select style={{ width: 160 }} options={[{ value: "MONTH", label: "月报" }, { value: "HALF_MONTH", label: "半月报" }]} />
                  </Form.Item>
                  <Button type="primary" onClick={() => message.success("调查期已新增（mock）")}>新增调查期</Button>
                </Form>
                <Table
                  rowKey="periodCode"
                  dataSource={surveyPeriods.filter((item) => ["202601H1", "202601H2", "202604"].includes(item.periodCode))}
                  columns={[
                    { title: "period_code", dataIndex: "periodCode" },
                    { title: "period_name", dataIndex: "periodName" },
                    { title: "period_type", dataIndex: "periodType" },
                    { title: "开始日期", dataIndex: "startDate" },
                    { title: "结束日期", dataIndex: "endDate" },
                    {
                      title: "操作",
                      render: () => <Button type="link">修改</Button>,
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "user",
            label: "用户管理",
            children: (
              <Card className="soft-card" extra={<Button type="primary">新增用户</Button>}>
                <Table
                  rowKey="key"
                  dataSource={userRows}
                  columns={[
                    { title: "用户名", dataIndex: "username" },
                    { title: "角色", dataIndex: "role" },
                    { title: "地区", dataIndex: "region" },
                    { title: "状态", dataIndex: "status", render: (v: string) => <Tag color="green">{v}</Tag> },
                    { title: "操作", render: () => <Space><Button type="link">修改</Button><Button type="link" danger>删除</Button></Space> },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "role",
            label: "角色管理",
            children: (
              <Card className="soft-card" extra={<Button type="primary">新增角色</Button>}>
                <Table
                  rowKey="key"
                  dataSource={roleRows}
                  columns={[
                    { title: "角色名称", dataIndex: "role" },
                    { title: "权限说明", dataIndex: "permission" },
                    { title: "操作", render: () => <Button type="link">权限分配</Button> },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "monitor",
            label: "系统监控",
            children: (
              <Card className="soft-card">
                <Space direction="vertical" style={{ width: "100%" }} size={16}>
                  <Button
                    onClick={() => {
                      setLoading((v) => !v);
                      message.info("系统监控状态已刷新");
                    }}
                  >
                    刷新状态
                  </Button>
                  <Card size="small" title="CPU 使用率">
                    <Progress percent={loading ? 56 : 42} status={loading ? "active" : "normal"} />
                  </Card>
                  <Card size="small" title="内存使用率">
                    <Progress percent={68} status="active" />
                  </Card>
                  <Card size="small" title="磁盘使用率">
                    <Progress percent={74} status="active" />
                  </Card>
                  <Card size="small" title="在线用户数">
                    <strong style={{ fontSize: 28 }}>186</strong>
                  </Card>
                </Space>
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}

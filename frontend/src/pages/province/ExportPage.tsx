import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Table, message } from "antd";

import { PageTitle } from "../../components/common/PageTitle";

const resultData = [
  { key: "1", unitName: "云南云智制造有限公司", account: "enterprise_user", role: "企业", city: "昆明市", status: "待省审" },
  { key: "2", unitName: "曲靖新材科技有限公司", account: "qj_enterprise", role: "企业", city: "曲靖市", status: "市审通过" },
];

export function ProvinceExportPage() {
  const [form] = Form.useForm();

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="数据查询与导出" desc="支持多条件筛选与导出演示。" />
      <Card className="soft-card">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8}><Form.Item label="单位名称" name="unitName"><Input placeholder="请输入单位名称" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="登录账号" name="account"><Input placeholder="请输入登录账号" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="用户类型" name="role"><Select placeholder="请选择用户类型" options={[{ value: "企业", label: "企业" }, { value: "市级", label: "市级" }, { value: "省级", label: "省级" }]} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所属地市" name="city"><Input placeholder="请输入所属地市" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所属市县" name="county"><Input placeholder="请输入所属市县" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所处区域" name="zone"><Input placeholder="请输入所处区域" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="数据状态" name="status"><Select placeholder="请选择数据状态" options={[{ value: "待市审", label: "待市审" }, { value: "待省审", label: "待省审" }, { value: "已上报", label: "已上报" }]} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="单位性质" name="nature"><Input placeholder="请输入单位性质" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所属行业" name="industry"><Input placeholder="请输入所属行业" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="起始日期" name="startDate"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="结束日期" name="endDate"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={4}><Form.Item label="统计月份" name="month"><Input placeholder="如 2026-04" /></Form.Item></Col>
            <Col xs={24} md={4}><Form.Item label="统计季度" name="quarter"><Input placeholder="如 2026Q2" /></Form.Item></Col>
          </Row>
          <Space>
            <Button type="primary" onClick={() => message.success("查询完成（mock）")}>查询</Button>
            <Button onClick={() => form.resetFields()}>清空</Button>
            <Button onClick={() => message.success("导出任务已提交（前端演示）")}>导出</Button>
          </Space>
        </Form>
      </Card>

      <Card className="soft-card">
        <Table
          rowKey="key"
          dataSource={resultData}
          columns={[
            { title: "单位名称", dataIndex: "unitName" },
            { title: "登录账号", dataIndex: "account" },
            { title: "用户类型", dataIndex: "role" },
            { title: "所属地市", dataIndex: "city" },
            { title: "数据状态", dataIndex: "status" },
          ]}
        />
      </Card>
    </Space>
  );
}

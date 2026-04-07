import { Card, Cascader, Col, Form, Input, Row, Space, Typography, message } from "antd";

import { PageTitle } from "../../components/common/PageTitle";
import { industryOptions, natureOptions } from "../../mock/data";

const { Text } = Typography;

export function EnterpriseFilingPage() {
  const [form] = Form.useForm();

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="企业备案信息" desc="请完整填写备案信息，可先保存草稿后再上报备案。" />
      <Card className="soft-card">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ region: "昆明市盘龙区" }}
          onFinish={() => message.success("已保存备案草稿")}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="所属地区" name="region">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="组织机构代码" name="orgCode" rules={[{ required: true, message: "请输入组织机构代码" }]}>
                <Input placeholder="请输入组织机构代码" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="企业名称" name="name" rules={[{ required: true, message: "请输入企业名称" }]}>
                <Input placeholder="请输入企业名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="企业性质" name="nature" rules={[{ required: true, message: "请选择企业性质" }]}>
                <Cascader options={natureOptions} placeholder="请选择企业性质" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="所属行业" name="industry" rules={[{ required: true, message: "请选择所属行业" }]}>
                <Cascader options={industryOptions} placeholder="请选择所属行业" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="主要经营业务" name="business" rules={[{ required: true, message: "请输入主要经营业务" }]}>
                <Input placeholder="请输入主要经营业务" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="联系人" name="contact" rules={[{ required: true, message: "请输入联系人" }]}>
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="联系地址" name="address" rules={[{ required: true, message: "请输入联系地址" }]}>
                <Input placeholder="请输入联系地址" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="邮政编码" name="zip" rules={[{ required: true, message: "请输入邮政编码" }]}>
                <Input placeholder="请输入邮政编码" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: "请输入联系电话" }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="传真" name="fax">
                <Input placeholder="请输入传真" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="EMAIL"
                name="email"
                rules={[{ required: true, message: "请输入邮箱" }, { type: "email", message: "邮箱格式不正确" }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Form.Item noStyle>
              <button className="btn-outline" type="submit">
                保存草稿
              </button>
            </Form.Item>
            <Form.Item noStyle>
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  form
                    .validateFields()
                    .then(() => message.success("备案信息已上报"))
                    .catch(() => undefined);
                }}
              >
                上报备案
              </button>
            </Form.Item>
          </Space>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">只读字段采用灰色背景；可编辑字段支持表单校验与错误提示。</Text>
          </div>
        </Form>
      </Card>
    </Space>
  );
}

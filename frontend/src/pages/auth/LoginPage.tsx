import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Space, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

import { roleHomePath } from "../../router/menu";
import { useAuthStore } from "../../store/auth";
import type { Role } from "../../types";

const { Title, Text } = Typography;

const roleButtons: Array<{ role: Role; label: string }> = [
  { role: "enterprise", label: "企业用户" },
  { role: "city", label: "市级用户" },
  { role: "province", label: "省级用户" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const loginAsRole = useAuthStore((state) => state.loginAsRole);

  const doLogin = (role: Role) => {
    loginAsRole(role);
    message.success(`已模拟登录为${role === "enterprise" ? "企业" : role === "city" ? "市级" : "省级"}用户`);
    navigate(roleHomePath[role]);
  };

  return (
    <div className="login-shell">
      <div className="login-bg" />
      <Row justify="center" align="middle" style={{ minHeight: "100vh", position: "relative", zIndex: 2 }}>
        <Col xs={22} sm={18} md={14} lg={9}>
          <Card className="login-card" styles={{ body: { padding: 32 } }}>
            <Space direction="vertical" size={6} style={{ width: "100%", marginBottom: 24 }}>
              <Title level={3} style={{ marginBottom: 4 }}>
                云南省企业就业失业数据采集系统
              </Title>
              <Text type="secondary">课程作业演示版本 · 前端高保真原型</Text>
            </Space>

            <Form layout="vertical" requiredMark={false}>
              <Form.Item label="账号" name="username" rules={[{ required: true, message: "请输入账号" }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入账号" />
              </Form.Item>
              <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>
              <Form.Item label="验证码" name="captcha" rules={[{ required: true, message: "请输入验证码" }]}>
                <Input prefix={<SafetyCertificateOutlined />} placeholder="请输入验证码：6A9K" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" block onClick={() => doLogin("enterprise")}>
                  登录（企业）
                </Button>
              </Form.Item>
            </Form>

            <Space direction="vertical" style={{ width: "100%" }}>
              <Text type="secondary">快速角色体验</Text>
              <Space wrap>
                {roleButtons.map((item) => (
                  <Button key={item.role} onClick={() => doLogin(item.role)}>
                    {item.label}
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

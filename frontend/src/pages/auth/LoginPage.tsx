import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, Row, Skeleton, Space, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { roleHomePath } from "../../router/menu";
import { useAuthStore } from "../../store/auth";
import type { Role } from "../../types";

const { Title, Text } = Typography;

const makeCaptcha = () =>
  Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

const roleButtons: Array<{ role: Role; label: string }> = [
  { role: "enterprise", label: "企业用户" },
  { role: "city", label: "市级用户" },
  { role: "province", label: "省级用户" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const setSession = useAuthStore((state) => state.setSession);
  const loginAsRole = useAuthStore((state) => state.loginAsRole);
  const [captcha, setCaptcha] = useState(makeCaptcha());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 380);
    return () => window.clearTimeout(timer);
  }, []);

  const doLogin = (role: Role) => {
    loginAsRole(role);
    message.success(`已模拟登录为${role === "enterprise" ? "企业" : role === "city" ? "市级" : "省级"}用户`);
    navigate(roleHomePath[role]);
  };

  const refreshCaptcha = () => {
    setCaptcha(makeCaptcha());
    form.setFieldValue("captcha", "");
  };

  const onFinish = async (values: { username: string; password: string; captcha: string }) => {
    const username = values.username.trim();
    const password = values.password;

    if (values.captcha.trim().toUpperCase() !== captcha) {
      message.error("验证码错误");
      refreshCaptcha();
      return;
    }

    try {
      const loginResp = await api.login(username, password);
      const me = await api.me();
      setSession({
        token: loginResp.access_token,
        role: loginResp.role,
        user: {
          id: me.id,
          username: me.username,
          name: me.name,
          role: me.role,
          region: me.region,
          cityCode: me.city_code ?? null,
          enterpriseId: me.enterprise_id ?? null,
        },
      });
      message.success("登录成功");
      navigate(roleHomePath[loginResp.role]);
    } catch (error) {
      const text = error instanceof Error ? error.message : "登录失败";
      if (text.includes("锁定")) {
        message.warning(text);
      } else if (text.includes("停用")) {
        message.error("账号停用，请联系管理员");
      } else if (text.includes("未激活")) {
        message.warning("账号未激活，请联系管理员激活");
      } else {
        message.error(text);
      }
      refreshCaptcha();
    }
  };

  return (
    <div className="login-shell">
      <div className="login-bg" />
      <Row justify="center" align="middle" style={{ minHeight: "100vh", position: "relative", zIndex: 2 }}>
        <Col xs={22} sm={18} md={14} lg={9}>
          <Skeleton active loading={loading} paragraph={{ rows: 8 }}>
            <Card className="login-card" styles={{ body: { padding: 32 } }}>
              <Space direction="vertical" size={6} style={{ width: "100%", marginBottom: 24 }}>
                <Title level={3} style={{ marginBottom: 4 }}>
                  云南省企业就业失业数据采集系统
                </Title>
                <Text type="secondary">课程作业演示版本 · 前端高保真原型</Text>
              </Space>

              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message="测试账号：enterprise_user / city_reviewer / province_admin，密码均为 Passw0rd!"
              />

              <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
                <Form.Item label="账号" name="username" rules={[{ required: true, message: "请输入账号" }]}>
                  <Input prefix={<UserOutlined />} placeholder="请输入账号" />
                </Form.Item>
                <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
                  <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                </Form.Item>

                <Form.Item label="验证码" required>
                  <Space.Compact style={{ width: "100%" }}>
                    <Form.Item name="captcha" noStyle rules={[{ required: true, message: "请输入验证码" }]}>
                      <Input prefix={<SafetyCertificateOutlined />} placeholder="请输入验证码" />
                    </Form.Item>
                    <Button style={{ width: 112, fontWeight: 600, letterSpacing: 1 }} onClick={refreshCaptcha}>
                      {captcha}
                    </Button>
                  </Space.Compact>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    登录
                  </Button>
                </Form.Item>
              </Form>

              <Space direction="vertical" style={{ width: "100%" }}>
                <Text type="secondary">快速角色体验（跳过账号校验）</Text>
                <Space wrap>
                  {roleButtons.map((item) => (
                    <Button key={item.role} onClick={() => doLogin(item.role)}>
                      {item.label}
                    </Button>
                  ))}
                </Space>
              </Space>
            </Card>
          </Skeleton>
        </Col>
      </Row>
    </div>
  );
}

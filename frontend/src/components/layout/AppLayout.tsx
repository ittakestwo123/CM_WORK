import { LogoutOutlined } from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Layout, Menu, Space, Typography } from "antd";
import { useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { allRoutes, roleHomePath, roleMenuItems } from "../../router/menu";
import { useAuthStore } from "../../store/auth";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();

  const selectedKeys = [location.pathname];

  const breadcrumbItems = useMemo(() => {
    const current = allRoutes.find((item) => item.path === location.pathname);
    return [
      { title: <Link to={role ? roleHomePath[role] : "/app/home"}>首页</Link> },
      { title: current?.label ?? "页面" },
    ];
  }, [location.pathname, role]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={248} theme="light" className="app-sider">
        <div className="brand-block">
          <Title level={5} style={{ margin: 0 }}>
            云南省企业就业失业数据采集系统
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            演示原型版本
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={role ? roleMenuItems[role] : []}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: "none" }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Breadcrumb items={breadcrumbItems} />
          <Space>
            <Space size={8}>
              <Avatar style={{ background: "#3d5a80" }}>{user?.name?.slice(0, 1)}</Avatar>
              <div>
                <div style={{ lineHeight: 1.2 }}>{user?.name}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.region}
                </Text>
              </div>
            </Space>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

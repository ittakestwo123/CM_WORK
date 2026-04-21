import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Drawer, Layout, Menu, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useResponsive } from "../../hooks/useResponsive";
import { allRoutes, roleHomePath, roleMenuItems } from "../../router/menu";
import { useAuthStore } from "../../store/auth";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();

  const selectedKeys = [location.pathname];
  const { isMobile } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const breadcrumbItems = useMemo(() => {
    const current = allRoutes.find((item) => item.path === location.pathname);
    return [
      { title: <Link to={role ? roleHomePath[role] : "/app/home"}>首页</Link> },
      { title: current?.label ?? "页面" },
    ];
  }, [location.pathname, role]);

  useEffect(() => {
    const onAuthExpired = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("yn-auth-expired", onAuthExpired);
    return () => window.removeEventListener("yn-auth-expired", onAuthExpired);
  }, [logout, navigate]);

  const menuNode = (
    <>
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
          onClick={({ key }) => {
            navigate(key);
            setMenuOpen(false);
          }}
          style={{ borderInlineEnd: "none" }}
        />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isMobile ? (
        <Drawer
          className="app-mobile-drawer"
          title="导航菜单"
          placement="left"
          width={280}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          bodyStyle={{ padding: 0 }}
        >
          {menuNode}
        </Drawer>
      ) : (
        <Sider width={248} theme="light" className="app-sider">
          {menuNode}
        </Sider>
      )}
      <Layout>
        <Header className="app-header">
          <Space>
            {isMobile ? <Button icon={<MenuOutlined />} onClick={() => setMenuOpen(true)} /> : null}
            <Breadcrumb items={breadcrumbItems} />
          </Space>
          <Space>
            <Space size={8}>
              <Avatar style={{ background: "#2f4d69" }}>{user?.name?.slice(0, 1)}</Avatar>
              <div className="user-meta-block">
                <div className="user-meta-name">{user?.name}</div>
                <Text type="secondary" className="user-meta-region">
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

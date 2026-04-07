import { Card, Col, List, Row, Space, Tag, Typography } from "antd";

import { PageTitle } from "../../components/common/PageTitle";
import { StatGrid } from "../../components/common/StatGrid";
import { dashboardStatsByRole, recentActivities, surveyPeriods } from "../../mock/data";
import { useAuthStore } from "../../store/auth";

const { Text } = Typography;

export function HomePage() {
  const { role, user } = useAuthStore();
  const currentPeriod = surveyPeriods[3]?.periodName;

  if (!role || !user) {
    return null;
  }

  const quickActions: Record<typeof role, string[]> = {
    enterprise: ["企业备案信息", "数据填报", "企业数据查询", "通知浏览"],
    city: ["数据审核", "通知发布", "密码修改"],
    province: ["企业备案审批", "省级报表管理", "数据汇总", "图表分析", "系统管理"],
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageTitle title="工作台" desc={`欢迎，${user.name}。当前调查期：${currentPeriod}`} />
      <StatGrid items={dashboardStatsByRole[role]} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="快捷入口" className="soft-card">
            <Space wrap>
              {quickActions[role].map((action) => (
                <Tag key={action} color="blue" style={{ padding: "6px 10px", borderRadius: 16 }}>
                  {action}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="最近操作" className="soft-card">
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.text} description={<Text type="secondary">{item.time}</Text>} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

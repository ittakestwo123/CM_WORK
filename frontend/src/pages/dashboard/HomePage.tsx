import { Alert, Card, Col, Empty, List, Row, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import { api, type BackendNotice } from "../../api/client";
import { useResponsive } from "../../hooks/useResponsive";
import { PageTitle } from "../../components/common/PageTitle";
import { StatGrid } from "../../components/common/StatGrid";
import { dashboardStatsByRole, recentActivities } from "../../mock/data";
import { showActionMessage } from "../../utils/feedback";
import { useAuthStore } from "../../store/auth";

const { Text } = Typography;

export function HomePage() {
  const { role, user } = useAuthStore();
  const { isMobile } = useResponsive();
  const [currentPeriod, setCurrentPeriod] = useState("加载中...");
  const [noticeList, setNoticeList] = useState<BackendNotice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentOps, setRecentOps] = useState(recentActivities);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [periods, notices, unread] = await Promise.all([
          api.listCurrentPeriods(),
          api.listNotices(),
          api.noticeUnreadCount(),
        ]);
        setCurrentPeriod(periods.length > 0 ? periods.map((p) => p.period_name).join("、") : "当前无启用调查期");
        setNoticeList(notices.slice(0, 5));
        setUnreadCount(unread.unread_count);

        if (role === "province") {
          const logs = await api.listOperationLogs({ limit: 5 });
          if (logs.length > 0) {
            setRecentOps(
              logs.map((item) => ({
                id: String(item.id),
                text: `${item.user_name} 执行 ${item.operation_type}`,
                time: new Date(item.operation_time).toLocaleString(),
              })),
            );
          }
        }
      } catch (error) {
        setCurrentPeriod("调查期获取失败");
        showActionMessage("查询", error instanceof Error ? error.message : "工作台数据加载失败", "warning");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [role]);

  if (!role || !user) {
    return null;
  }

  const todoByRole: Record<typeof role, string[]> = {
    enterprise: ["检查备案状态与退回原因", "完成当前调查期填报", "确认历史报表状态", "处理未读通知"],
    city: ["优先处理待市审报表", "关注异常降幅企业", "跟踪退回整改进度", "发布辖区通知"],
    province: ["处理待备案审批事项", "完成省级审核与上报", "检查监控预警状态", "复核国家接口推送记录"],
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageTitle title="工作台" desc={`欢迎，${user.name}。当前调查期：${currentPeriod}`} />
      <StatGrid items={dashboardStatsByRole[role]} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={11}>
          <Card title="待办事项" className="soft-card" loading={loading}>
            <List
              size={isMobile ? "small" : "default"}
              dataSource={todoByRole[role]}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">待办</Tag>
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={13}>
          <Card title="最近操作" className="soft-card" loading={loading}>
            <List
              dataSource={recentOps}
              size={isMobile ? "small" : "default"}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.text} description={<Text type="secondary">{item.time}</Text>} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="通知摘要"
        className="soft-card"
        loading={loading}
        extra={<Tag color={unreadCount > 0 ? "red" : "green"}>未读 {unreadCount}</Tag>}
      >
        {unreadCount > 0 ? <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={`当前有 ${unreadCount} 条未读通知，请优先处理。`} /> : null}
        {noticeList.length === 0 ? (
          <Empty description="暂无通知" />
        ) : (
          <List
            size={isMobile ? "small" : "default"}
            dataSource={noticeList}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text>{item.title}</Text>
                      {item.read ? <Tag>已读</Tag> : <Tag color="red">未读</Tag>}
                    </Space>
                  }
                  description={<Text type="secondary">{new Date(item.created_at).toLocaleString()}</Text>}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );
}

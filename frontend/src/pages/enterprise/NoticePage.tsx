import { Card, Empty, List, Modal, Space, Typography, message } from "antd";
import { useEffect, useState } from "react";

import { api, type BackendNotice } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";

const { Text } = Typography;

export function EnterpriseNoticePage() {
  const [current, setCurrent] = useState<BackendNotice | null>(null);
  const [list, setList] = useState<BackendNotice[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await api.listNotices();
      setList(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载通知失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  const openNotice = async (notice: BackendNotice) => {
    try {
      const detail = await api.noticeDetail(notice.id);
      setCurrent(detail);
      if (!notice.read) {
        await api.markNoticeRead(notice.id);
        setList((prev) => prev.map((item) => (item.id === notice.id ? { ...item, read: true, read_count: item.read_count + 1 } : item)));
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载通知详情失败");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="通知浏览" desc="查看省市下发通知及公告。" />
      <Card className="soft-card section-card">
        <List
          loading={loading}
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          dataSource={list}
          renderItem={(item) => (
            <List.Item onClick={() => void openNotice(item)} style={{ cursor: "pointer" }}>
              <List.Item.Meta
                title={item.title}
                description={`发布时间：${new Date(item.created_at).toLocaleString()}  发布单位：${item.publisher_name}`}
              />
              <StatusTag status={item.read ? "已读" : "未读"} />
            </List.Item>
          )}
        />
      </Card>

      <Modal open={!!current} title={current?.title} onCancel={() => setCurrent(null)} onOk={() => setCurrent(null)}>
        <p>{current?.content}</p>
        <Text type="secondary">发布单位：{current?.publisher_name}</Text>
      </Modal>
    </Space>
  );
}

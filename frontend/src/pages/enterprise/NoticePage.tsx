import { Card, Empty, List, Modal, Space, Typography } from "antd";
import { useState } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { notices } from "../../mock/data";
import type { NoticeRecord } from "../../types";

const { Text } = Typography;

export function EnterpriseNoticePage() {
  const [current, setCurrent] = useState<NoticeRecord | null>(null);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="通知浏览" desc="查看省市下发通知及公告。" />
      <Card className="soft-card">
        <List
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          dataSource={notices}
          renderItem={(item) => (
            <List.Item onClick={() => setCurrent(item)} style={{ cursor: "pointer" }}>
              <List.Item.Meta
                title={item.title}
                description={`发布时间：${item.publishTime}  发布单位：${item.publisher}`}
              />
              <Text type={item.read ? "secondary" : undefined}>{item.read ? "已读" : "未读"}</Text>
            </List.Item>
          )}
        />
      </Card>

      <Modal open={!!current} title={current?.title} onCancel={() => setCurrent(null)} onOk={() => setCurrent(null)}>
        <p>{current?.content}</p>
        <Text type="secondary">发布单位：{current?.publisher}</Text>
      </Modal>
    </Space>
  );
}

import { Button, Card, Empty, Form, Input, Modal, Popconfirm, Space, Table, message } from "antd";
import { useMemo, useState } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { notices } from "../../mock/data";
import type { NoticeRecord } from "../../types";

interface Props {
  title: string;
  withStatus?: boolean;
}

export function NoticeManagePage({ title, withStatus = false }: Props) {
  const [list, setList] = useState<NoticeRecord[]>(notices);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NoticeRecord | null>(null);

  const columns = useMemo(
    () => [
      { title: "标题", dataIndex: "title" },
      { title: "发布时间", dataIndex: "publishTime" },
      { title: "发布单位", dataIndex: "publisher" },
      ...(withStatus ? [{ title: "状态", dataIndex: "status" }] : []),
      {
        title: "操作",
        render: (_: unknown, row: NoticeRecord) => (
          <Space>
            <Button type="link" onClick={() => { setEditing(row); setOpen(true); }}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除该通知吗？"
              onConfirm={() => {
                setList((prev) => prev.filter((item) => item.id !== row.id));
                message.success("已删除");
              }}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [withStatus],
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title={title} desc="支持通知新增、编辑、删除。" />
      <Card className="soft-card" extra={<Button type="primary" onClick={() => { setEditing(null); setOpen(true); }}>新增通知</Button>}>
        <Table rowKey="id" locale={{ emptyText: <Empty description="暂无通知" /> }} dataSource={list} columns={columns} />
      </Card>

      <Modal open={open} title={editing ? "编辑通知" : "新增通知"} onCancel={() => setOpen(false)} footer={null}>
        <Form
          layout="vertical"
          initialValues={editing ?? { publisher: "云南省人社厅" }}
          key={editing?.id ?? "new"}
          onFinish={(values) => {
            if (editing) {
              setList((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...values } : item)));
              message.success("已更新通知");
            } else {
              setList((prev) => [
                {
                  id: `n-${Date.now()}`,
                  publishTime: new Date().toLocaleString(),
                  status: "已发布",
                  ...values,
                },
                ...prev,
              ]);
              message.success("已新增通知");
            }
            setOpen(false);
          }}
        >
          <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="请输入通知标题" />
          </Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true, message: "请输入内容" }]}>
            <Input.TextArea rows={5} placeholder="请输入通知内容" />
          </Form.Item>
          <Form.Item label="发布单位" name="publisher" rules={[{ required: true, message: "请输入发布单位" }]}>
            <Input placeholder="请输入发布单位" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            保存
          </button>
        </Form>
      </Modal>
    </Space>
  );
}

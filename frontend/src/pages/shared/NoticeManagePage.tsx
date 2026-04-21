import { Button, Card, Empty, Form, Input, Modal, Popconfirm, Space, Table, message } from "antd";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendNotice } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { noticeTextLimits } from "../../mock/data";

interface Props {
  title: string;
  scope: "province" | "city";
  withStatus?: boolean;
}

interface NoticeFormValues {
  title: string;
  content: string;
}

export function NoticeManagePage({ title, scope, withStatus = false }: Props) {
  const [list, setList] = useState<BackendNotice[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BackendNotice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<NoticeFormValues>();

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = scope === "province" ? await api.listProvinceManageNotices() : await api.listCityManageNotices();
      setList(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载通知列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotices();
  }, [scope]);

  const submitForm = async (values: NoticeFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        const updated =
          scope === "province"
            ? await api.updateProvinceNotice(editing.id, values)
            : await api.updateCityNotice(editing.id, values);
        setList((prev) => prev.map((item) => (item.id === editing.id ? updated : item)));
        message.success("已更新通知");
      } else {
        const created =
          scope === "province" ? await api.createProvinceNotice(values) : await api.createCityNotice(values);
        setList((prev) => [created, ...prev]);
        message.success("已新增通知");
      }
      setOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存通知失败");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNotice = async (row: BackendNotice) => {
    try {
      if (scope === "province") {
        await api.deleteProvinceNotice(row.id);
      } else {
        await api.deleteCityNotice(row.id);
      }
      setList((prev) => prev.filter((item) => item.id !== row.id));
      message.success("已删除");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除通知失败");
    }
  };

  const columns = useMemo(
    () => [
      { title: "标题", dataIndex: "title" },
      {
        title: "发布时间",
        dataIndex: "created_at",
        render: (value: string) => new Date(value).toLocaleString(),
      },
      { title: "发布单位", dataIndex: "publisher_name" },
      ...(withStatus ? [{ title: "状态", render: () => <StatusTag status="已发布" /> }] : []),
      {
        title: "操作",
        render: (_: unknown, row: BackendNotice) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditing(row);
                form.setFieldsValue({ title: row.title, content: row.content });
                setOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm title="确认删除该通知吗？" onConfirm={() => void deleteNotice(row)}>
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
      <Card
        className="soft-card section-card"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            新增通知
          </Button>
        }
      >
        <Table rowKey="id" loading={loading} locale={{ emptyText: <Empty description="暂无通知" /> }} dataSource={list} columns={columns} />
      </Card>

      <Modal open={open} title={editing ? "编辑通知" : "新增通知"} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={(values) => void submitForm(values)}>
          <Form.Item
            label="标题"
            name="title"
            rules={[
              { required: true, message: "请输入标题" },
              { max: noticeTextLimits.title, message: `标题最多 ${noticeTextLimits.title} 字` },
            ]}
          >
            <Input placeholder="请输入通知标题" maxLength={noticeTextLimits.title} showCount />
          </Form.Item>
          <Form.Item
            label="内容"
            name="content"
            rules={[
              { required: true, message: "请输入内容" },
              { max: noticeTextLimits.content, message: `内容最多 ${noticeTextLimits.content} 字` },
            ]}
          >
            <Input.TextArea rows={5} placeholder="请输入通知内容" maxLength={noticeTextLimits.content} showCount />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            保存
          </Button>
        </Form>
      </Modal>
    </Space>
  );
}

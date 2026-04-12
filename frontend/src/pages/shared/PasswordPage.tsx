import { Alert, Card, Form, Input, Space } from "antd";

import { api } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { showActionMessage } from "../../utils/feedback";

interface Props {
  title: string;
}

export function PasswordPage({ title }: Props) {
  const [form] = Form.useForm();

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title={title} desc="请定期更换密码，确保账号安全。" />
      <Card className="soft-card" style={{ maxWidth: 560 }}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="密码修改会立即生效，建议包含大小写字母、数字和特殊符号。"
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.changePassword({ old_password: values.oldPwd, new_password: values.newPwd });
              showActionMessage("修改密码", "密码修改成功");
              form.resetFields();
            } catch (error) {
              showActionMessage("修改密码", error instanceof Error ? error.message : "密码修改失败", "error");
            }
          }}
        >
          <Form.Item label="原密码" name="oldPwd" rules={[{ required: true, message: "请输入原密码" }]}>
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPwd"
            rules={[{ required: true, message: "请输入新密码" }, { min: 8, message: "新密码至少 8 位" }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPwd"
            dependencies={["newPwd"]}
            rules={[
              { required: true, message: "请再次输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPwd") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            保存修改
          </button>
        </Form>
      </Card>
    </Space>
  );
}

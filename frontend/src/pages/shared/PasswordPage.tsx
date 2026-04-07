import { Card, Form, Input, Space, message } from "antd";

import { PageTitle } from "../../components/common/PageTitle";

interface Props {
  title: string;
}

export function PasswordPage({ title }: Props) {
  const [form] = Form.useForm();

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title={title} desc="请定期更换密码，确保账号安全。" />
      <Card className="soft-card" style={{ maxWidth: 560 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={() => {
            message.success("密码修改成功");
            form.resetFields();
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

import { message } from "antd";

type MessageType = "success" | "info" | "warning" | "error";

export function showActionMessage(action: string, detail?: string, type: MessageType = "success") {
  const text = detail ? `${action}：${detail}` : `${action}成功`;
  message[type](text);
}

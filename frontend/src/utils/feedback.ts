import { message } from "antd";

type MessageType = "success" | "info" | "warning" | "error";

export function showActionMessage(action: string, detail?: string, type: MessageType = "success") {
  const normalized = detail?.includes("认证令牌") ? "登录状态已失效，请重新登录" : detail;
  const text = normalized
    ? normalized.includes("登录状态已失效")
      ? normalized
      : `${action}：${normalized}`
    : `${action}成功`;
  message[type](text);
}

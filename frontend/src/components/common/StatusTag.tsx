import { Tag } from "antd";

const STATUS_COLOR_MAP: Record<string, string> = {
  未备案: "default",
  待备案: "gold",
  已备案: "green",
  备案退回: "red",
  草稿: "default",
  待市审: "processing",
  市审通过: "cyan",
  市审退回: "orange",
  待省审: "blue",
  省审通过: "green",
  省审退回: "red",
  已上报: "purple",
  已上报部委: "purple",
};

interface Props {
  status: string;
}

export function StatusTag({ status }: Props) {
  return <Tag color={STATUS_COLOR_MAP[status] ?? "default"}>{status}</Tag>;
}

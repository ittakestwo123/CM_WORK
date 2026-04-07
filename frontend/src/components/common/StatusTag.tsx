import { Tag } from "antd";

import { statusColorMap } from "../../mock/data";

interface Props {
  status: string;
}

export function StatusTag({ status }: Props) {
  return <Tag color={statusColorMap[status] ?? "default"}>{status}</Tag>;
}

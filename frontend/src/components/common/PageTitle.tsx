import { Space, Typography } from "antd";
import type { ReactNode } from "react";

const { Title, Text } = Typography;

interface Props {
  title: string;
  desc?: string;
  extra?: ReactNode;
}

export function PageTitle({ title, desc, extra }: Props) {
  return (
    <div className="page-header-block">
      <Space direction="vertical" size={2}>
        <Title level={4} className="page-title-text">
          {title}
        </Title>
        {desc ? <Text className="page-desc-text">{desc}</Text> : null}
      </Space>
      {extra ? <div className="page-header-extra">{extra}</div> : null}
    </div>
  );
}

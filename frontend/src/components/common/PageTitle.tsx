import { Typography } from "antd";

const { Title, Text } = Typography;

interface Props {
  title: string;
  desc?: string;
}

export function PageTitle({ title, desc }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Title level={4} style={{ marginBottom: 4 }}>
        {title}
      </Title>
      {desc ? <Text type="secondary">{desc}</Text> : null}
    </div>
  );
}

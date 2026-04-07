import { Card, Col, Row, Statistic, Typography } from "antd";

import type { DashboardStat } from "../../types";

const { Text } = Typography;

interface Props {
  items: DashboardStat[];
}

export function StatGrid({ items }: Props) {
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} sm={12} lg={6} key={item.title}>
          <Card className="soft-card">
            <Statistic title={item.title} value={item.value} suffix={item.suffix} />
            {item.trend ? <Text type="secondary">{item.trend}</Text> : null}
          </Card>
        </Col>
      ))}
    </Row>
  );
}

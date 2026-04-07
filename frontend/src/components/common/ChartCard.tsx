import ReactECharts from "echarts-for-react";
import { Card, Skeleton } from "antd";

interface Props {
  title: string;
  option: Record<string, unknown>;
  loading?: boolean;
  height?: number;
}

export function ChartCard({ title, option, loading = false, height = 320 }: Props) {
  return (
    <Card title={title} styles={{ body: { paddingTop: 8 } }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
      )}
    </Card>
  );
}

import ReactEChartsCore from "echarts-for-react/lib/core";
import { LineChart, PieChart } from "echarts/charts";
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { CSSProperties } from "react";

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  CanvasRenderer,
]);

interface EChartsCoreProps {
  option: Record<string, unknown>;
  style?: CSSProperties;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  autoResize?: boolean;
}

export default function EChartsCore(props: EChartsCoreProps) {
  return <ReactEChartsCore echarts={echarts} {...props} />;
}

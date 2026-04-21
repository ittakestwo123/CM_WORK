import * as ReactEChartsCoreModule from "echarts-for-react/lib/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
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
import type { CSSProperties, ComponentType } from "react";

echarts.use([
  BarChart,
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

const ReactEChartsCore = (
  (ReactEChartsCoreModule as unknown as { default?: ComponentType<Record<string, unknown>> }).default ??
  (ReactEChartsCoreModule as unknown as ComponentType<Record<string, unknown>>)
) as ComponentType<Record<string, unknown>>;

export default function EChartsCore(props: EChartsCoreProps) {
  return <ReactEChartsCore echarts={echarts} {...props} />;
}

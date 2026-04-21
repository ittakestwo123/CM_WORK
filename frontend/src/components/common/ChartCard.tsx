import { Card, Skeleton, Typography } from "antd";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

const ReactECharts = lazy(() => import("./EChartsCore"));
const { Text } = Typography;

interface Props {
  title: string;
  subtitle?: string;
  option: Record<string, unknown>;
  loading?: boolean;
  height?: number;
}

export function ChartCard({ title, subtitle, option, loading = false, height = 320 }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }

    let ticking = false;
    const observer = new ResizeObserver(() => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setResizeKey((v) => v + 1);
        ticking = false;
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card
      className="soft-card section-card"
      title={
        <div>
          <div>{title}</div>
          {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
        </div>
      }
      styles={{ body: { paddingTop: 8 } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div ref={wrapperRef}>
          <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
            <ReactECharts key={resizeKey} option={option} style={{ height, width: "100%" }} notMerge lazyUpdate autoResize />
          </Suspense>
        </div>
      )}
    </Card>
  );
}

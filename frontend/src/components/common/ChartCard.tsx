import { Card, Skeleton } from "antd";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

const ReactECharts = lazy(() => import("./EChartsCore"));

interface Props {
  title: string;
  option: Record<string, unknown>;
  loading?: boolean;
  height?: number;
}

export function ChartCard({ title, option, loading = false, height = 320 }: Props) {
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
    <Card title={title} styles={{ body: { paddingTop: 8 } }}>
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

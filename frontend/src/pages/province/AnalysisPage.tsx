import { Card, Form, Select, Space, Table, Tabs } from "antd";
import { useState } from "react";

import { ChartCard } from "../../components/common/ChartCard";
import { PageTitle } from "../../components/common/PageTitle";
import { surveyPeriods } from "../../mock/data";

const compareOption = {
  tooltip: { trigger: "axis" },
  legend: { data: ["建档期", "调查期"] },
  xAxis: { type: "category", data: ["昆明", "曲靖", "大理", "红河", "玉溪"] },
  yAxis: { type: "value" },
  series: [
    { name: "建档期", type: "line", smooth: true, data: [24000, 17000, 12000, 9800, 8800] },
    { name: "调查期", type: "line", smooth: true, data: [23200, 16500, 12150, 9520, 8610] },
  ],
};

const trendOption = {
  tooltip: { trigger: "axis" },
  xAxis: { type: "category", data: ["2026-01上", "2026-01下", "2026-02上", "2026-02下", "2026-03上", "2026-03下", "2026-04"] },
  yAxis: { type: "value" },
  series: [{ type: "line", smooth: true, areaStyle: {}, data: [81200, 80650, 79900, 79300, 78750, 78210, 77860] }],
};

export function ProvinceAnalysisPage() {
  const [loading] = useState(false);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="图表分析" desc="支持对比分析与趋势分析，图表与表格联动展示。" />
      <Tabs
        items={[
          {
            key: "compare",
            label: "对比分析",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card className="soft-card">
                  <Form layout="inline" style={{ rowGap: 8 }}>
                    <Form.Item label="调查期A">
                      <Select defaultValue="202603H2" style={{ width: 180 }} options={surveyPeriods.map((p) => ({ value: p.periodCode, label: p.periodName }))} />
                    </Form.Item>
                    <Form.Item label="调查期B">
                      <Select defaultValue="202604" style={{ width: 180 }} options={surveyPeriods.map((p) => ({ value: p.periodCode, label: p.periodName }))} />
                    </Form.Item>
                    <Form.Item label="分析维度">
                      <Select defaultValue="region" style={{ width: 180 }} options={[{ value: "region", label: "地区" }, { value: "nature", label: "企业性质" }, { value: "industry", label: "行业" }]} />
                    </Form.Item>
                  </Form>
                </Card>
                <ChartCard title="岗位对比趋势" option={compareOption} loading={loading} height={360} />
                <Card className="soft-card">
                  <Table
                    rowKey="metric"
                    pagination={false}
                    dataSource={[
                      { metric: "企业总数", valueA: 279, valueB: 281, ratio: "+0.7%" },
                      { metric: "建档期总岗位数", valueA: 81600, valueB: 81600, ratio: "0%" },
                      { metric: "调查期总岗位数", valueA: 78210, valueB: 77860, ratio: "-0.45%" },
                      { metric: "岗位减少总数", valueA: 3390, valueB: 3740, ratio: "+10.3%" },
                    ]}
                    columns={[
                      { title: "指标", dataIndex: "metric" },
                      { title: "调查期A", dataIndex: "valueA" },
                      { title: "调查期B", dataIndex: "valueB" },
                      { title: "变化占比", dataIndex: "ratio" },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: "trend",
            label: "趋势分析",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card className="soft-card">
                  <Form layout="inline">
                    <Form.Item label="连续调查期">
                      <Select mode="multiple" defaultValue={["202601H1", "202601H2", "202602H1", "202602H2", "202603H1", "202603H2", "202604"]} style={{ width: 520 }} options={surveyPeriods.map((p) => ({ value: p.periodCode, label: p.periodName }))} />
                    </Form.Item>
                  </Form>
                </Card>
                <ChartCard title="岗位总量趋势" option={trendOption} loading={loading} height={420} />
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
}

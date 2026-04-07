import { Card, Col, Form, Row, Select, Space, Statistic, Table } from "antd";

import { PageTitle } from "../../components/common/PageTitle";
import { surveyPeriods } from "../../mock/data";

const citySummary = [
  { key: "1", city: "昆明市", enterpriseCount: 128, baseTotal: 23800, surveyTotal: 23040 },
  { key: "2", city: "曲靖市", enterpriseCount: 84, baseTotal: 16210, surveyTotal: 15840 },
  { key: "3", city: "大理州", enterpriseCount: 67, baseTotal: 11800, surveyTotal: 12010 },
];

export function ProvinceSummaryPage() {
  const baseTotal = citySummary.reduce((sum, item) => sum + item.baseTotal, 0);
  const surveyTotal = citySummary.reduce((sum, item) => sum + item.surveyTotal, 0);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="数据汇总" desc="按调查期与地区维度进行统计汇总。" />
      <Card className="soft-card">
        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="调查期">
            <Select style={{ width: 220 }} defaultValue="202604" options={surveyPeriods.map((item) => ({ value: item.periodCode, label: item.periodName }))} />
          </Form.Item>
          <Form.Item label="地区维度">
            <Select style={{ width: 180 }} defaultValue="city" options={[{ value: "city", label: "地市" }, { value: "county", label: "区县" }]} />
          </Form.Item>
        </Form>

        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="企业总数" value={279} suffix="家" /></Card></Col>
          <Col span={6}><Card><Statistic title="建档期总岗位数" value={baseTotal} /></Card></Col>
          <Col span={6}><Card><Statistic title="调查期总岗位数" value={surveyTotal} /></Card></Col>
          <Col span={6}><Card><Statistic title="岗位变化总数" value={surveyTotal - baseTotal} /></Card></Col>
        </Row>

        <Table
          style={{ marginTop: 16 }}
          dataSource={citySummary}
          columns={[
            { title: "地市", dataIndex: "city" },
            { title: "企业总数", dataIndex: "enterpriseCount" },
            { title: "建档期总岗位数", dataIndex: "baseTotal" },
            { title: "调查期总岗位数", dataIndex: "surveyTotal" },
            { title: "变化", render: (_, row) => row.surveyTotal - row.baseTotal },
          ]}
        />
      </Card>
    </Space>
  );
}

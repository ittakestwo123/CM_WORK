import { Button, Card, Col, DatePicker, Empty, Form, Input, Row, Select, Space, Table } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { api, type ExportRowResp } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { showActionMessage } from "../../utils/feedback";

export function ProvinceExportPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [rows, setRows] = useState<ExportRowResp[]>([]);

  const buildQueryParams = () => {
    const values = form.getFieldsValue();
    return {
      unitName: values.unitName as string | undefined,
      account: values.account as string | undefined,
      userType: values.userType as string | undefined,
      city: values.city as string | undefined,
      county: values.county as string | undefined,
      area: values.area as string | undefined,
      reportStatus: values.status as
        | "草稿"
        | "待市审"
        | "待省审"
        | "市审退回"
        | "省审退回"
        | "省审通过"
        | "已上报部委"
        | undefined,
      unitNature: values.unitNature as string | undefined,
      industry: values.industry as string | undefined,
      periodCode: values.periodCode as string | undefined,
      statMonth: values.statMonth ? Number(values.statMonth) : undefined,
      statQuarter: values.statQuarter ? Number(values.statQuarter) : undefined,
      startTime: values.startDate ? dayjs(values.startDate).toISOString() : undefined,
      endTime: values.endDate ? dayjs(values.endDate).toISOString() : undefined,
    };
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await api.provinceExportQuery();
        setRows(data);
      } catch (error) {
        showActionMessage("查询", error instanceof Error ? error.message : "加载导出数据失败", "error");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const doQuery = async () => {
    const params = buildQueryParams();

    setLoading(true);
    try {
      const data = await api.provinceExportQuery(params);
      setRows(data);
      setSearched(true);
      if (data.length === 0) {
        showActionMessage("查询", "未查询到符合条件的数据，请调整筛选条件", "info");
      } else {
        showActionMessage("查询", `返回 ${data.length} 条记录`, "info");
      }
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "查询失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const doExport = async () => {
    if (rows.length === 0) {
      showActionMessage("导出", "暂无可导出数据", "warning");
      return;
    }
    try {
      const { blob, fileName } = await api.provinceExportXlsx(buildQueryParams());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `province_export_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showActionMessage("导出", "Excel 文件已下载", "success");
    } catch (error) {
      showActionMessage("导出", error instanceof Error ? error.message : "导出失败，请稍后重试", "error");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="数据查询与导出" desc="支持多条件筛选与导出演示。" />
      <Card className="soft-card" loading={loading}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8}><Form.Item label="单位名称" name="unitName"><Input placeholder="请输入单位名称" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="登录账号" name="account"><Input placeholder="请输入登录账号" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="用户类型" name="userType"><Select allowClear placeholder="请选择用户类型" options={[{ value: "enterprise", label: "企业" }, { value: "city", label: "市级" }, { value: "province", label: "省级" }]} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所属地市" name="city"><Input placeholder="请输入所属地市" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所属市县" name="county"><Input placeholder="请输入所属市县" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所处区域" name="area"><Input placeholder="请输入所处区域" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="数据状态" name="status"><Select placeholder="请选择数据状态" options={["草稿", "待市审", "待省审", "市审退回", "省审退回", "省审通过", "已上报部委"].map((v) => ({ value: v, label: v }))} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="单位性质" name="unitNature"><Input placeholder="请输入单位性质" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="所属行业" name="industry"><Input placeholder="请输入所属行业" /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="统计月份" name="statMonth"><Select allowClear placeholder="请选择月份" options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }))} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="统计季度" name="statQuarter"><Select allowClear placeholder="请选择季度" options={[1, 2, 3, 4].map((q) => ({ value: q, label: `第${q}季度` }))} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="起始日期" name="startDate"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="结束日期" name="endDate"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item label="调查期编码" name="periodCode"><Input placeholder="如 2026-04-M1" /></Form.Item></Col>
          </Row>
          <Space>
            <Button type="primary" onClick={() => void doQuery()}>
              查询
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setRows([]);
                setSearched(false);
              }}
            >
              清空
            </Button>
            <Button onClick={() => void doExport()}>导出 Excel</Button>
          </Space>
        </Form>
      </Card>

      <Card className="soft-card" loading={loading}>
        <Table
          rowKey="report_id"
          locale={{
            emptyText: <Empty description={searched ? "未查询到符合条件的数据，请调整筛选条件" : "暂无数据"} />,
          }}
          dataSource={rows}
          columns={[
            { title: "单位名称", dataIndex: "unit_name" },
            { title: "登录账号", dataIndex: "account" },
            { title: "用户类型", dataIndex: "user_type" },
            { title: "所属地市", dataIndex: "city" },
            { title: "所属市县", dataIndex: "county" },
            { title: "所处区域", dataIndex: "area" },
            { title: "单位性质", dataIndex: "unit_nature" },
            { title: "所属行业", dataIndex: "industry" },
            { title: "数据状态", dataIndex: "status" },
            { title: "调查期", dataIndex: "period_name" },
            { title: "统计月份", dataIndex: "stat_month" },
            { title: "统计季度", dataIndex: "stat_quarter" },
            { title: "建档期就业", dataIndex: "base_employment" },
            { title: "调查期就业", dataIndex: "survey_employment" },
          ]}
        />
      </Card>
    </Space>
  );
}

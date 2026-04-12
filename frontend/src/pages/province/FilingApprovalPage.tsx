import { Button, Card, Descriptions, Drawer, Empty, Form, Input, Modal, Select, Space, Table } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendFiling, type BackendPeriod } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { showActionMessage } from "../../utils/feedback";

export function ProvinceFilingApprovalPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({ status: "已备案" });
  const [periods, setPeriods] = useState<BackendPeriod[]>([]);
  const [rejectTarget, setRejectTarget] = useState<BackendFiling | null>(null);
  const [detail, setDetail] = useState<BackendFiling | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<BackendFiling[]>([]);
  const [filterForm] = Form.useForm();

  const loadFilings = async (nextFilters?: Record<string, string | undefined>) => {
    const current = nextFilters ?? filters;
    setLoading(true);
    try {
      const data = await api.listFilings({
        filingStatus: current.status as "未备案" | "待备案" | "已备案" | "备案退回" | undefined,
        name: current.name,
        region: current.region,
        periodCode: current.periodCode,
      });
      setList(data);
    } catch (error) {
      const text = error instanceof Error ? error.message : "加载备案列表失败";
      showActionMessage("查询", text, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.listPeriods();
        setPeriods(data);
      } catch (error) {
        const text = error instanceof Error ? error.message : "加载调查期失败";
        showActionMessage("查询", text, "warning");
      }
      await loadFilings({ status: "已备案" });
    };
    void init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFilters = Boolean(filters.periodCode || filters.region || filters.name || filters.status);
  const periodOptions = useMemo(
    () => periods.map((item) => ({ value: item.period_code, label: item.period_name })),
    [periods],
  );

  const openDetail = async (enterpriseId: number) => {
    setDetailLoading(true);
    try {
      const data = await api.filingDetail(enterpriseId);
      setDetail(data);
    } catch (error) {
      const text = error instanceof Error ? error.message : "加载备案详情失败";
      showActionMessage("查询", text, "error");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageTitle title="企业备案审批" desc="省级对企业备案进行查看、通过或退回。" />
      <Card
        className="soft-card"
        loading={loading}
        extra={
          <Button
            onClick={async () => {
              try {
                const values = filters;
                const { blob, fileName } = await api.provinceFilingExportXlsx({
                  filingStatus: values.status as "未备案" | "待备案" | "已备案" | "备案退回" | undefined,
                  name: values.name,
                  region: values.region,
                  periodCode: values.periodCode,
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName || `province_filing_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
                showActionMessage("导出", "备案列表 Excel 已下载", "success");
              } catch (error) {
                showActionMessage("导出", error instanceof Error ? error.message : "导出失败", "error");
              }
            }}
          >
            导出 Excel
          </Button>
        }
      >
        <Form
          form={filterForm}
          initialValues={{ status: "已备案" }}
          layout="inline"
          onValuesChange={(_, allValues) => setFilters(allValues)}
          style={{ marginBottom: 16, rowGap: 8 }}
        >
          <Form.Item label="调查期" name="periodCode">
            <Select allowClear style={{ width: 220 }} placeholder="请选择调查期" options={periodOptions} />
          </Form.Item>
          <Form.Item label="地区" name="region">
            <Input style={{ width: 160 }} placeholder="请输入地区" />
          </Form.Item>
          <Form.Item label="企业名称" name="name">
            <Input style={{ width: 180 }} placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item label="备案状态" name="status">
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="请选择备案状态"
              options={["待备案", "已备案", "备案退回", "未备案"].map((item) => ({ value: item, label: item }))}
            />
          </Form.Item>
          <Button
            type="primary"
            onClick={async () => {
              const values = filterForm.getFieldsValue();
              setFilters(values);
              await loadFilings(values);
            }}
          >
            查询
          </Button>
        </Form>

        <Table
          rowKey="id"
          locale={{
            emptyText: <Empty description={hasFilters ? "未查询到符合条件的数据，请调整筛选条件" : "暂无备案数据"} />,
          }}
          dataSource={list}
          columns={[
            { title: "企业名称", dataIndex: "name" },
            { title: "组织机构代码", dataIndex: "organization_code" },
            { title: "所属地区", dataIndex: "city_name" },
            { title: "联系人", dataIndex: "contact_person" },
            { title: "备案状态", dataIndex: "filing_status", render: (v: string) => <StatusTag status={v} /> },
            {
              title: "操作",
              render: (_, row) => (
                <Space>
                  <Button type="link" onClick={() => void openDetail(row.id)}>
                    查看
                  </Button>
                  <Button
                    type="link"
                    onClick={async () => {
                      try {
                        await api.approveFiling(row.id);
                        showActionMessage("审核通过", row.name ?? String(row.id));
                        await loadFilings(filters);
                      } catch (error) {
                        const text = error instanceof Error ? error.message : "审核失败";
                        showActionMessage("审核通过", text, "error");
                      }
                    }}
                  >
                    审核通过
                  </Button>
                  <Button type="link" danger onClick={() => setRejectTarget(row)}>
                    退回
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="退回备案" open={!!rejectTarget} onCancel={() => setRejectTarget(null)} footer={null}>
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.rejectFiling(rejectTarget!.id, values.reason);
              showActionMessage("退回", `${rejectTarget?.name ?? rejectTarget?.id}（原因：${values.reason}）`, "warning");
              setRejectTarget(null);
              await loadFilings(filters);
            } catch (error) {
              const text = error instanceof Error ? error.message : "退回失败";
              showActionMessage("退回", text, "error");
            }
          }}
        >
          <Form.Item label="退回原因" name="reason" rules={[{ required: true, message: "请填写退回原因" }]}>
            <Input.TextArea rows={4} placeholder="请输入退回原因" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            提交
          </button>
        </Form>
      </Modal>

      <Drawer
        title="企业备案详情"
        width={560}
        open={!!detail}
        onClose={() => setDetail(null)}
      >
        {detailLoading ? (
          <div>加载中...</div>
        ) : detail ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="企业名称">{detail.name ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="组织机构代码">{detail.organization_code ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="所属地区">{detail.city_name ?? detail.city_code ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="企业性质">{detail.nature ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="所属行业">{detail.industry ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="主要经营业务">{detail.business_scope ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="联系人">{detail.contact_person ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="联系地址">{detail.contact_address ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{detail.phone ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="传真">{detail.fax ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{detail.email ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="备案状态">{detail.filing_status}</Descriptions.Item>
            <Descriptions.Item label="退回原因">{detail.filing_reject_reason ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </Space>
  );
}

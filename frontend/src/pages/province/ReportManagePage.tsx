import { Button, Card, Col, Descriptions, Drawer, Empty, Form, Input, Modal, Row, Select, Space, Table, Timeline } from "antd";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendReport } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { useResponsive } from "../../hooks/useResponsive";
import { decreaseReasonMap, decreaseTypeOptions } from "../../mock/data";
import { showActionMessage } from "../../utils/feedback";

export function ProvinceReportManagePage() {
  const [editForm] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [detail, setDetail] = useState<BackendReport | null>(null);
  const [editTarget, setEditTarget] = useState<BackendReport | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BackendReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackendReport | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<BackendReport[]>([]);
  const { isMobile } = useResponsive();
  const editBaseEmployment = Number(Form.useWatch("baseEmployment", editForm) ?? 0);
  const editSurveyEmployment = Number(Form.useWatch("surveyEmployment", editForm) ?? 0);
  const editDecreaseType = Form.useWatch("decreaseType", editForm) as string | undefined;
  const editDecreaseReason = Form.useWatch("decreaseReason", editForm) as string | undefined;

  const editShowDecrease = editSurveyEmployment < editBaseEmployment;
  const editReasonOptions = useMemo(
    () => (editDecreaseType ? (decreaseReasonMap[editDecreaseType] ?? []).map((item) => ({ value: item, label: item })) : []),
    [editDecreaseType],
  );
  const editOtherNoteRequired = editShowDecrease && (editDecreaseType === "其他" || editDecreaseReason === "其他");

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.listProvinceReports();
      setReports(data);
    } catch (error) {
      const text = error instanceof Error ? error.message : "加载省级报表管理列表失败";
      showActionMessage("查询", text, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const hasFilters = Boolean(filters.periodCode || filters.enterpriseName || filters.status);

  const data = useMemo(
    () =>
      reports.filter((item) => {
        if (filters.periodCode && item.period_code !== filters.periodCode) return false;
        if (filters.enterpriseName && !(item.enterprise_name ?? "").includes(filters.enterpriseName)) return false;
        if (filters.status && item.status !== filters.status) return false;
        return true;
      }),
    [reports, filters],
  );

  const periodOptions = useMemo(() => {
    const map = new Map<string, string>();
    reports.forEach((item) => {
      if (!map.has(item.period_code)) map.set(item.period_code, item.period_name ?? item.period_code);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [reports]);

  const onApprove = async (report: BackendReport) => {
    try {
      await api.provinceApprove(report.id);
      showActionMessage("审核通过", report.enterprise_name ?? `报表${report.id}`);
      await loadReports();
    } catch (error) {
      const text = error instanceof Error ? error.message : "审核失败";
      showActionMessage("审核通过", text, "error");
    }
  };

  const onSubmitMinistry = async (report: BackendReport) => {
    try {
      await api.provinceSubmit(report.id);
      showActionMessage("上报部委", report.enterprise_name ?? `报表${report.id}`);
      await loadReports();
    } catch (error) {
      const text = error instanceof Error ? error.message : "上报失败";
      showActionMessage("上报部委", text, "error");
    }
  };

  const askDelete = async (report: BackendReport) => {
    try {
      const check = await api.provinceDeleteCheck(report.id);
      if (!check.allowed) {
        Modal.error({
          title: "禁止删除",
          content: check.reason ?? "当前数据禁止删除",
          okText: "我知道了",
        });
        return;
      }
      setDeleteReason("");
      setDeleteTarget(report);
    } catch (error) {
      const text = error instanceof Error ? error.message : "删除校验失败";
      showActionMessage("删除校验", text, "error");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="省级报表管理" desc="支持省审通过、退回修改、数据修订与上报部委。" />
      <Card className="soft-card filter-panel" loading={loading}>
        <Form layout="inline" onValuesChange={(_, values) => setFilters(values)} style={{ marginBottom: 16, rowGap: 8 }}>
          <Form.Item label="调查期" name="periodCode">
            <Select allowClear style={{ width: 220 }} placeholder="请选择调查期" options={periodOptions} />
          </Form.Item>
          <Form.Item label="企业名称" name="enterpriseName">
            <Input style={{ width: 180 }} placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item label="报表状态" name="status">
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="请选择报表状态"
              options={["待省审", "省审通过", "省审退回", "已上报部委", "待市审"].map((item) => ({
                value: item,
                label: item,
              }))}
            />
          </Form.Item>
        </Form>

        {isMobile ? (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {data.length === 0 ? <Empty description={hasFilters ? "未查询到符合条件的数据，请调整筛选条件" : "暂无报表数据"} /> : null}
            {data.map((row) => (
                <Card key={row.id} size="small" className="soft-card section-card" title={row.enterprise_name ?? `企业${row.enterprise_id}`}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>调查期：{row.period_name}</div>
                  <div>建档期：{row.base_employment} / 调查期：{row.survey_employment}</div>
                  <StatusTag status={row.status} />
                  <Space wrap>
                      <Button size="small" onClick={() => setDetail(row)}>
                      查看
                    </Button>
                      <Button size="small" type="primary" onClick={() => onApprove(row)}>
                      审核通过
                    </Button>
                      <Button size="small" onClick={() => onSubmitMinistry(row)}>
                        上报部委
                      </Button>
                      <Button size="small" onClick={() => setEditTarget(row)}>
                        数据修改
                      </Button>
                      <Button size="small" danger onClick={() => setRejectTarget(row)}>
                      退回修改
                    </Button>
                      <Button size="small" danger onClick={() => askDelete(row)}>
                      历史数据删除
                    </Button>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        ) : (
          <Table
            rowKey="id"
            locale={{
              emptyText: <Empty description={hasFilters ? "未查询到符合条件的数据，请调整筛选条件" : "暂无报表数据"} />,
            }}
            dataSource={data}
            columns={[
              { title: "企业名称", dataIndex: "enterprise_name" },
              { title: "调查期", dataIndex: "period_name" },
              { title: "建档期就业人数", dataIndex: "base_employment" },
              { title: "调查期就业人数", dataIndex: "survey_employment" },
              { title: "状态", dataIndex: "status", render: (v: string) => <StatusTag status={v} /> },
              { title: "市级审核时间", dataIndex: "city_reviewed_at", render: (v?: string | null) => v ?? "-" },
              {
                title: "操作",
                render: (_, row) => (
                  <Space wrap>
                    <Button size="small" onClick={() => setDetail(row)}>
                      查看
                    </Button>
                    <Button size="small" type="primary" onClick={() => onApprove(row)}>
                      审核通过
                    </Button>
                    <Button size="small" onClick={() => onSubmitMinistry(row)}>
                      上报部委
                    </Button>
                    <Button size="small" onClick={() => setEditTarget(row)}>
                      数据修改
                    </Button>
                    <Button size="small" danger onClick={() => setRejectTarget(row)}>
                      退回修改
                    </Button>
                    <Button size="small" danger onClick={() => askDelete(row)}>
                      历史数据删除
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Drawer width={isMobile ? "100%" : 780} title="报表详情" open={!!detail} onClose={() => setDetail(null)}>
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="企业基础信息">
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="企业名称">{detail.enterprise_name ?? `企业${detail.enterprise_id}`}</Descriptions.Item>
                    <Descriptions.Item label="所属地区">{detail.region ?? "-"}</Descriptions.Item>
                    <Descriptions.Item label="调查期">{detail.period_name}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="报表信息">
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="建档期就业人数">{detail.base_employment}</Descriptions.Item>
                    <Descriptions.Item label="调查期就业人数">{detail.survey_employment}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <StatusTag status={detail.status} />
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            <Card size="small" title="原因说明">
              {detail.decrease_reason_detail ?? "无"}
            </Card>
            <Card size="small" title="审核流转记录">
              <Timeline
                items={[
                  { children: "草稿" },
                  { children: "企业上报" },
                  { children: "市级审核通过" },
                  { children: `省级处理：${detail.status}` },
                ]}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal title="数据修改" open={!!editTarget} onCancel={() => setEditTarget(null)} footer={null}>
        <Form
          form={editForm}
          layout="vertical"
          key={editTarget?.id ?? "edit"}
          initialValues={{
            baseEmployment: editTarget?.base_employment,
            surveyEmployment: editTarget?.survey_employment,
            decreaseType: editTarget?.decrease_type ?? undefined,
            decreaseReason: editTarget?.decrease_reason ?? undefined,
            decreaseReasonDetail: editTarget?.decrease_reason_detail ?? undefined,
            otherNote: editTarget?.other_note ?? undefined,
          }}
          onFinish={async (values) => {
            try {
              await api.provinceModify(editTarget!.id, {
                base_employment: Number(values.baseEmployment),
                survey_employment: Number(values.surveyEmployment),
                decrease_type: values.decreaseType,
                decrease_reason: values.decreaseReason,
                decrease_reason_detail: values.decreaseReasonDetail,
                other_note: values.otherNote,
                reason: values.modifyReason,
              });
              showActionMessage("保存", `已保存修订值：建档期 ${values.baseEmployment}，调查期 ${values.surveyEmployment}`);
              setEditTarget(null);
              await loadReports();
            } catch (error) {
              const text = error instanceof Error ? error.message : "保存修改失败";
              showActionMessage("保存", text, "error");
            }
          }}
        >
          <Form.Item label="建档期就业人数" name="baseEmployment" rules={[{ required: true, message: "请输入建档期人数" }]}>
            <Input type="number" placeholder="请输入建档期就业人数" />
          </Form.Item>
          <Form.Item label="调查期就业人数" name="surveyEmployment" rules={[{ required: true, message: "请输入调查期人数" }]}>
            <Input type="number" placeholder="请输入调查期就业人数" />
          </Form.Item>
          <Form.Item label="减少类型" name="decreaseType" rules={editShowDecrease ? [{ required: true, message: "就业人数减少时请选择减少类型" }] : []}>
            <Select
              allowClear
              placeholder="请选择减少类型"
              options={decreaseTypeOptions}
              onChange={() => editForm.setFieldValue("decreaseReason", undefined)}
            />
          </Form.Item>
          <Form.Item label="主要原因" name="decreaseReason" rules={editShowDecrease ? [{ required: true, message: "就业人数减少时请选择主要原因" }] : []}>
            <Select
              allowClear
              placeholder={editDecreaseType ? "请选择主要原因" : "请先选择减少类型"}
              options={editReasonOptions}
              disabled={!editDecreaseType}
            />
          </Form.Item>
          <Form.Item label="主要原因说明" name="decreaseReasonDetail" rules={editShowDecrease ? [{ required: true, message: "就业人数减少时请填写主要原因说明" }] : []}>
            <Input placeholder="请输入主要原因说明" />
          </Form.Item>
          <Form.Item label="其他说明" name="otherNote" rules={editOtherNoteRequired ? [{ required: true, message: "选择“其他”时请填写补充说明" }] : []}>
            <Input placeholder="当类型或原因为其他时必填" />
          </Form.Item>
          <Form.Item label="修改原因" name="modifyReason" rules={[{ required: true, message: "请填写修改原因" }]}>
            <Input.TextArea rows={3} placeholder="请输入修改原因" />
          </Form.Item>
          <button className="btn-primary" type="submit">
            保存修改
          </button>
        </Form>
      </Modal>

      <Drawer
        placement="bottom"
        height={isMobile ? 280 : 320}
        open={!!rejectTarget}
        title="退回修改"
        onClose={() => setRejectTarget(null)}
      >
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.provinceReject(rejectTarget!.id, values.reason);
              showActionMessage("退回", `${rejectTarget?.enterprise_name ?? rejectTarget?.id}（原因：${values.reason}）`, "warning");
              setRejectTarget(null);
              await loadReports();
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
            确认退回
          </button>
        </Form>
      </Drawer>

      <Modal
        title="历史数据删除"
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onOk={async () => {
          try {
            await api.provinceDelete(deleteTarget!.id, deleteReason.trim() || "省级管理删除");
            showActionMessage("删除", `${deleteTarget?.enterprise_name ?? deleteTarget?.id}`);
            setDeleteTarget(null);
            setDeleteReason("");
            await loadReports();
          } catch (error) {
            const text = error instanceof Error ? error.message : "删除失败";
            showActionMessage("删除", text, "error");
          }
        }}
        okText="确认删除"
        okType="danger"
        cancelText="取消"
      >
        <p style={{ color: "#cf1322", marginBottom: 8 }}>该操作将执行真实删除逻辑，删除前会进行后端校验。</p>
        <Input value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder="请输入删除原因（必填）" />
      </Modal>
    </Space>
  );
}

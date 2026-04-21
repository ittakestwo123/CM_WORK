import { Alert, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { api, type BackendPeriod, type BackendReport } from "../../api/client";
import { useResponsive } from "../../hooks/useResponsive";
import { PageTitle } from "../../components/common/PageTitle";
import { decreaseReasonMap, decreaseTypeOptions } from "../../mock/data";
import { showActionMessage } from "../../utils/feedback";
import { StatusTag } from "../../components/common/StatusTag";

const { Text, Title } = Typography;

export function EnterpriseReportingPage() {
  const [form] = Form.useForm();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<BackendPeriod[]>([]);
  const [filed, setFiled] = useState(false);
  const [filingStatus, setFilingStatus] = useState<string>("未备案");
  const [filingRejectReason, setFilingRejectReason] = useState<string | null>(null);
  const [existingReport, setExistingReport] = useState<BackendReport | null>(null);

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const filing = await api.getMyFiling();
      setFilingStatus(filing.filing_status);
      setFilingRejectReason(filing.filing_reject_reason ?? null);
      const approved = filing.filing_status === "已备案";
      setFiled(approved);

      if (!approved) {
        setPeriods([]);
        setExistingReport(null);
        return;
      }

      const currentPeriods = await api.listAvailableReportPeriods();
      setPeriods(currentPeriods);
      if (currentPeriods.length > 0) {
        form.setFieldValue("periodCode", currentPeriods[0].period_code);
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "加载填报数据失败";
      showActionMessage("查询", text, "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPeriodCode = Form.useWatch("periodCode", form);
  const baseEmployment = Form.useWatch("baseEmployment", form) ?? 0;
  const surveyEmployment = Form.useWatch("surveyEmployment", form) ?? 0;
  const selectedDecreaseType = Form.useWatch("decreaseType", form) as string | undefined;
  const selectedDecreaseReason = Form.useWatch("decreaseReason", form) as string | undefined;
  const showDecrease = surveyEmployment < baseEmployment;
  const reasonOptions = useMemo(
    () => (selectedDecreaseType ? (decreaseReasonMap[selectedDecreaseType] ?? []).map((item) => ({ value: item, label: item })) : []),
    [selectedDecreaseType],
  );
  const otherNoteRequired = showDecrease && (selectedDecreaseType === "其他" || selectedDecreaseReason === "其他");

  const selectedPeriod = useMemo(
    () => periods.find((item) => item.period_code === selectedPeriodCode),
    [periods, selectedPeriodCode],
  );

  const inSurveyPeriod = useMemo(() => {
    if (!selectedPeriod) return false;
    const now = dayjs();
    return now.isAfter(dayjs(selectedPeriod.start_time).startOf("day").subtract(1, "second")) &&
      now.isBefore(dayjs(selectedPeriod.end_time).endOf("day").add(1, "second"));
  }, [selectedPeriod]);

  useEffect(() => {
    const fetchCurrentReport = async () => {
      if (!selectedPeriodCode) return;
      try {
        const report = await api.getCurrentPeriodReport(selectedPeriodCode);
        setExistingReport(report);
        if (report) {
          form.setFieldsValue({
            baseEmployment: report.base_employment,
            surveyEmployment: report.survey_employment,
            decreaseType: report.decrease_type ?? undefined,
            decreaseReason: report.decrease_reason ?? undefined,
            decreaseReasonDetail: report.decrease_reason_detail ?? undefined,
            otherNote: report.other_note ?? undefined,
          });
        }
      } catch (error) {
        const text = error instanceof Error ? error.message : "加载当前调查期填报失败";
        showActionMessage("查询", text, "warning");
      }
    };
    fetchCurrentReport();
  }, [selectedPeriodCode, form]);

  const editableStatuses = ["草稿", "市审退回", "省审退回"];
  const canEditCurrentPeriod = !existingReport || editableStatuses.includes(existingReport.status as string);
  const actionDisabled = !filed || !inSurveyPeriod || !canEditCurrentPeriod;

  const changeHint = useMemo(() => {
    const diff = surveyEmployment - baseEmployment;
    if (diff === 0) return "岗位数量持平";
    if (diff > 0) return `岗位增加 ${diff} 人`;
    return `岗位减少 ${Math.abs(diff)} 人`;
  }, [baseEmployment, surveyEmployment]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="企业数据填报" desc="按调查期填报就业岗位数据，支持暂存与正式上报。" extra={<StatusTag status={existingReport?.status ?? "草稿"} />} />
      {filingStatus === "未备案" ? <Alert type="error" showIcon message="请先提交备案并通过省级审核后再填报" /> : null}
      {filingStatus === "待备案" ? <Alert type="info" showIcon message="备案已提交，待省级审核通过后才可进行数据填报" /> : null}
      {filingStatus === "备案退回" ? <Alert type="error" showIcon message={`备案已退回：${filingRejectReason ?? "请修改备案信息后重新提交"}`} /> : null}
      {filed && selectedPeriodCode && !inSurveyPeriod ? <Alert type="warning" showIcon message="不在填报期内" /> : null}
      {existingReport && !canEditCurrentPeriod ? (
        <Alert
          type="warning"
          showIcon
          message={`当前调查期状态为“${existingReport.status}”，仅草稿/市审退回/省审退回可继续编辑`}
        />
      ) : null}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="soft-card section-card" loading={loading}>
            <Form form={form} layout="vertical" initialValues={{ baseEmployment: 300, surveyEmployment: 300 }}>
              <Form.Item label="调查期" name="periodCode" rules={[{ required: true, message: "请选择调查期" }]}>
                <Select
                  showSearch
                  placeholder="请选择调查期"
                  options={periods.map((item) => ({ value: item.period_code, label: item.period_name }))}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="建档期就业人数" name="baseEmployment" rules={[{ required: true, message: "请输入建档期人数" }]}>
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="请输入建档期就业人数" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="调查期就业人数" name="surveyEmployment" rules={[{ required: true, message: "请输入调查期人数" }]}>
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="请输入调查期就业人数" />
                  </Form.Item>
                </Col>
              </Row>

              {showDecrease ? (
                  <Card size="small" className="decrease-card">
                  <Title level={5} style={{ marginBottom: 12 }}>
                    减员信息（必填）
                  </Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item label="就业人数减少类型" name="decreaseType" rules={[{ required: true, message: "请选择减少类型" }]}>
                        <Select
                          placeholder="请选择减少类型"
                          options={decreaseTypeOptions}
                          onChange={() => form.setFieldValue("decreaseReason", undefined)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="主要原因" name="decreaseReason" rules={[{ required: true, message: "请选择主要原因" }]}>
                        <Select
                          placeholder={selectedDecreaseType ? "请选择主要原因" : "请先选择减少类型"}
                          options={reasonOptions}
                          disabled={!selectedDecreaseType}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="主要原因说明" name="decreaseReasonDetail" rules={[{ required: true, message: "请输入主要原因说明" }]}>
                        <Input placeholder="请输入主要原因说明" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="其他说明" name="otherNote" rules={otherNoteRequired ? [{ required: true, message: "请选择“其他”时请填写补充说明" }] : []}>
                        <Input placeholder="当减少类型/原因为“其他”时必填" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ) : null}

              <Space className={isMobile ? "mobile-action-bar" : undefined}>
                <button
                  className="btn-outline"
                  type="button"
                  disabled={actionDisabled}
                  onClick={() => {
                    form
                      .validateFields()
                      .then(async (values) => {
                        await api.saveReport({
                          period_code: values.periodCode,
                          base_employment: values.baseEmployment,
                          survey_employment: values.surveyEmployment,
                          decrease_type: values.decreaseType,
                          decrease_reason: values.decreaseReason,
                          decrease_reason_detail: values.decreaseReasonDetail,
                          other_note: values.otherNote,
                        });
                        showActionMessage("暂存", "已保存当前填报草稿", "info");
                      })
                      .catch(() => undefined);
                  }}
                >
                  暂存
                </button>
                <button
                  className="btn-primary"
                  type="button"
                  disabled={actionDisabled}
                  onClick={() => {
                    if (actionDisabled) {
                      message.warning("当前不可上报，请先处理页面提示项");
                      return;
                    }
                    form
                      .validateFields()
                      .then(async (values) => {
                        await api.submitReport({
                          period_code: values.periodCode,
                          base_employment: values.baseEmployment,
                          survey_employment: values.surveyEmployment,
                          decrease_type: values.decreaseType,
                          decrease_reason: values.decreaseReason,
                          decrease_reason_detail: values.decreaseReasonDetail,
                          other_note: values.otherNote,
                        });
                        showActionMessage("上报", "报表已提交，状态变更为待市审");
                        const latest = await api.getCurrentPeriodReport(values.periodCode);
                        setExistingReport(latest);
                      })
                      .catch((error) => {
                        if (error instanceof Error && error.message) {
                          showActionMessage("上报", error.message, "error");
                        }
                      });
                  }}
                >
                  上报
                </button>
              </Space>
            </Form>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Card className="soft-card section-card" title="人数变化提示卡" loading={loading}>
              <Text>{changeHint}</Text>
              <div style={{ marginTop: 12 }}>
                <Alert
                  type={showDecrease ? "warning" : "success"}
                  showIcon
                  message={showDecrease ? "检测到减员，需补充减员信息" : "当前无需填写减员信息"}
                />
              </div>
            </Card>
            <Card className="soft-card section-card" title="填报说明" loading={loading}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>1-3 月支持上半月、下半月两个调查期。</li>
                <li>其他月份为月度调查期。</li>
                <li>减员时必须填写减少类型和原因说明。</li>
              </ul>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}

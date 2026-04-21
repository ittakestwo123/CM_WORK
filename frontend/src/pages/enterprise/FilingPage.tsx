import { Alert, Card, Cascader, Col, Form, Input, Row, Skeleton, Space, Typography } from "antd";
import { useEffect, useState } from "react";

import { api, type BackendFiling } from "../../api/client";
import { useResponsive } from "../../hooks/useResponsive";
import { PageTitle } from "../../components/common/PageTitle";
import { contactAddressOptions, industryOptions, natureOptions } from "../../mock/data";
import { useAuthStore } from "../../store/auth";
import { showActionMessage } from "../../utils/feedback";

const { Text } = Typography;

export function EnterpriseFilingPage() {
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [filingStatus, setFilingStatus] = useState<BackendFiling["filing_status"]>("未备案");
  const [filingRejectReason, setFilingRejectReason] = useState<string | null>(null);

  const loadFiling = async () => {
    try {
      const filing = await api.getMyFiling();
      setFilingStatus(filing.filing_status);
      setFilingRejectReason(filing.filing_reject_reason ?? null);
      form.setFieldsValue({
        region: filing.city_name ?? user?.region ?? "昆明市",
        orgCode: filing.organization_code ?? "",
        name: filing.name ?? "",
        nature: filing.nature ? [filing.nature] : undefined,
        industry: filing.industry ? [filing.industry] : undefined,
        business: filing.business_scope ?? "",
        contact: filing.contact_person ?? "",
        address:
          filing.contact_address && filing.contact_address.includes("/")
            ? filing.contact_address.split("/")
            : undefined,
        zip: filing.postal_code ?? "",
        phone: filing.phone ?? "",
        fax: filing.fax ?? "",
        email: filing.email ?? "",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "加载备案信息失败";
      showActionMessage("查询", text, "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitLocked = filingStatus === "已备案" || filingStatus === "待备案";

  const buildPayload = (values: Record<string, unknown>) => ({
    organization_code: String(values.orgCode ?? "").trim(),
    name: String(values.name ?? "").trim(),
    nature: Array.isArray(values.nature) ? String(values.nature[values.nature.length - 1] ?? "") : String(values.nature ?? ""),
    industry: Array.isArray(values.industry) ? String(values.industry[values.industry.length - 1] ?? "") : String(values.industry ?? ""),
    business_scope: String(values.business ?? "").trim(),
    contact_person: String(values.contact ?? "").trim(),
    contact_address: Array.isArray(values.address)
      ? values.address.map((item) => String(item).trim()).filter(Boolean).join("/")
      : "",
    postal_code: String(values.zip ?? "").trim(),
    phone: String(values.phone ?? "").trim(),
    fax: String(values.fax ?? "").trim() || undefined,
    email: String(values.email ?? "").trim() || undefined,
  });

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="企业备案信息" desc="请完整填写备案信息，可先保存草稿后再上报备案。" />
      <Skeleton active loading={loading} paragraph={{ rows: 10 }}>
      <Card className="soft-card section-card">
        {filingStatus === "已备案" ? <Alert type="success" showIcon style={{ marginBottom: 16 }} message="企业备案已通过，可前往“数据填报”页面上报数据" /> : null}
        {filingStatus === "待备案" ? <Alert type="info" showIcon style={{ marginBottom: 16 }} message="备案已提交，待省级审核通过后即可进行数据填报" /> : null}
        {filingStatus === "备案退回" ? <Alert type="error" showIcon style={{ marginBottom: 16 }} message={`备案已退回：${filingRejectReason ?? "请修改后重新提交"}`} /> : null}
        <Form
          form={form}
          layout="vertical"
          initialValues={{ region: user?.region ?? "昆明市" }}
          onFinish={async (values) => {
            try {
              await api.saveFiling(buildPayload(values));
              showActionMessage("保存", "备案草稿已保存");
            } catch (error) {
              const text = error instanceof Error ? error.message : "保存失败";
              showActionMessage("保存", text, "error");
            }
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="所属地区" name="region">
                <Input readOnly className="readonly-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="组织机构代码"
                name="orgCode"
                rules={[
                  { required: true, message: "请输入组织机构代码" },
                  { pattern: /^[A-Za-z0-9]{1,9}$/, message: "仅允许字母和数字，且不超过9位" },
                ]}
              >
                <Input placeholder="请输入组织机构代码" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="企业名称" name="name" rules={[{ required: true, message: "请输入企业名称" }]}>
                <Input placeholder="请输入企业名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="企业性质" name="nature" rules={[{ required: true, message: "请选择企业性质" }]}>
                <Cascader options={natureOptions} placeholder="请选择企业性质" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="所属行业" name="industry" rules={[{ required: true, message: "请选择所属行业" }]}>
                <Cascader options={industryOptions} placeholder="请选择所属行业" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="主要经营业务" name="business" rules={[{ required: true, message: "请输入主要经营业务" }]}>
                <Input placeholder="请输入主要经营业务" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="联系人" name="contact" rules={[{ required: true, message: "请输入联系人" }]}>
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="联系地址" name="address" rules={[{ required: true, message: "请选择两级联系地址" }]}>
                <Cascader options={contactAddressOptions} placeholder="请选择地市/市县" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="邮政编码" name="zip" rules={[{ required: true, message: "请输入邮政编码" }]}>
                <Input placeholder="请输入邮政编码" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: "请输入联系电话" }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="传真" name="fax">
                <Input placeholder="请输入传真" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="EMAIL"
                name="email"
                rules={[{ type: "email", message: "邮箱格式不正确" }]}
              >
                <Input placeholder="邮箱为非必填项" />
              </Form.Item>
            </Col>
          </Row>
          <Space className={isMobile ? "mobile-action-bar" : undefined}>
            <Form.Item noStyle>
              <button className="btn-outline" type="submit">
                保存草稿
              </button>
            </Form.Item>
            <Form.Item noStyle>
              <button
                className="btn-primary"
                type="button"
                disabled={submitLocked}
                onClick={() => {
                  if (submitLocked) return;
                  form
                    .validateFields()
                    .then(async (values) => {
                      try {
                        await api.submitFiling(buildPayload(values));
                        showActionMessage("上报", "备案信息已提交，待省级审核");
                        await loadFiling();
                      } catch (error) {
                        const text = error instanceof Error ? error.message : "上报失败";
                        showActionMessage("上报", text, "error");
                      }
                    })
                    .catch(() => undefined);
                }}
              >
                上报备案
              </button>
            </Form.Item>
          </Space>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">所属地区字段固定只读；组织机构代码会进行唯一性校验。</Text>
          </div>
        </Form>
      </Card>
      </Skeleton>
    </Space>
  );
}

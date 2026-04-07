import { Alert, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography, message } from "antd";
import { useMemo } from "react";

import { PageTitle } from "../../components/common/PageTitle";
import { surveyPeriods } from "../../mock/data";

const { Text, Title } = Typography;

export function EnterpriseReportingPage() {
  const [form] = Form.useForm();

  const baseEmployment = Form.useWatch("baseEmployment", form) ?? 0;
  const surveyEmployment = Form.useWatch("surveyEmployment", form) ?? 0;
  const showDecrease = surveyEmployment < baseEmployment;

  const changeHint = useMemo(() => {
    const diff = surveyEmployment - baseEmployment;
    if (diff === 0) return "岗位数量持平";
    if (diff > 0) return `岗位增加 ${diff} 人`;
    return `岗位减少 ${Math.abs(diff)} 人`;
  }, [baseEmployment, surveyEmployment]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="企业数据填报" desc="按调查期填报就业岗位数据，支持暂存与正式上报。" />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="soft-card">
            <Form form={form} layout="vertical" initialValues={{ periodCode: "202604", baseEmployment: 300, surveyEmployment: 300 }}>
              <Form.Item label="调查期" name="periodCode" rules={[{ required: true, message: "请选择调查期" }]}>
                <Select
                  showSearch
                  placeholder="请选择调查期"
                  options={surveyPeriods.map((item) => ({ value: item.periodCode, label: item.periodName }))}
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
                <Card size="small" style={{ marginBottom: 16, borderColor: "#ffb38a", background: "#fff7f2" }}>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    减员信息（必填）
                  </Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item label="就业人数减少类型" name="decreaseType" rules={[{ required: true, message: "请选择减少类型" }]}>
                        <Select
                          placeholder="请选择减少类型"
                          options={[{ value: "经营调整", label: "经营调整" }, { value: "结构优化", label: "结构优化" }, { value: "其他", label: "其他" }]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="主要原因" name="primaryReason" rules={[{ required: true, message: "请输入主要原因" }]}>
                        <Input placeholder="请输入主要原因" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="主要原因说明" name="primaryReasonDesc" rules={[{ required: true, message: "请输入主要原因说明" }]}>
                        <Input placeholder="请输入主要原因说明" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="次要原因" name="secondaryReason">
                        <Input placeholder="请输入次要原因" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="次要原因说明" name="secondaryReasonDesc">
                        <Input placeholder="请输入次要原因说明" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="第三原因" name="thirdReason">
                        <Input placeholder="请输入第三原因" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="第三原因说明" name="thirdReasonDesc">
                        <Input placeholder="请输入第三原因说明" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="其他原因" name="otherReason">
                        <Input placeholder="请输入其他原因" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ) : null}

              <Space>
                <button className="btn-outline" type="button" onClick={() => message.success("已暂存填报数据")}>
                  暂存
                </button>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    form
                      .validateFields()
                      .then(() => message.success("报表已上报，状态变更为待市审"))
                      .catch(() => undefined);
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
            <Card className="soft-card" title="人数变化提示卡">
              <Text>{changeHint}</Text>
              <div style={{ marginTop: 12 }}>
                <Alert
                  type={showDecrease ? "warning" : "success"}
                  showIcon
                  message={showDecrease ? "检测到减员，需补充减员信息" : "当前无需填写减员信息"}
                />
              </div>
            </Card>
            <Card className="soft-card" title="填报说明">
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

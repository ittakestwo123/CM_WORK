import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import {
  api,
  type BackendPeriod,
  type NationalPushLogResp,
  type NationalPushRecordResp,
  type OperationLogResp,
  type SystemMonitorResp,
  type SystemMonitorSnapshotResp,
  type SystemRoleResp,
  type SystemUserResp,
} from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { StatusTag } from "../../components/common/StatusTag";
import { useResponsive } from "../../hooks/useResponsive";
import { cityCodeOptions } from "../../mock/data";
import { showActionMessage } from "../../utils/feedback";

export function ProvinceSystemManagePage() {
  const [monitorRefreshing, setMonitorRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [periodForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [pushForm] = Form.useForm();
  const [pushRecordFilterForm] = Form.useForm();
  const [logFilterForm] = Form.useForm();
  const [periodRows, setPeriodRows] = useState<BackendPeriod[]>([]);
  const [users, setUsers] = useState<SystemUserResp[]>([]);
  const [roles, setRoles] = useState<SystemRoleResp[]>([]);
  const [monitor, setMonitor] = useState<SystemMonitorResp | null>(null);
  const [monitorSnapshots, setMonitorSnapshots] = useState<SystemMonitorSnapshotResp[]>([]);
  const [nationalPreviewCount, setNationalPreviewCount] = useState(0);
  const [pushRecords, setPushRecords] = useState<NationalPushRecordResp[]>([]);
  const [pushLogs, setPushLogs] = useState<NationalPushLogResp[]>([]);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [operationLogs, setOperationLogs] = useState<OperationLogResp[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState(30);
  const [pushConfigMasked, setPushConfigMasked] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUserResp | null>(null);
  const [editingRole, setEditingRole] = useState<SystemRoleResp | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<BackendPeriod | null>(null);
  const { isMobile } = useResponsive();

  const roleNameMap: Record<string, string> = { enterprise: "企业", city: "市级", province: "省级" };
  const rolePermissionOptions = [
    "企业备案",
    "企业填报",
    "企业查询",
    "通知浏览",
    "市级审核",
    "市级通知发布",
    "省级审核",
    "省级通知发布",
    "系统管理",
    "导出与对外推送",
  ];

  const selectedUserRole = Form.useWatch("role", userForm) as string | undefined;
  const cityCodeLabelMap = useMemo(
    () => Object.fromEntries(cityCodeOptions.map((item) => [item.value, item.label])),
    [],
  );
  const periodOptions = useMemo(
    () => periodRows.map((item) => ({ value: item.period_code, label: item.period_name })),
    [periodRows],
  );
  const customRoleOptions = useMemo(
    () =>
      roles
        .filter((item) => !item.is_builtin && item.scope === selectedUserRole)
        .map((item) => ({ value: item.id, label: item.name })),
    [roles, selectedUserRole],
  );

  const loadPeriods = async () => {
    try {
      const data = await api.listPeriods();
      setPeriodRows(data);
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "加载调查期失败", "error");
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.systemListUsers();
      setUsers(data);
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "加载用户失败", "error");
    }
  };

  const loadRoles = async () => {
    try {
      const data = await api.systemRoles();
      setRoles(data);
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "加载角色失败", "error");
    }
  };

  const loadMonitor = async () => {
    try {
      const data = await api.systemMonitor();
      setMonitor(data);
      const snapshots = await api.systemMonitorSnapshots(8);
      setMonitorSnapshots(snapshots);
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "加载监控数据失败", "error");
    }
  };

  const loadPushConfig = async () => {
    try {
      const cfg = await api.nationalPushConfig();
      setPushConfigMasked(cfg.api_key_masked || "未配置");
      pushForm.setFieldsValue({ enabled: cfg.enabled });
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "加载推送配置失败", "error");
    }
  };

  const loadPushRecords = async (params?: { status?: string; batchId?: string; periodCode?: string }) => {
    try {
      const data = await api.nationalPushRecords({
        status: params?.status,
        batchId: params?.batchId,
        periodCode: params?.periodCode,
        limit: 80,
      });
      setPushRecords(data);
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "加载推送记录失败", "error");
    }
  };

  const resolvePushRecordFilters = () => {
    const values = pushRecordFilterForm.getFieldsValue();
    return {
      status: values.status as string | undefined,
      batchId: values.batchId as string | undefined,
      periodCode: values.periodCode as string | undefined,
    };
  };

  const loadOperationLogs = async () => {
    try {
      const values = logFilterForm.getFieldsValue();
      const data = await api.listOperationLogs({
        operationType: values.operationType,
        userName: values.userName,
        keyword: values.keyword,
        startTime: values.timeRange?.[0] ? dayjs(values.timeRange[0]).toISOString() : undefined,
        endTime: values.timeRange?.[1] ? dayjs(values.timeRange[1]).toISOString() : undefined,
        limit: 200,
      });
      setOperationLogs(data);
    } catch (error) {
      showActionMessage("查询", error instanceof Error ? error.message : "加载操作日志失败", "error");
    }
  };

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      await loadPeriods();
      await loadUsers();
      await loadRoles();
      await loadMonitor();
      await loadPushConfig();
      await loadPushRecords(resolvePushRecordFilters());
      await loadOperationLogs();
      setPageLoading(false);
    };
    void init();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void loadMonitor();
      void loadPushRecords(resolvePushRecordFilters());
    }, refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, refreshSeconds, pushRecordFilterForm]);

  const monitorStatus = useMemo(() => {
    if (!monitor) return "normal" as const;
    if (monitor.warning_level === "严重") return "exception" as const;
    if (monitor.warning_level === "预警") return "active" as const;
    return "normal" as const;
  }, [monitor]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PageTitle title="系统管理" desc="上报时限、用户、角色、监控与国家接口联调演示统一管理。" />
      <Tabs
        tabPosition={isMobile ? "top" : "left"}
        items={[
          {
            key: "period",
            label: "上报时限",
            children: (
              <Card className="soft-card filter-panel" loading={pageLoading}>
                <Form
                  form={periodForm}
                  layout={isMobile ? "vertical" : "inline"}
                  style={{ marginBottom: 12 }}
                  onFinish={async (values) => {
                    const start = values.timeRange?.[0];
                    const end = values.timeRange?.[1];
                    if (!start || !end) {
                      showActionMessage("提交", "请先选择起止时间", "warning");
                      return;
                    }
                    const payload = {
                      period_code: values.periodCode,
                      period_name: values.periodName,
                      period_type: values.periodType,
                      month_no: Number(values.monthNo),
                      half_no: values.halfNo ? Number(values.halfNo) : null,
                      status: values.status,
                      start_time: dayjs(start).toISOString(),
                      end_time: dayjs(end).toISOString(),
                    };
                    try {
                      if (editingPeriod) {
                        await api.updatePeriod(editingPeriod.id, payload);
                        showActionMessage("提交", "调查期已修改");
                      } else {
                        await api.createPeriod(payload);
                        showActionMessage("提交", "调查期已新增");
                      }
                      setEditingPeriod(null);
                      periodForm.resetFields();
                      await loadPeriods();
                    } catch (error) {
                      showActionMessage("提交", error instanceof Error ? error.message : "保存调查期失败", "error");
                    }
                  }}
                >
                  <Form.Item label="编码" name="periodCode" rules={[{ required: true, message: "请输入编码" }]}>
                    <Input style={{ width: isMobile ? "100%" : 170 }} placeholder="如 2026-04-M1" />
                  </Form.Item>
                  <Form.Item label="调查期名称" name="periodName" rules={[{ required: true, message: "请输入名称" }]}>
                    <Input style={{ width: isMobile ? "100%" : 220 }} placeholder="请输入调查期名称" />
                  </Form.Item>
                  <Form.Item label="类型" name="periodType" rules={[{ required: true, message: "请选择类型" }]}>
                    <Select style={{ width: isMobile ? "100%" : 140 }} options={[{ value: "MONTH", label: "月报" }, { value: "HALF_MONTH", label: "半月报" }]} />
                  </Form.Item>
                  <Form.Item label="月份" name="monthNo" rules={[{ required: true, message: "请输入月份" }]}>
                    <Input style={{ width: isMobile ? "100%" : 90 }} placeholder="1-12" />
                  </Form.Item>
                  <Form.Item label="半月序号" name="halfNo">
                    <Input style={{ width: isMobile ? "100%" : 90 }} placeholder="1/2" />
                  </Form.Item>
                  <Form.Item label="状态" name="status" initialValue="启用" rules={[{ required: true, message: "请选择状态" }]}>
                    <Select style={{ width: isMobile ? "100%" : 120 }} options={[{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }]} />
                  </Form.Item>
                  <Form.Item label="时间" name="timeRange" rules={[{ required: true, message: "请选择时间范围" }]}>
                    <DatePicker.RangePicker showTime style={{ width: isMobile ? "100%" : undefined }} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    {editingPeriod ? "保存修改" : "新增调查期"}
                  </Button>
                </Form>
                <Table
                  rowKey="period_code"
                  scroll={isMobile ? { x: 880 } : undefined}
                  locale={{ emptyText: <Empty description="暂无时限配置" /> }}
                  dataSource={periodRows}
                  columns={[
                    { title: "period_code", dataIndex: "period_code" },
                    { title: "period_name", dataIndex: "period_name" },
                    { title: "period_type", dataIndex: "period_type" },
                    { title: "开始日期", dataIndex: "start_time" },
                    { title: "结束日期", dataIndex: "end_time" },
                    {
                      title: "操作",
                      render: (_, row) => (
                        <Button
                          type="link"
                          onClick={() => {
                            setEditingPeriod(row);
                            periodForm.setFieldsValue({
                              periodCode: row.period_code,
                              periodName: row.period_name,
                              periodType: row.period_type,
                              monthNo: row.month_no,
                              halfNo: row.half_no,
                              status: row.status,
                              timeRange: [dayjs(row.start_time), dayjs(row.end_time)],
                            });
                          }}
                        >
                          修改
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "user",
            label: "用户管理",
            children: (
              <Card
                className="soft-card section-card"
                loading={pageLoading}
                extra={
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditingUser(null);
                      userForm.resetFields();
                      setUserModalOpen(true);
                    }}
                  >
                    新增用户
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  scroll={isMobile ? { x: 980 } : undefined}
                  locale={{ emptyText: <Empty description="暂无用户数据" /> }}
                  dataSource={users}
                  columns={[
                    { title: "用户名", dataIndex: "username" },
                    { title: "系统角色", dataIndex: "role", render: (v: string) => roleNameMap[v] ?? v },
                    { title: "自定义角色", dataIndex: "custom_role_name", render: (v?: string | null) => v ?? "-" },
                    {
                      title: "地区",
                      dataIndex: "city_code",
                      render: (v?: string | null) => (v ? (cityCodeLabelMap[v] ?? v) : "-"),
                    },
                    {
                      title: "启用状态",
                      dataIndex: "is_active",
                      render: (v: boolean) => <StatusTag status={v ? "启用" : "停用"} />,
                    },
                    {
                      title: "激活状态",
                      dataIndex: "is_activated",
                      render: (v: boolean) => <StatusTag status={v ? "已激活" : "未激活"} />,
                    },
                    {
                      title: "锁定信息",
                      render: (_, row) => (row.locked_until ? `锁定至 ${dayjs(row.locked_until).format("MM-DD HH:mm")}` : "-"),
                    },
                    {
                      title: "操作",
                      render: (_, row) => (
                        <Space>
                          <Button
                            type="link"
                            onClick={() => {
                              setEditingUser(row);
                              userForm.setFieldsValue({
                                username: row.username,
                                role: row.role,
                                customRoleId: row.custom_role_id ? `custom:${row.custom_role_id}` : undefined,
                                isActive: row.is_active,
                                isActivated: row.is_activated,
                                cityCode: row.city_code,
                                enterpriseId: row.enterprise_id,
                              });
                              setUserModalOpen(true);
                            }}
                          >
                            修改
                          </Button>
                          <Button
                            type="link"
                            danger
                            onClick={async () => {
                              try {
                                const check = await api.systemUserDeleteCheck(row.id);
                                if (!check.allowed) {
                                  Modal.warning({ title: "禁止删除", content: check.reason ?? "当前用户不能删除" });
                                  return;
                                }
                                await api.systemDeleteUser(row.id);
                                showActionMessage("删除", `${row.username} 已停用并注销激活`);
                                await loadUsers();
                              } catch (error) {
                                showActionMessage("删除", error instanceof Error ? error.message : "删除失败", "error");
                              }
                            }}
                          >
                            删除
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />

                <Modal
                  open={userModalOpen}
                  title={editingUser ? "编辑用户" : "新增用户"}
                  onCancel={() => setUserModalOpen(false)}
                  footer={null}
                >
                  <Form
                    form={userForm}
                    layout="vertical"
                    onValuesChange={(changedValues) => {
                      if (Object.prototype.hasOwnProperty.call(changedValues, "role")) {
                        userForm.setFieldValue("customRoleId", undefined);
                      }
                    }}
                    onFinish={async (values) => {
                      try {
                        const customRoleId =
                          typeof values.customRoleId === "string" && values.customRoleId.startsWith("custom:")
                            ? Number(values.customRoleId.split(":")[1])
                            : null;

                        if (editingUser) {
                          await api.systemUpdateUser(editingUser.id, {
                            role: values.role,
                            custom_role_id: customRoleId,
                            is_active: values.isActive,
                            is_activated: values.isActivated,
                            city_code: values.cityCode || null,
                            enterprise_id: values.enterpriseId ? Number(values.enterpriseId) : null,
                            password: values.password || undefined,
                          });
                          showActionMessage("提交", "用户已更新");
                        } else {
                          await api.systemCreateUser({
                            username: values.username,
                            password: values.password,
                            role: values.role,
                            custom_role_id: customRoleId,
                            is_active: values.isActive,
                            is_activated: values.isActivated,
                            city_code: values.cityCode || null,
                            enterprise_id: values.enterpriseId ? Number(values.enterpriseId) : null,
                          });
                          showActionMessage("提交", "用户已新增");
                        }
                        setUserModalOpen(false);
                        userForm.resetFields();
                        await loadUsers();
                      } catch (error) {
                        showActionMessage("提交", error instanceof Error ? error.message : "保存用户失败", "error");
                      }
                    }}
                    initialValues={{ isActive: true, isActivated: true, role: "enterprise" }}
                  >
                    <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
                      <Input disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item label={editingUser ? "重置密码（可选）" : "密码"} name="password" rules={editingUser ? [] : [{ required: true, message: "请输入密码" }]}>
                      <Input.Password />
                    </Form.Item>
                    <Form.Item label="角色" name="role" rules={[{ required: true, message: "请选择角色" }]}>
                      <Select options={[{ value: "enterprise", label: "企业" }, { value: "city", label: "市级" }, { value: "province", label: "省级" }]} />
                    </Form.Item>
                    <Form.Item label="自定义角色" name="customRoleId">
                      <Select
                        allowClear
                        placeholder="可选，未选择则仅使用系统角色"
                        options={customRoleOptions}
                        onChange={(value) => userForm.setFieldValue("customRoleId", value)}
                      />
                    </Form.Item>
                    <Form.Item label="启用状态" name="isActive" rules={[{ required: true, message: "请选择状态" }]}>
                      <Select options={[{ value: true, label: "启用" }, { value: false, label: "停用" }]} />
                    </Form.Item>
                    <Form.Item label="激活状态" name="isActivated" rules={[{ required: true, message: "请选择激活状态" }]}>
                      <Select options={[{ value: true, label: "已激活" }, { value: false, label: "未激活" }]} />
                    </Form.Item>
                    <Form.Item label="地市编码" name="cityCode">
                      <Select allowClear showSearch placeholder="请选择地市编码" options={cityCodeOptions} />
                    </Form.Item>
                    <Form.Item label="企业ID" name="enterpriseId">
                      <Input placeholder="企业角色可填" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">
                      保存
                    </Button>
                  </Form>
                </Modal>
              </Card>
            ),
          },
          {
            key: "role",
            label: "角色管理",
            children: (
              <Card
                className="soft-card section-card"
                loading={pageLoading}
                extra={
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditingRole(null);
                      roleForm.resetFields();
                      setRoleModalOpen(true);
                    }}
                  >
                    新增角色
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  locale={{ emptyText: <Empty description="暂无角色数据" /> }}
                  dataSource={roles}
                  columns={[
                    {
                      title: "角色名称",
                      render: (_, row) => (
                        <Space>
                          <span>{row.name}</span>
                          {row.is_builtin ? <StatusTag status="预定义" /> : <StatusTag status="自定义" />}
                        </Space>
                      ),
                    },
                    {
                      title: "作用范围",
                      dataIndex: "scope",
                      render: (v: string) => roleNameMap[v] ?? v,
                    },
                    {
                      title: "权限说明",
                      render: (_, row) => row.permissions.join("、") || "-",
                    },
                    { title: "已分配用户", dataIndex: "assigned_user_count" },
                    {
                      title: "操作",
                      render: (_, row) => (
                        row.is_builtin ? (
                          <Button
                            type="link"
                            danger
                            onClick={async () => {
                              try {
                                const key = row.scope as "enterprise" | "city" | "province";
                                const check = await api.systemRoleDeleteCheck(key);
                                Modal.warning({ title: "角色删除限制", content: check.reason ?? "系统内置角色不可删除" });
                              } catch (error) {
                                showActionMessage("查询", error instanceof Error ? error.message : "查询失败", "error");
                              }
                            }}
                          >
                            删除角色
                          </Button>
                        ) : (
                          <Space>
                            <Button
                              type="link"
                              onClick={() => {
                                setEditingRole(row);
                                roleForm.setFieldsValue({
                                  name: row.name,
                                  scope: row.scope,
                                  permissions: row.permissions,
                                });
                                setRoleModalOpen(true);
                              }}
                            >
                              修改权限
                            </Button>
                            <Button
                              type="link"
                              danger
                              onClick={async () => {
                                const roleId = Number(row.id.split(":")[1]);
                                try {
                                  const check = await api.systemCustomRoleDeleteCheck(roleId);
                                  if (!check.allowed) {
                                    Modal.confirm({
                                      title: "角色已分配用户",
                                      content: `${check.reason ?? "该角色正在使用"}，是否解除关联并删除？`,
                                      okText: "解除并删除",
                                      okType: "danger",
                                      cancelText: "取消",
                                      onOk: async () => {
                                        await api.systemDeleteCustomRole(roleId, true);
                                        showActionMessage("删除", `已删除角色 ${row.name}，并解除用户关联`);
                                        await loadRoles();
                                        await loadUsers();
                                      },
                                    });
                                    return;
                                  }
                                  await api.systemDeleteCustomRole(roleId, false);
                                  showActionMessage("删除", `已删除角色 ${row.name}`);
                                  await loadRoles();
                                  await loadUsers();
                                } catch (error) {
                                  showActionMessage("删除", error instanceof Error ? error.message : "删除角色失败", "error");
                                }
                              }}
                            >
                              删除角色
                            </Button>
                          </Space>
                        )
                      ),
                    },
                  ]}
                />

                <Modal
                  open={roleModalOpen}
                  title={editingRole ? "修改角色权限" : "新增角色"}
                  onCancel={() => setRoleModalOpen(false)}
                  footer={null}
                >
                  <Form
                    form={roleForm}
                    layout="vertical"
                    initialValues={{ scope: "enterprise", permissions: [] }}
                    onFinish={async (values) => {
                      try {
                        if (editingRole) {
                          const roleId = Number(editingRole.id.split(":")[1]);
                          await api.systemUpdateCustomRole(roleId, {
                            name: values.name,
                            permissions: values.permissions ?? [],
                          });
                          showActionMessage("提交", "角色权限已更新");
                        } else {
                          await api.systemCreateCustomRole({
                            name: values.name,
                            scope: values.scope,
                            permissions: values.permissions ?? [],
                          });
                          showActionMessage("提交", "自定义角色已新增");
                        }
                        setRoleModalOpen(false);
                        roleForm.resetFields();
                        setEditingRole(null);
                        await loadRoles();
                      } catch (error) {
                        showActionMessage("提交", error instanceof Error ? error.message : "保存角色失败", "error");
                      }
                    }}
                  >
                    <Form.Item label="角色名称" name="name" rules={[{ required: true, message: "请输入角色名称" }]}>
                      <Input placeholder="请输入自定义角色名称" />
                    </Form.Item>
                    <Form.Item label="作用范围" name="scope" rules={[{ required: true, message: "请选择作用范围" }]}>
                      <Select
                        disabled={!!editingRole}
                        options={[
                          { value: "enterprise", label: "企业" },
                          { value: "city", label: "市级" },
                          { value: "province", label: "省级" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="功能权限" name="permissions" rules={[{ required: true, message: "请至少选择一项权限" }]}>
                      <Select mode="multiple" placeholder="请选择权限" options={rolePermissionOptions.map((item) => ({ value: item, label: item }))} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">
                      保存
                    </Button>
                  </Form>
                </Modal>
              </Card>
            ),
          },
          {
            key: "monitor",
            label: "系统监控与推送",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                <Card className="soft-card" loading={pageLoading}>
                  <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                      <Button
                        loading={monitorRefreshing}
                        onClick={async () => {
                          setMonitorRefreshing(true);
                          await loadMonitor();
                          setMonitorRefreshing(false);
                          showActionMessage("提交", "系统监控状态已刷新", "info");
                        }}
                      >
                        刷新状态
                      </Button>
                      <Switch checked={autoRefresh} onChange={setAutoRefresh} checkedChildren="自动刷新" unCheckedChildren="手动" />
                      <Select
                        value={refreshSeconds}
                        style={{ width: 120 }}
                        onChange={setRefreshSeconds}
                        options={[15, 30, 60].map((item) => ({ value: item, label: `${item}s` }))}
                        disabled={!autoRefresh}
                      />
                    </Space>
                    <StatusTag status={monitor?.warning_level ?? "正常"} />
                  </Space>

                  <Space direction="vertical" style={{ width: "100%", marginTop: 12 }} size={10}>
                    <Card size="small" className="section-card" title="CPU 使用率">
                      <Progress percent={monitor?.cpu_usage ?? 0} status={monitorStatus} />
                    </Card>
                    <Card size="small" className="section-card" title="内存使用率">
                      <Progress percent={monitor?.memory_usage ?? 0} status={monitorStatus} />
                    </Card>
                    <Card size="small" className="section-card" title="磁盘使用率">
                      <Progress percent={monitor?.disk_usage ?? 0} status={monitorStatus} />
                    </Card>
                    <Card size="small" className="section-card" title="监控摘要">
                      <Descriptions column={isMobile ? 1 : 3} size="small">
                        <Descriptions.Item label="在线用户数">{monitor?.active_users ?? 0}</Descriptions.Item>
                        <Descriptions.Item label="当前调查期待审核量">{monitor?.pending_review_count ?? 0}</Descriptions.Item>
                        <Descriptions.Item label="接口响应时间">{monitor?.api_latency_ms ?? 0} ms</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Space>

                  <Table
                    style={{ marginTop: 12 }}
                    size="small"
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: <Empty description="暂无监控快照" /> }}
                    dataSource={monitorSnapshots}
                    columns={[
                      { title: "时间", dataIndex: "created_at", render: (v: string) => dayjs(v).format("MM-DD HH:mm:ss") },
                      { title: "CPU", dataIndex: "cpu_usage", render: (v: number) => `${v}%` },
                      { title: "内存", dataIndex: "memory_usage", render: (v: number) => `${v}%` },
                      { title: "磁盘", dataIndex: "disk_usage", render: (v: number) => `${v}%` },
                      { title: "待审核", dataIndex: "pending_review_count" },
                      { title: "延迟", dataIndex: "api_latency_ms", render: (v: number) => `${v}ms` },
                      {
                        title: "预警",
                        dataIndex: "warning_level",
                        render: (v: string) => <StatusTag status={v} />,
                      },
                    ]}
                  />
                </Card>

                <Card className="soft-card section-card" title="国家接口演示增强">
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={`当前 API Key：${pushConfigMasked || "未配置"}`}
                  />
                  <Form
                    form={pushForm}
                    layout={isMobile ? "vertical" : "inline"}
                    onFinish={async (values) => {
                      try {
                        await api.nationalPushSetConfig({ api_key: values.apiKey, enabled: values.enabled });
                        await loadPushConfig();
                        showActionMessage("提交", "API Key 配置已保存", "success");
                      } catch (error) {
                        showActionMessage("提交", error instanceof Error ? error.message : "保存配置失败", "error");
                      }
                    }}
                    initialValues={{ enabled: true }}
                  >
                    <Form.Item label="API Key" name="apiKey" rules={[{ required: true, message: "请输入 API Key" }]}>
                      <Input.Password placeholder="请输入用于联调演示的 API Key" style={{ width: isMobile ? "100%" : 320 }} />
                    </Form.Item>
                    <Form.Item label="启用" name="enabled" valuePropName="checked">
                      <Switch checkedChildren="启用" unCheckedChildren="停用" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">
                      保存配置
                    </Button>
                  </Form>

                  <Space wrap style={{ marginTop: 12 }}>
                    <Select
                      allowClear
                      style={{ width: isMobile ? "100%" : 220 }}
                      placeholder="选择调查期（可选）"
                      options={periodOptions}
                      onChange={(value) => pushForm.setFieldValue("periodCode", value)}
                    />
                    <Button
                      onClick={async () => {
                        try {
                          const periodCode = pushForm.getFieldValue("periodCode") as string | undefined;
                          const preview = await api.nationalPushPreview(periodCode);
                          setNationalPreviewCount(preview.report_count);
                          showActionMessage("查询", `待推送 ${preview.report_count} 条`, "info");
                        } catch (error) {
                          showActionMessage("查询", error instanceof Error ? error.message : "预览失败", "error");
                        }
                      }}
                    >
                      预览推送
                    </Button>
                    <Select
                      defaultValue={200}
                      style={{ width: 180 }}
                      options={[
                        { value: 200, label: "正常推送" },
                        { value: 400, label: "模拟 400 参数错误" },
                        { value: 401, label: "模拟 401 认证失败" },
                        { value: 500, label: "模拟 500 重试后失败" },
                        { value: 503, label: "模拟 503 暂存待重试" },
                      ]}
                      onChange={(value) => pushForm.setFieldValue("simulateCode", value)}
                    />
                    <Button
                      type="primary"
                      onClick={async () => {
                        try {
                          const periodCode = pushForm.getFieldValue("periodCode") as string | undefined;
                          const simulate = pushForm.getFieldValue("simulateCode") as number | undefined;
                          const result = await api.nationalPush({
                            period_code: periodCode,
                            simulate_http_status: simulate === 200 ? undefined : simulate,
                          });
                          showActionMessage("提交", `批次 ${result.batch_id}，状态 ${result.status}`, "success");
                          await loadPushRecords(resolvePushRecordFilters());
                        } catch (error) {
                          showActionMessage("提交", error instanceof Error ? error.message : "推送失败", "error");
                          await loadPushRecords(resolvePushRecordFilters());
                        }
                      }}
                    >
                      执行推送
                    </Button>
                  </Space>
                  <div style={{ marginTop: 8 }}>最近预览数量：{nationalPreviewCount}</div>

                  <Form
                    form={pushRecordFilterForm}
                    layout={isMobile ? "vertical" : "inline"}
                    style={{ marginTop: 12 }}
                    onFinish={async () => {
                      await loadPushRecords(resolvePushRecordFilters());
                    }}
                  >
                    <Form.Item label="批次号" name="batchId">
                      <Input placeholder="输入批次号关键字" style={{ width: isMobile ? "100%" : 220 }} />
                    </Form.Item>
                    <Form.Item label="状态" name="status">
                      <Select
                        allowClear
                        placeholder="全部状态"
                        style={{ width: isMobile ? "100%" : 180 }}
                        options={[
                          { value: "成功", label: "成功" },
                          { value: "失败", label: "失败" },
                          { value: "待重试", label: "待重试" },
                          { value: "重试中", label: "重试中" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="调查期" name="periodCode">
                      <Select
                        allowClear
                        showSearch
                        placeholder="全部调查期"
                        style={{ width: isMobile ? "100%" : 240 }}
                        options={periodOptions}
                      />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">
                      查询记录
                    </Button>
                    <Button
                      onClick={() => {
                        pushRecordFilterForm.resetFields();
                        void loadPushRecords();
                      }}
                    >
                      重置
                    </Button>
                  </Form>

                  <Table
                    style={{ marginTop: 12 }}
                    rowKey="batch_id"
                    size="small"
                    scroll={isMobile ? { x: 980 } : undefined}
                    locale={{ emptyText: <Empty description="暂无推送记录" /> }}
                    dataSource={pushRecords}
                    columns={[
                      { title: "批次号", dataIndex: "batch_id" },
                      { title: "调查期", dataIndex: "period_code" },
                      { title: "推送总数", dataIndex: "report_count" },
                      { title: "成功", dataIndex: "pushed_count" },
                      { title: "失败", dataIndex: "failed_count" },
                      { title: "尝试次数", dataIndex: "attempt_count" },
                      {
                        title: "状态",
                        dataIndex: "status",
                        render: (v: string) => <StatusTag status={v} />,
                      },
                      { title: "错误信息", dataIndex: "last_error_message", render: (v?: string | null) => v ?? "-" },
                      {
                        title: "操作",
                        render: (_, row) => (
                          <Space>
                            <Button
                              type="link"
                              onClick={async () => {
                                const logs = await api.nationalPushRecordLogs(row.batch_id);
                                setCurrentBatchId(row.batch_id);
                                setPushLogs(logs);
                              }}
                            >
                              查看日志
                            </Button>
                            <Button
                              type="link"
                              disabled={!(row.status === "失败" || row.status === "待重试")}
                              onClick={async () => {
                                try {
                                  const result = await api.nationalPushRetry(row.batch_id, {});
                                  showActionMessage("重试", `批次 ${result.batch_id} 状态 ${result.status}`, "info");
                                  await loadPushRecords(resolvePushRecordFilters());
                                } catch (error) {
                                  showActionMessage("重试", error instanceof Error ? error.message : "重试失败", "error");
                                }
                              }}
                            >
                              立即重试
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>

                <Drawer
                  width={isMobile ? "100%" : 760}
                  open={!!currentBatchId}
                  title={`推送日志 - ${currentBatchId ?? ""}`}
                  onClose={() => {
                    setCurrentBatchId(null);
                    setPushLogs([]);
                  }}
                >
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={pushLogs}
                    columns={[
                      { title: "尝试", dataIndex: "attempt_no" },
                      { title: "状态", dataIndex: "status" },
                      { title: "HTTP", dataIndex: "status_code", render: (v?: number | null) => v ?? "-" },
                      { title: "说明", dataIndex: "message" },
                      { title: "时间", dataIndex: "created_at", render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm:ss") },
                    ]}
                  />
                </Drawer>
              </Space>
            ),
          },
          {
            key: "oplog",
            label: "操作日志",
            children: (
              <Card className="soft-card" loading={pageLoading}>
                <Form
                  form={logFilterForm}
                  layout={isMobile ? "vertical" : "inline"}
                  style={{ marginBottom: 12 }}
                >
                  <Form.Item label="操作类型" name="operationType">
                    <Input placeholder="如 system_user_update" style={{ width: isMobile ? "100%" : 220 }} />
                  </Form.Item>
                  <Form.Item label="操作人" name="userName">
                    <Input placeholder="用户名" style={{ width: isMobile ? "100%" : 160 }} />
                  </Form.Item>
                  <Form.Item label="关键词" name="keyword">
                    <Input placeholder="target_id/原因/类型" style={{ width: isMobile ? "100%" : 180 }} />
                  </Form.Item>
                  <Form.Item label="时间范围" name="timeRange">
                    <DatePicker.RangePicker showTime style={{ width: isMobile ? "100%" : undefined }} />
                  </Form.Item>
                  <Button type="primary" onClick={() => void loadOperationLogs()}>
                    查询日志
                  </Button>
                </Form>

                <Table
                  rowKey={(row) => String(row.id)}
                  size="small"
                  scroll={isMobile ? { x: 980 } : undefined}
                  locale={{ emptyText: <Empty description="暂无操作日志" /> }}
                  dataSource={operationLogs}
                  columns={[
                    { title: "时间", dataIndex: "operation_time", render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm:ss") },
                    { title: "操作人", dataIndex: "user_name" },
                    { title: "角色", dataIndex: "role" },
                    { title: "操作类型", dataIndex: "operation_type" },
                    { title: "对象类型", dataIndex: "target_type" },
                    { title: "对象ID", dataIndex: "target_id" },
                    { title: "原因", dataIndex: "reason", render: (v?: string) => v ?? "-" },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}

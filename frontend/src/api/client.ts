import type { FilingStatus, PeriodType, ReportStatus, Role } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000";

function getTokenFromStorage(): string | null {
  const raw = localStorage.getItem("yn-employment-frontend-auth");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getTokenFromStorage();
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let detail = `请求失败(${response.status})`;
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) detail = data.detail;
    } catch {
      // Ignore JSON parse errors for non-JSON error responses.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function apiRequestBlob(path: string, init?: RequestInit): Promise<{ blob: Blob; fileName: string }> {
  const token = getTokenFromStorage();
  const headers = new Headers(init?.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let detail = `请求失败(${response.status})`;
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) detail = data.detail;
    } catch {
      // Ignore parse errors.
    }
    throw new Error(detail);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename=([^;]+)/i);
  const fileName = match ? decodeURIComponent(match[1].trim().replaceAll('"', "")) : `download_${Date.now()}.bin`;
  return { blob: await response.blob(), fileName };
}

function makeQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export interface LoginResp {
  access_token: string;
  token_type: string;
  role: Role;
  dashboard: string;
}

export interface BackendUser {
  id: number;
  username: string;
  name: string;
  region: string;
  role: Role;
  is_active: boolean;
  is_activated: boolean;
  login_fail_count: number;
  locked_until?: string | null;
  city_code?: string | null;
  enterprise_id?: number | null;
}

export interface BackendPeriod {
  id: number;
  period_code: string;
  period_name: string;
  month_no: number;
  half_no?: 1 | 2 | null;
  period_type: PeriodType;
  start_time: string;
  end_time: string;
  status: "启用" | "停用";
}

export interface BackendFiling {
  id: number;
  organization_code?: string | null;
  name?: string | null;
  nature?: string | null;
  industry?: string | null;
  business_scope?: string | null;
  contact_person?: string | null;
  contact_address?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  city_code?: string | null;
  city_name?: string | null;
  filing_status: FilingStatus | "未备案";
  filing_reject_reason?: string | null;
  filing_submit_time?: string | null;
  filing_review_time?: string | null;
}

export interface BackendReport {
  id: number;
  enterprise_id: number;
  enterprise_name?: string | null;
  region?: string | null;
  survey_period_id: number;
  period_code: string;
  period_name?: string | null;
  period_type?: PeriodType | null;
  base_employment: number;
  survey_employment: number;
  decrease_type?: string | null;
  decrease_reason?: string | null;
  decrease_reason_detail?: string | null;
  other_note?: string | null;
  decrease_count: number;
  status: ReportStatus;
  last_submitted_at?: string | null;
  city_reviewed_at?: string | null;
  province_reviewed_at?: string | null;
}

export interface FilingPayload {
  organization_code: string;
  name: string;
  nature: string;
  industry: string;
  business_scope: string;
  contact_person: string;
  contact_address: string;
  postal_code: string;
  phone: string;
  fax?: string;
  email?: string;
}

export interface ReportPayload {
  period_code: string;
  base_employment: number;
  survey_employment: number;
  decrease_type?: string;
  decrease_reason?: string;
  decrease_reason_detail?: string;
  other_note?: string;
}

export interface PeriodPayload {
  period_code: string;
  period_name: string;
  start_time: string;
  end_time: string;
  period_type: PeriodType;
  month_no: number;
  half_no?: number | null;
  status: "启用" | "停用";
}

export interface DeleteCheckResp {
  allowed: boolean;
  reason?: string | null;
}

export interface OperationLogResp {
  id: number;
  user_id?: number | null;
  user_name: string;
  role: string;
  operation_type: string;
  target_type: string;
  target_id: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string | null;
  operation_time: string;
  ip_address?: string | null;
}

export interface BackendNotice {
  id: number;
  title: string;
  content: string;
  scope: "province" | "city";
  city_code?: string | null;
  publisher_name: string;
  publisher_role: string;
  created_at: string;
  read_count: number;
  read: boolean;
}

export interface ProvinceCitySummaryItem {
  city: string;
  enterprise_count: number;
  base_total: number;
  survey_total: number;
  change_total: number;
}

export interface ProvinceSummaryResp {
  period_code: string;
  enterprise_total: number;
  base_total: number;
  survey_total: number;
  change_total: number;
  by_city: ProvinceCitySummaryItem[];
}

export interface ProvinceCompareCity {
  city: string;
  base_a: number;
  base_b: number;
  survey_a: number;
  survey_b: number;
  report_count_a: number;
  report_count_b: number;
}

export interface ProvinceCompareMetric {
  metric: string;
  value_a: number;
  value_b: number;
  ratio: string;
}

export interface ProvinceCompareResp {
  period_code_a: string;
  period_code_b: string;
  by_city: ProvinceCompareCity[];
  metrics: ProvinceCompareMetric[];
}

export interface ProvinceTrendPoint {
  period_code: string;
  period_name: string;
  base_total: number;
  survey_total: number;
  change_total: number;
  change_ratio: number;
}

export interface ProvinceTrendResp {
  points: ProvinceTrendPoint[];
}

export interface ProvinceMultiDimItem {
  dimension: string;
  value: string;
  enterprise_count: number;
  base_total: number;
  survey_total: number;
  change_total: number;
  decrease_total: number;
  change_ratio: number;
}

export interface ProvinceMultiDimResp {
  period_code: string;
  dimension: string;
  items: ProvinceMultiDimItem[];
}

export interface ProvinceSamplingCity {
  city: string;
  enterprise_count: number;
  ratio: number;
}

export interface ProvinceSamplingResp {
  period_code: string;
  total_enterprises: number;
  city_count: number;
  by_city: ProvinceSamplingCity[];
}

export interface ExportRowResp {
  report_id: number;
  unit_name: string;
  account?: string | null;
  role: string;
  user_type: string;
  city?: string | null;
  county?: string | null;
  area?: string | null;
  unit_nature?: string | null;
  industry?: string | null;
  status: ReportStatus;
  period_code: string;
  period_name?: string | null;
  stat_month?: number | null;
  stat_quarter?: number | null;
  base_employment: number;
  survey_employment: number;
  updated_at: string;
}

export interface SystemUserResp {
  id: number;
  username: string;
  role: Role;
  custom_role_id?: number | null;
  custom_role_name?: string | null;
  is_active: boolean;
  is_activated: boolean;
  login_fail_count: number;
  locked_until?: string | null;
  city_code?: string | null;
  enterprise_id?: number | null;
  created_at: string;
}

export interface SystemRoleResp {
  id: string;
  name: string;
  scope: Role;
  is_builtin: boolean;
  assigned_user_count: number;
  permissions: string[];
}

export interface SystemRoleDeleteCheckResp {
  allowed: boolean;
  reason?: string | null;
  assigned_user_count: number;
}

export interface SystemMonitorResp {
  total_users: number;
  active_users: number;
  enterprises: number;
  reports: number;
  notices: number;
  pending_review_count: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  api_latency_ms: number;
  warning_level: string;
}

export interface SystemMonitorSnapshotResp {
  id: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_users: number;
  pending_review_count: number;
  api_latency_ms: number;
  warning_level: string;
  created_at: string;
}

export interface NationalPushConfigResp {
  enabled: boolean;
  api_key_masked: string;
  updated_at: string;
}

export interface NationalPushRecordResp {
  id: number;
  batch_id: string;
  period_code: string;
  report_count: number;
  pushed_count: number;
  failed_count: number;
  status: string;
  attempt_count: number;
  last_error_code?: number | null;
  last_error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NationalPushLogResp {
  id: number;
  batch_id: string;
  attempt_no: number;
  status: string;
  status_code?: number | null;
  message: string;
  detail?: Record<string, unknown> | null;
  created_at: string;
}

export interface NationalPushPreviewResp {
  period_code: string;
  report_count: number;
  enterprise_count: number;
  payload: Array<Record<string, unknown>>;
}

export interface NationalPushResultResp {
  batch_id: string;
  pushed_count: number;
  failed_count: number;
  status: string;
  attempt_count: number;
}

export const api = {
  login: (username: string, password: string) =>
    apiRequest<LoginResp>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => apiRequest<BackendUser>("/auth/me"),
  changePassword: (payload: { old_password: string; new_password: string }) =>
    apiRequest<{ changed: boolean }>("/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),

  listPeriods: () => apiRequest<BackendPeriod[]>("/survey-periods"),
  listCurrentPeriods: () => apiRequest<BackendPeriod[]>("/survey-periods/current"),
  createPeriod: (payload: PeriodPayload) =>
    apiRequest<BackendPeriod>("/survey-periods", { method: "POST", body: JSON.stringify(payload) }),
  updatePeriod: (id: number, payload: PeriodPayload) =>
    apiRequest<BackendPeriod>(`/survey-periods/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  getMyFiling: () => apiRequest<BackendFiling>("/filings/me"),
  saveFiling: (payload: FilingPayload) => apiRequest<BackendFiling>("/filings/save", { method: "POST", body: JSON.stringify(payload) }),
  submitFiling: (payload: FilingPayload) => apiRequest<BackendFiling>("/filings/submit", { method: "POST", body: JSON.stringify(payload) }),
  listFilings: (params?: { filingStatus?: FilingStatus; name?: string; region?: string; periodCode?: string }) =>
    apiRequest<BackendFiling[]>(
      `/filings${makeQuery({
        filing_status_value: params?.filingStatus,
        name: params?.name,
        region: params?.region,
        period_code: params?.periodCode,
      })}`,
    ),
  filingDetail: (enterpriseId: number) => apiRequest<BackendFiling>(`/filings/${enterpriseId}`),
  approveFiling: (enterpriseId: number) => apiRequest<BackendFiling>(`/filings/${enterpriseId}/approve`, { method: "POST" }),
  rejectFiling: (enterpriseId: number, reason: string) =>
    apiRequest<BackendFiling>(`/filings/${enterpriseId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),

  listMyReports: () => apiRequest<BackendReport[]>("/reports/me"),
  listAvailableReportPeriods: () => apiRequest<BackendPeriod[]>("/reports/available-periods"),
  getCurrentPeriodReport: (periodCode: string) => apiRequest<BackendReport | null>(`/reports/current?period_code=${encodeURIComponent(periodCode)}`),
  saveReport: (payload: ReportPayload) => apiRequest<BackendReport>("/reports/save", { method: "POST", body: JSON.stringify(payload) }),
  submitReport: (payload: ReportPayload) => apiRequest<BackendReport>("/reports/submit", { method: "POST", body: JSON.stringify(payload) }),

  listCityReports: () => apiRequest<BackendReport[]>("/city/reports"),
  cityReportDetail: (reportId: number) => apiRequest<BackendReport>(`/city/reports/${reportId}`),
  cityApprove: (reportId: number) => apiRequest<BackendReport>(`/city/reports/${reportId}/approve`, { method: "POST" }),
  cityReject: (reportId: number, reason: string) =>
    apiRequest<BackendReport>(`/city/reports/${reportId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),

  listProvinceReports: () => apiRequest<BackendReport[]>("/province/reports"),
  provinceReportDetail: (reportId: number) => apiRequest<BackendReport>(`/province/reports/${reportId}`),
  provinceApprove: (reportId: number) => apiRequest<BackendReport>(`/province/reports/${reportId}/approve`, { method: "POST" }),
  provinceReject: (reportId: number, reason: string) =>
    apiRequest<BackendReport>(`/province/reports/${reportId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  provinceSubmit: (reportId: number) => apiRequest<BackendReport>(`/province/reports/${reportId}/submit`, { method: "POST" }),
  provinceModify: (
    reportId: number,
    payload: {
      base_employment: number;
      survey_employment: number;
      decrease_type?: string;
      decrease_reason?: string;
      decrease_reason_detail?: string;
      other_note?: string;
      reason: string;
    },
  ) => apiRequest<BackendReport>(`/province/reports/${reportId}/modify`, { method: "POST", body: JSON.stringify(payload) }),
  provinceDeleteCheck: (reportId: number) => apiRequest<DeleteCheckResp>(`/province/reports/${reportId}/delete-check`),
  provinceDelete: (reportId: number, reason: string) =>
    apiRequest<{ deleted: boolean; report_id: number }>(`/province/reports/${reportId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),

  provinceSummary: (periodCode?: string) =>
    apiRequest<ProvinceSummaryResp>(`/province/summary${periodCode ? `?period_code=${encodeURIComponent(periodCode)}` : ""}`),
  provinceCompare: (periodCodeA: string, periodCodeB: string, dimension = "region") =>
    apiRequest<ProvinceCompareResp>(
      `/province/analysis/compare?period_code_a=${encodeURIComponent(periodCodeA)}&period_code_b=${encodeURIComponent(periodCodeB)}&dimension=${encodeURIComponent(dimension)}`,
    ),
  provinceTrend: (periodCodes?: string[]) =>
    apiRequest<ProvinceTrendResp>(
      `/province/analysis/trend${periodCodes && periodCodes.length > 0 ? `?period_codes=${encodeURIComponent(periodCodes.join(","))}` : ""}`,
    ),
  provinceSampling: (periodCode?: string, city?: string) => {
    const query = new URLSearchParams();
    if (periodCode) query.set("period_code", periodCode);
    if (city) query.set("city", city);
    const suffix = query.toString();
    return apiRequest<ProvinceSamplingResp>(`/province/sampling${suffix ? `?${suffix}` : ""}`);
  },
  provinceMultiDim: (params?: { periodCode?: string; dimension?: "region" | "nature" | "industry"; city?: string; nature?: string; industry?: string }) => {
    const suffix = makeQuery({
      period_code: params?.periodCode,
      dimension: params?.dimension,
      city: params?.city,
      nature: params?.nature,
      industry: params?.industry,
    });
    return apiRequest<ProvinceMultiDimResp>(`/province/analysis/multi-dim${suffix}`);
  },

  provinceExportQuery: (params?: {
    unitName?: string;
    account?: string;
    userType?: string;
    city?: string;
    county?: string;
    area?: string;
    reportStatus?: ReportStatus;
    unitNature?: string;
    industry?: string;
    periodCode?: string;
    statMonth?: number;
    statQuarter?: number;
    startTime?: string;
    endTime?: string;
  }) => {
    const suffix = makeQuery({
      unit_name: params?.unitName,
      account: params?.account,
      user_type: params?.userType,
      city: params?.city,
      county: params?.county,
      area: params?.area,
      report_status: params?.reportStatus,
      unit_nature: params?.unitNature,
      industry: params?.industry,
      period_code: params?.periodCode,
      stat_month: params?.statMonth,
      stat_quarter: params?.statQuarter,
      start_time: params?.startTime,
      end_time: params?.endTime,
    });
    return apiRequest<ExportRowResp[]>(`/province/export/query${suffix}`);
  },

  provinceExportXlsx: (params?: {
    unitName?: string;
    account?: string;
    userType?: string;
    city?: string;
    county?: string;
    area?: string;
    reportStatus?: ReportStatus;
    unitNature?: string;
    industry?: string;
    periodCode?: string;
    statMonth?: number;
    statQuarter?: number;
    startTime?: string;
    endTime?: string;
  }) => {
    const suffix = makeQuery({
      unit_name: params?.unitName,
      account: params?.account,
      user_type: params?.userType,
      city: params?.city,
      county: params?.county,
      area: params?.area,
      report_status: params?.reportStatus,
      unit_nature: params?.unitNature,
      industry: params?.industry,
      period_code: params?.periodCode,
      stat_month: params?.statMonth,
      stat_quarter: params?.statQuarter,
      start_time: params?.startTime,
      end_time: params?.endTime,
    });
    return apiRequestBlob(`/province/export/xlsx${suffix}`);
  },

  provinceFilingExportXlsx: (params?: { filingStatus?: FilingStatus; name?: string; region?: string; periodCode?: string }) => {
    const suffix = makeQuery({
      filing_status_value: params?.filingStatus,
      name: params?.name,
      region: params?.region,
      period_code: params?.periodCode,
    });
    return apiRequestBlob(`/province/filings/export/xlsx${suffix}`);
  },

  systemListUsers: (params?: { role?: Role; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.keyword) query.set("keyword", params.keyword);
    const suffix = query.toString();
    return apiRequest<SystemUserResp[]>(`/system/users${suffix ? `?${suffix}` : ""}`);
  },
  systemCreateUser: (payload: {
    username: string;
    password: string;
    role: Role;
    custom_role_id?: number | null;
    is_active?: boolean;
    is_activated?: boolean;
    city_code?: string | null;
    enterprise_id?: number | null;
  }) => apiRequest<SystemUserResp>("/system/users", { method: "POST", body: JSON.stringify(payload) }),
  systemUpdateUser: (
    userId: number,
    payload: {
      role?: Role;
      custom_role_id?: number | null;
      is_active?: boolean;
      is_activated?: boolean;
      city_code?: string | null;
      enterprise_id?: number | null;
      password?: string;
    },
  ) => apiRequest<SystemUserResp>(`/system/users/${userId}`, { method: "PUT", body: JSON.stringify(payload) }),
  systemUserDeleteCheck: (userId: number) => apiRequest<DeleteCheckResp>(`/system/users/${userId}/delete-check`),
  systemDeleteUser: (userId: number) => apiRequest<{ deleted: boolean; user_id: number }>(`/system/users/${userId}`, { method: "DELETE" }),
  systemChangeUserRole: (userId: number, payload: { new_role: Role; custom_role_id?: number | null; reason: string }) =>
    apiRequest<{ changed: boolean; user_id: number; role: Role; custom_role_id?: number | null }>(`/system/users/${userId}/role-change`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  systemRoles: () => apiRequest<SystemRoleResp[]>("/system/roles"),
  systemCreateCustomRole: (payload: { name: string; scope: Role; permissions: string[] }) =>
    apiRequest<SystemRoleResp>("/system/roles/custom", { method: "POST", body: JSON.stringify(payload) }),
  systemUpdateCustomRole: (roleId: number, payload: { name: string; permissions: string[] }) =>
    apiRequest<SystemRoleResp>(`/system/roles/custom/${roleId}`, { method: "PUT", body: JSON.stringify(payload) }),
  systemRoleDeleteCheck: (role: Role) => apiRequest<DeleteCheckResp>(`/system/roles/${role}/delete-check`),
  systemCustomRoleDeleteCheck: (roleId: number) => apiRequest<SystemRoleDeleteCheckResp>(`/system/roles/custom/${roleId}/delete-check`),
  systemDeleteCustomRole: (roleId: number, detachAssignedUsers = false) =>
    apiRequest<{ deleted: boolean; role_id: number; detached_users: number }>(
      `/system/roles/custom/${roleId}?detach_assigned_users=${detachAssignedUsers ? "true" : "false"}`,
      { method: "DELETE" },
    ),
  systemDeleteRole: (role: Role) => apiRequest<{ deleted: boolean }>(`/system/roles/${role}`, { method: "DELETE" }),
  systemMonitor: () => apiRequest<SystemMonitorResp>("/system/monitor"),
  systemMonitorSnapshots: (limit = 10) => apiRequest<SystemMonitorSnapshotResp[]>(`/system/monitor/snapshots?limit=${limit}`),

  nationalPushConfig: () => apiRequest<NationalPushConfigResp>("/national/push/config"),
  nationalPushSetConfig: (payload: { api_key: string; enabled: boolean }) =>
    apiRequest<NationalPushConfigResp>("/national/push/config", { method: "POST", body: JSON.stringify(payload) }),

  nationalPushPreview: (periodCode?: string) =>
    apiRequest<NationalPushPreviewResp>(`/national/push/preview${periodCode ? `?period_code=${encodeURIComponent(periodCode)}` : ""}`, {
      method: "POST",
    }),
  nationalPush: (payload: { period_code?: string; simulate_http_status?: number }) =>
    apiRequest<NationalPushResultResp>("/national/push", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  nationalPushRecords: (params?: { status?: string; batchId?: string; periodCode?: string; limit?: number }) =>
    apiRequest<NationalPushRecordResp[]>(
      `/national/push/records${makeQuery({
        status_value: params?.status,
        batch_id: params?.batchId,
        period_code: params?.periodCode,
        limit: params?.limit,
      })}`,
    ),
  nationalPushRecordLogs: (batchId: string) => apiRequest<NationalPushLogResp[]>(`/national/push/records/${batchId}/logs`),
  nationalPushRetry: (batchId: string, payload: { period_code?: string; simulate_http_status?: number }) =>
    apiRequest<NationalPushResultResp>(`/national/push/records/${batchId}/retry`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listNotices: () => apiRequest<BackendNotice[]>("/notices"),
  noticeDetail: (noticeId: number) => apiRequest<BackendNotice>(`/notices/${noticeId}`),
  markNoticeRead: (noticeId: number) => apiRequest<{ read: boolean }>(`/notices/${noticeId}/read`, { method: "POST" }),
  noticeUnreadCount: () => apiRequest<{ unread_count: number }>("/notices/unread-count"),

  listProvinceManageNotices: () => apiRequest<BackendNotice[]>("/province/notices/manage"),
  createProvinceNotice: (payload: { title: string; content: string }) =>
    apiRequest<BackendNotice>("/province/notices", { method: "POST", body: JSON.stringify(payload) }),
  updateProvinceNotice: (noticeId: number, payload: { title: string; content: string }) =>
    apiRequest<BackendNotice>(`/province/notices/${noticeId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProvinceNotice: (noticeId: number) =>
    apiRequest<{ deleted: boolean }>(`/province/notices/${noticeId}`, { method: "DELETE" }),

  listCityManageNotices: () => apiRequest<BackendNotice[]>("/city/notices/manage"),
  createCityNotice: (payload: { title: string; content: string }) =>
    apiRequest<BackendNotice>("/city/notices", { method: "POST", body: JSON.stringify(payload) }),
  updateCityNotice: (noticeId: number, payload: { title: string; content: string }) =>
    apiRequest<BackendNotice>(`/city/notices/${noticeId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCityNotice: (noticeId: number) => apiRequest<{ deleted: boolean }>(`/city/notices/${noticeId}`, { method: "DELETE" }),

  listOperationLogs: (params?: {
    operationType?: string;
    userName?: string;
    targetType?: string;
    keyword?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }) =>
    apiRequest<OperationLogResp[]>(
      `/operation-logs${makeQuery({
        operation_type: params?.operationType,
        user_name: params?.userName,
        target_type: params?.targetType,
        keyword: params?.keyword,
        start_time: params?.startTime,
        end_time: params?.endTime,
        limit: params?.limit,
      })}`,
    ),
};

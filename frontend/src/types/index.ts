export type Role = "enterprise" | "city" | "province";

export type FilingStatus = "未备案" | "待备案" | "已备案" | "备案退回";

export type ReportStatus =
  | "草稿"
  | "待市审"
  | "市审通过"
  | "市审退回"
  | "待省审"
  | "省审通过"
  | "省审退回"
  | "已上报"
  | "已上报部委";

export type PeriodType = "MONTH" | "HALF_MONTH";

export interface SurveyPeriod {
  periodCode: string;
  periodName: string;
  monthNo: number;
  halfNo?: 1 | 2;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
}

export interface User {
  id: number | string;
  username: string;
  name: string;
  role: Role;
  region: string;
  cityCode?: string | null;
  enterpriseId?: number | null;
}

export interface EnterpriseRecord {
  id: string;
  name: string;
  orgCode: string;
  region: string;
  contact: string;
  filingStatus: FilingStatus;
}

export interface ReportRecord {
  id: string;
  enterpriseName: string;
  periodCode: string;
  periodName: string;
  baseEmployment: number;
  surveyEmployment: number;
  status: ReportStatus;
  submitTime: string;
  cityReviewTime?: string;
  region: string;
  reason?: string;
}

export interface NoticeRecord {
  id: string;
  title: string;
  content: string;
  publisher: string;
  publishTime: string;
  read?: boolean;
  status?: "已发布" | "已删除";
}

export interface DashboardStat {
  title: string;
  value: number | string;
  suffix?: string;
  trend?: string;
}

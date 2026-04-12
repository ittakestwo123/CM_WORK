import {
  BarChartOutlined,
  BellOutlined,
  ClusterOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FormOutlined,
  LockOutlined,
  NotificationOutlined,
  PieChartOutlined,
  ScheduleOutlined,
  SearchOutlined,
  SettingOutlined,
  TableOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import type { ItemType } from "antd/es/menu/interface";

import type { Role } from "../types";

export interface MenuRoute {
  key: string;
  path: string;
  label: string;
}

export const roleHomePath: Record<Role, string> = {
  enterprise: "/app/home",
  city: "/app/home",
  province: "/app/home",
};

export const roleMenuItems: Record<Role, ItemType[]> = {
  enterprise: [
    { key: "/app/home", icon: <DashboardOutlined />, label: "工作台" },
    { key: "/app/enterprise/filing", icon: <FileProtectOutlined />, label: "企业备案信息" },
    { key: "/app/enterprise/reporting", icon: <FormOutlined />, label: "数据填报" },
    { key: "/app/enterprise/reports", icon: <TableOutlined />, label: "企业数据查询" },
    { key: "/app/enterprise/notices", icon: <NotificationOutlined />, label: "通知浏览" },
    { key: "/app/enterprise/password", icon: <LockOutlined />, label: "密码修改" },
  ],
  city: [
    { key: "/app/home", icon: <DashboardOutlined />, label: "市级工作台" },
    { key: "/app/city/review", icon: <FormOutlined />, label: "数据审核" },
    { key: "/app/city/notices", icon: <BellOutlined />, label: "通知发布" },
    { key: "/app/city/password", icon: <LockOutlined />, label: "密码修改" },
  ],
  province: [
    { key: "/app/home", icon: <DashboardOutlined />, label: "省级工作台" },
    { key: "/app/province/filing-approval", icon: <FileProtectOutlined />, label: "企业备案审批" },
    { key: "/app/province/report-manage", icon: <FormOutlined />, label: "省级报表管理" },
    { key: "/app/province/summary", icon: <TableOutlined />, label: "数据汇总" },
    { key: "/app/province/analysis", icon: <BarChartOutlined />, label: "图表分析" },
    { key: "/app/province/sampling", icon: <PieChartOutlined />, label: "取样分析" },
    { key: "/app/province/export", icon: <SearchOutlined />, label: "数据查询与导出" },
    { key: "/app/province/notices", icon: <BellOutlined />, label: "发布通知" },
    { key: "/app/province/system", icon: <SettingOutlined />, label: "系统管理" },
  ],
};

export const allRoutes: MenuRoute[] = [
  { path: "/app/home", key: "home", label: "工作台" },
  { path: "/app/enterprise/filing", key: "enterprise-filing", label: "企业备案信息" },
  { path: "/app/enterprise/reporting", key: "enterprise-reporting", label: "数据填报" },
  { path: "/app/enterprise/reports", key: "enterprise-reports", label: "企业数据查询" },
  { path: "/app/enterprise/notices", key: "enterprise-notices", label: "通知浏览" },
  { path: "/app/enterprise/password", key: "enterprise-password", label: "密码修改" },
  { path: "/app/city/review", key: "city-review", label: "数据审核" },
  { path: "/app/city/notices", key: "city-notices", label: "通知发布" },
  { path: "/app/city/password", key: "city-password", label: "密码修改" },
  { path: "/app/province/filing-approval", key: "province-filing", label: "企业备案审批" },
  { path: "/app/province/report-manage", key: "province-report", label: "省级报表管理" },
  { path: "/app/province/summary", key: "province-summary", label: "数据汇总" },
  { path: "/app/province/analysis", key: "province-analysis", label: "图表分析" },
  { path: "/app/province/sampling", key: "province-sampling", label: "取样分析" },
  { path: "/app/province/export", key: "province-export", label: "数据查询与导出" },
  { path: "/app/province/notices", key: "province-notices", label: "发布通知" },
  { path: "/app/province/system", key: "province-system", label: "系统管理" },
];

export const systemTabs = [
  { key: "period", icon: <ScheduleOutlined />, label: "上报时限" },
  { key: "user", icon: <UsergroupAddOutlined />, label: "用户管理" },
  { key: "role", icon: <ClusterOutlined />, label: "角色管理" },
  { key: "monitor", icon: <BarChartOutlined />, label: "系统监控" },
];

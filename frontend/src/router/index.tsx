import { Result } from "antd";
import type { ReactElement } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { CityNoticePage } from "../pages/city/NoticePage";
import { CityReviewPage } from "../pages/city/ReviewPage";
import { HomePage } from "../pages/dashboard/HomePage";
import { EnterpriseFilingPage } from "../pages/enterprise/FilingPage";
import { EnterpriseNoticePage } from "../pages/enterprise/NoticePage";
import { EnterpriseReportQueryPage } from "../pages/enterprise/ReportQueryPage";
import { EnterpriseReportingPage } from "../pages/enterprise/ReportingPage";
import { ProvinceAnalysisPage } from "../pages/province/AnalysisPage";
import { ProvinceExportPage } from "../pages/province/ExportPage";
import { ProvinceFilingApprovalPage } from "../pages/province/FilingApprovalPage";
import { ProvinceNoticePage } from "../pages/province/NoticePage";
import { ProvinceReportManagePage } from "../pages/province/ReportManagePage";
import { ProvinceSummaryPage } from "../pages/province/SummaryPage";
import { ProvinceSystemManagePage } from "../pages/province/SystemManagePage";
import { PasswordPage } from "../pages/shared/PasswordPage";
import { useAuthStore } from "../store/auth";
import type { Role } from "../types";

function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleGuard({ allow, children }: { allow: Role[]; children: ReactElement }) {
  const role = useAuthStore((state) => state.role);
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) {
    return <Result status="403" title="无权限访问" subTitle="当前角色无权限访问该页面" />;
  }
  return children;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: <RequireAuth />,
    children: [
      {
        path: "",
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/app/home" replace /> },
          { path: "home", element: <HomePage /> },

          {
            path: "enterprise/filing",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <EnterpriseFilingPage />
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/reporting",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <EnterpriseReportingPage />
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/reports",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <EnterpriseReportQueryPage />
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/notices",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <EnterpriseNoticePage />
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/password",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <PasswordPage title="企业密码修改" />
              </RoleGuard>
            ),
          },

          {
            path: "city/review",
            element: (
              <RoleGuard allow={["city"]}>
                <CityReviewPage />
              </RoleGuard>
            ),
          },
          {
            path: "city/notices",
            element: (
              <RoleGuard allow={["city"]}>
                <CityNoticePage />
              </RoleGuard>
            ),
          },
          {
            path: "city/password",
            element: (
              <RoleGuard allow={["city"]}>
                <PasswordPage title="市级密码修改" />
              </RoleGuard>
            ),
          },

          {
            path: "province/filing-approval",
            element: (
              <RoleGuard allow={["province"]}>
                <ProvinceFilingApprovalPage />
              </RoleGuard>
            ),
          },
          {
            path: "province/report-manage",
            element: (
              <RoleGuard allow={["province"]}>
                <ProvinceReportManagePage />
              </RoleGuard>
            ),
          },
          {
            path: "province/summary",
            element: (
              <RoleGuard allow={["province"]}>
                <ProvinceSummaryPage />
              </RoleGuard>
            ),
          },
          {
            path: "province/analysis",
            element: (
              <RoleGuard allow={["province"]}>
                <ProvinceAnalysisPage />
              </RoleGuard>
            ),
          },
          {
            path: "province/export",
            element: (
              <RoleGuard allow={["province"]}>
                <ProvinceExportPage />
              </RoleGuard>
            ),
          },
          {
            path: "province/notices",
            element: (
              <RoleGuard allow={["province"]}>
                <ProvinceNoticePage />
              </RoleGuard>
            ),
          },
          {
            path: "province/system",
            element: (
              <RoleGuard allow={["province"]}>
                <ProvinceSystemManagePage />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

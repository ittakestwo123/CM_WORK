import { Result, Skeleton } from "antd";
import { Suspense, lazy, type ReactElement, type ReactNode } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

import { useAuthStore } from "../store/auth";
import type { Role } from "../types";

const AppLayout = lazy(async () => ({ default: (await import("../components/layout/AppLayout")).AppLayout }));
const LoginPage = lazy(async () => ({ default: (await import("../pages/auth/LoginPage")).LoginPage }));
const CityNoticePage = lazy(async () => ({ default: (await import("../pages/city/NoticePage")).CityNoticePage }));
const CityReviewPage = lazy(async () => ({ default: (await import("../pages/city/ReviewPage")).CityReviewPage }));
const HomePage = lazy(async () => ({ default: (await import("../pages/dashboard/HomePage")).HomePage }));
const EnterpriseFilingPage = lazy(async () => ({ default: (await import("../pages/enterprise/FilingPage")).EnterpriseFilingPage }));
const EnterpriseNoticePage = lazy(async () => ({ default: (await import("../pages/enterprise/NoticePage")).EnterpriseNoticePage }));
const EnterpriseReportQueryPage = lazy(async () => ({ default: (await import("../pages/enterprise/ReportQueryPage")).EnterpriseReportQueryPage }));
const EnterpriseReportingPage = lazy(async () => ({ default: (await import("../pages/enterprise/ReportingPage")).EnterpriseReportingPage }));
const ProvinceAnalysisPage = lazy(async () => ({ default: (await import("../pages/province/AnalysisPage")).ProvinceAnalysisPage }));
const ProvinceExportPage = lazy(async () => ({ default: (await import("../pages/province/ExportPage")).ProvinceExportPage }));
const ProvinceFilingApprovalPage = lazy(async () => ({ default: (await import("../pages/province/FilingApprovalPage")).ProvinceFilingApprovalPage }));
const ProvinceNoticePage = lazy(async () => ({ default: (await import("../pages/province/NoticePage")).ProvinceNoticePage }));
const ProvinceReportManagePage = lazy(async () => ({ default: (await import("../pages/province/ReportManagePage")).ProvinceReportManagePage }));
const ProvinceSamplingPage = lazy(async () => ({ default: (await import("../pages/province/SamplingPage")).ProvinceSamplingPage }));
const ProvinceSummaryPage = lazy(async () => ({ default: (await import("../pages/province/SummaryPage")).ProvinceSummaryPage }));
const ProvinceSystemManagePage = lazy(async () => ({ default: (await import("../pages/province/SystemManagePage")).ProvinceSystemManagePage }));
const PasswordPage = lazy(async () => ({ default: (await import("../pages/shared/PasswordPage")).PasswordPage }));

function PageLoading() {
  return (
    <div style={{ padding: 16 }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

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
  {
    path: "/login",
    element: (
      <LazyPage>
        <LoginPage />
      </LazyPage>
    ),
  },
  {
    path: "/app",
    element: <RequireAuth />,
    children: [
      {
        path: "",
        element: (
          <LazyPage>
            <AppLayout />
          </LazyPage>
        ),
        children: [
          { index: true, element: <Navigate to="/app/home" replace /> },
          {
            path: "home",
            element: (
              <LazyPage>
                <HomePage />
              </LazyPage>
            ),
          },

          {
            path: "enterprise/filing",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <LazyPage>
                  <EnterpriseFilingPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/reporting",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <LazyPage>
                  <EnterpriseReportingPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/reports",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <LazyPage>
                  <EnterpriseReportQueryPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/notices",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <LazyPage>
                  <EnterpriseNoticePage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "enterprise/password",
            element: (
              <RoleGuard allow={["enterprise"]}>
                <LazyPage>
                  <PasswordPage title="企业密码修改" />
                </LazyPage>
              </RoleGuard>
            ),
          },

          {
            path: "city/review",
            element: (
              <RoleGuard allow={["city"]}>
                <LazyPage>
                  <CityReviewPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "city/notices",
            element: (
              <RoleGuard allow={["city"]}>
                <LazyPage>
                  <CityNoticePage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "city/password",
            element: (
              <RoleGuard allow={["city"]}>
                <LazyPage>
                  <PasswordPage title="市级密码修改" />
                </LazyPage>
              </RoleGuard>
            ),
          },

          {
            path: "province/filing-approval",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceFilingApprovalPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "province/report-manage",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceReportManagePage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "province/summary",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceSummaryPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "province/analysis",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceAnalysisPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "province/sampling",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceSamplingPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "province/export",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceExportPage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "province/notices",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceNoticePage />
                </LazyPage>
              </RoleGuard>
            ),
          },
          {
            path: "province/system",
            element: (
              <RoleGuard allow={["province"]}>
                <LazyPage>
                  <ProvinceSystemManagePage />
                </LazyPage>
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

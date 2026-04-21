import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./router";
import "./styles/theme.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: [theme.defaultAlgorithm, theme.compactAlgorithm],
        token: {
          colorPrimary: "#2f4d69",
          colorInfo: "#496985",
          colorSuccess: "#3f7b62",
          colorWarning: "#b0833b",
          colorError: "#b5565f",
          colorText: "#1f2f42",
          colorTextSecondary: "#5f6f83",
          colorTextTertiary: "#8695a8",
          colorBgLayout: "#eef3f8",
          colorBgContainer: "#ffffff",
          colorBorder: "#dbe3ee",
          colorBorderSecondary: "#e3eaf2",
          borderRadius: 12,
          borderRadiusLG: 16,
          boxShadow: "0 8px 24px rgba(29, 52, 79, 0.09)",
          boxShadowSecondary: "0 3px 14px rgba(29, 52, 79, 0.06)",
          controlHeight: 38,
          controlHeightLG: 42,
          fontSize: 14,
        },
        components: {
          Breadcrumb: {
            itemColor: "#6b7b8f",
            lastItemColor: "#34495f",
          },
          Button: {
            borderRadius: 10,
            primaryShadow: "0 8px 18px rgba(47, 77, 105, 0.24)",
            defaultBorderColor: "#cfd9e5",
            defaultColor: "#2f4d69",
          },
          Tag: {
            borderRadiusSM: 999,
          },
          Input: {
            activeBorderColor: "#577696",
            hoverBorderColor: "#7e97b2",
          },
          Select: {
            activeBorderColor: "#577696",
            hoverBorderColor: "#7e97b2",
          },
          Layout: {
            headerBg: "#ffffff",
            siderBg: "#f4f8fc",
            bodyBg: "#eef3f8",
          },
          Card: {
            headerBg: "#ffffff",
            bodyPadding: 18,
            headerHeight: 52,
          },
          Form: {
            itemMarginBottom: 16,
          },
          Table: {
            headerBg: "#f3f7fb",
            headerColor: "#2e4055",
            borderColor: "#e1e8f0",
            rowHoverBg: "#f7fbff",
          },
          Drawer: {
            colorBgElevated: "#ffffff",
          },
          Modal: {
            contentBg: "#ffffff",
          },
          Tabs: {
            inkBarColor: "#2f4d69",
            itemColor: "#5f6f83",
            itemSelectedColor: "#2f4d69",
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
);

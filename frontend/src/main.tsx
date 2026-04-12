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
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#3e5f82",
          colorInfo: "#4e7398",
          colorSuccess: "#2f8f72",
          colorWarning: "#d8912a",
          colorError: "#c8474a",
          colorBgLayout: "#f2f5f9",
          colorBgContainer: "#ffffff",
          colorBorderSecondary: "#e5ebf3",
          borderRadius: 10,
          borderRadiusLG: 14,
          boxShadow: "0 6px 18px rgba(48, 76, 112, 0.10)",
          boxShadowSecondary: "0 3px 12px rgba(48, 76, 112, 0.08)",
          fontSize: 14,
        },
        components: {
          Layout: {
            headerBg: "#ffffff",
            siderBg: "#f8fbff",
            bodyBg: "#f2f5f9",
          },
          Card: {
            headerBg: "#ffffff",
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
);

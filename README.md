# CM_WORK - 最终可交付版（Phase A-H）

## 项目简介
本项目是“云南省企业就业失业数据采集系统”的课程迭代实现。

目标：在已有高保真前端原型上，升级为“真实后端业务闭环 + 手机端可用 + 省级管理可演示交付”的系统。

## 第三周新增能力

### 1. 真实后端业务闭环
- 接入真实 FastAPI + SQLAlchemy + SQLite 数据链路。
- 调查期管理（支持 `1/2/3` 月半月报、其他月份月报）真实落库。
- 企业备案真实流转：保存草稿、上报、省级审批通过/退回。
- 企业填报真实流转：查询可填报期、加载当前期已有数据、暂存、上报、历史查询。
- 市级审核真实流转：列表、详情、审核通过、退回（原因必填）。
- 省级审核真实流转：审核通过、退回、数据修改、上报部委占位、删除校验。

### 2. 业务规则后端化
- 企业未备案不可填报。
- 必须在当前启用调查期内填报。
- 同企业同调查期唯一报表（数据库唯一约束）。
- 仅 `草稿/市审退回/省审退回` 可继续编辑。
- 就业人数为非负整数。
- 减员场景强校验：
  - 减少类型必填
  - 主要原因必填
  - 主要原因说明必填
  - 类型或原因为“其他”时，补充说明必填

### 3. RBAC 与数据隔离
- 企业用户：仅可操作本企业数据。
- 市级用户：仅可查看并审核本辖区企业数据。
- 省级用户：可查看全省数据并执行省级管理操作。
- 系统管理（上报时限）仅省级可访问。

### 4. 操作日志留痕
- 新增 `operation_log` 表并统一写入。
- 同时保留 `audit_logs` 兼容查询。
- 记录操作人、角色、类型、对象、前后值、原因、时间、IP。
- 报表关键动作继续保留版本快照（`report_versions`）。

### 5. 移动端支持（响应式 Web）
在现有 React + TypeScript + Ant Design 项目中完成，不新建独立 App：
- 登录页
- 企业端：工作台、备案、填报、查询
- 市级端：审核列表、详情、退回底部抽屉
- 省级端：报表管理列表、详情、退回底部抽屉
- 布局：桌面侧边栏 + 移动端抽屉菜单
- 列表：桌面表格 + 移动端卡片降级

### 6. 通知全生命周期（Phase A）
- 通知模型支持作用域（省级/市级）、阅读状态、阅读计数、逻辑删除。
- 企业/市级/省级统一通知浏览接口，按角色与辖区过滤可见范围。
- 市级、省级通知管理：新增、编辑、逻辑删除。
- 通知操作统一写入 `audit_logs` + `operation_log`。

### 7. 省级真实汇总与分析（Phase B）
- 新增省级汇总接口：按调查期聚合全省与各地市数据。
- 新增对比分析接口：调查期 A/B 对比，含指标变化比率。
- 新增趋势分析接口：多调查期连续趋势。
- 新增取样分析接口：按地市样本企业数量与占比。

### 8. 查询导出（Phase C）
- 新增省级导出查询接口，支持单位、账号、地市、状态、调查期、时间范围过滤。
- 新增真正 Excel（xlsx）导出能力（后端），并在前端提供一键下载。
- 导出文件包含查询条件、导出时间、操作用户。
- 覆盖省级企业备案列表导出与省级数据查询导出。
- 企业端查询页仅支持浏览，不提供导出。

### 9. 系统管理真实后台（Phase D）
- 用户管理真实接口：列表、创建、更新、角色变更。
- 角色管理真实接口：返回角色权限映射 + 删除限制检查。
- 系统监控真实接口：CPU、内存、磁盘、在线用户数、当前调查期待审核量、接口响应时间。
- 支持预警等级展示与监控快照列表。

### 10. 国家接口演示增强（Phase E）
- 新增 API Key 配置接口（启用/禁用与掩码展示）。
- 新增国家推送预览接口：构建待推送数据包。
- 新增国家推送执行接口：生成批次号并记录推送日志（演示模式）。
- 新增推送记录查询、推送日志查询、失败/待重试批次重试接口。
- 异常策略增强：
  - `400` 参数错误：记录日志并返回明确提示。
  - `401` 认证失败：提示 API Key 问题。
  - `500` 服务异常：模拟最多 3 次重试。
  - `503` 服务不可用：模拟暂存待重试。

### 11. 安全收尾与逻辑删除统一（Phase F）
- 报表删除已改为逻辑删除（`is_deleted` / `deleted_at`），不再物理删除。
- 报表查询、审核、统计、导出均默认过滤逻辑删除数据。
- 启动时增加轻量兼容检查，检测到旧结构会自动重建本地演示库。
- 密码修改已改为真实后端接口。
- 登录失败锁定、用户停用/未激活限制在后端统一生效。

## 第三周主要接口

### 认证
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/change-password`

### 调查期管理
- `GET /survey-periods`
- `GET /survey-periods/current`
- `POST /survey-periods`
- `PUT /survey-periods/{period_id}`

### 企业备案
- `GET /filings/me`
- `POST /filings/save`
- `POST /filings/submit`
- `GET /filings`
- `POST /filings/{enterprise_id}/approve`
- `POST /filings/{enterprise_id}/reject`

### 数据填报
- `GET /reports/available-periods`
- `GET /reports/current?period_code=...`
- `GET /reports/me`
- `POST /reports/save`
- `POST /reports/submit`

### 市级审核
- `GET /city/reports`
- `GET /city/reports/{report_id}`
- `POST /city/reports/{report_id}/approve`
- `POST /city/reports/{report_id}/reject`

### 省级审核/管理
- `GET /province/reports`
- `GET /province/reports/{report_id}`
- `POST /province/reports/{report_id}/approve`
- `POST /province/reports/{report_id}/reject`
- `POST /province/reports/{report_id}/modify`
- `POST /province/reports/{report_id}/submit`
- `GET /province/reports/{report_id}/delete-check`
- `DELETE /province/reports/{report_id}`

### 省级汇总/分析/导出
- `GET /province/summary`
- `GET /province/analysis/compare`
- `GET /province/analysis/trend`
- `GET /province/sampling`
- `GET /province/export/query`
- `GET /province/export/xlsx`
- `GET /province/filings/export/xlsx`

### 系统管理
- `GET /system/users`
- `POST /system/users`
- `PUT /system/users/{user_id}`
- `GET /system/users/{user_id}/delete-check`
- `DELETE /system/users/{user_id}`
- `POST /system/users/{user_id}/role-change`
- `GET /system/roles`
- `GET /system/roles/{role_name}/delete-check`
- `GET /system/monitor`
- `GET /system/monitor/snapshots`

### 国家接口演示
- `POST /national/push/preview`
- `GET /national/push/config`
- `POST /national/push/config`
- `POST /national/push`
- `GET /national/push/records`
- `GET /national/push/records/{batch_id}/logs`
- `POST /national/push/records/{batch_id}/retry`

### 日志
- `GET /operation-logs`
- `GET /audit-logs`（兼容）

## 启动方法

### 1) 后端
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端地址：
- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`

### 2) 前端
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

前端地址：
- `http://127.0.0.1:5173`

> 前端默认请求后端 `http://127.0.0.1:8000`。

## 测试账号
- 省级：`province_admin / Passw0rd!`
- 市级：`city_reviewer / Passw0rd!`
- 企业：`enterprise_user / Passw0rd!`

## 桌面端/移动端访问说明
- 桌面端：直接浏览器访问前端地址。
- 移动端：
  - 可使用浏览器开发者工具设备模拟（推荐）。
  - 或手机与电脑同网段，通过电脑 IP + 端口访问前端（需防火墙允许）。
- 移动端关键页面已适配：登录、企业填报、市级审核、省级报表管理。

## 验证方式

### 后端冒烟
```bash
$env:PYTHONPATH='D:\python_work\codex_project'
d:/python_work/codex_project/.venv/Scripts/python.exe scripts/smoke_week2.py
```
期望输出：`SMOKE_OK: week2 closed loop verified`

### 前端构建
```bash
cd frontend
npm run build
```

## 后续可选优化
- 国家失业监测系统正式联调（当前为演示推送）。
- 二进制 Excel 模板导出（当前为通用 xlsx 导出）。
- 前端按路由动态分包降低首包体积。
- 通知回执、催办与超时策略。

## 演示路径建议
1. 企业登录（`enterprise_user / Passw0rd!`）
2. 企业备案（保存草稿 -> 上报）
3. 企业填报（暂存 -> 上报）
4. 市级登录审核（通过/退回）
5. 省级登录审核（通过/退回/修改/上报）
6. 省级汇总分析（汇总/对比/趋势/取样）
7. 通知全生命周期（发布/浏览/已读）
8. 系统管理（用户/角色/监控/日志）
9. 国家接口演示（配置 API Key -> 预览 -> 推送 -> 查看记录/重试）

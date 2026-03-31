# CM_WORK - 第一周基线实现

## 项目简介
本项目是根据需求规格说明书实现的就业调查管理系统第一周版本（P0 核心闭环）。

第一周目标：打通企业备案 + 数据填报的最小可用流程。

## 第一周已实现能力

### 1) 认证与会话
- 企业、市级、省级账号登录
- JWT 鉴权
- 账号启用/禁用状态校验
- 按角色返回工作台入口

### 2) 企业备案
- 企业填写并提交备案信息
- 组织机构代码唯一性校验
- 提交后备案状态流转为：待备案

### 3) 省级备案审批
- 省级查看备案列表与详情
- 审核通过 / 退回
- 退回原因必填
- 审批动作写入审计日志

### 4) 企业数据填报
- 仅已备案企业可填报
- 仅调查期内可填报
- 支持暂存与上报
- 上报后状态流转为：待市审核

### 5) 核心业务校验
- 建档期、调查期就业人数必须为非负整数
- 调查期小于建档期时，减少类型/原因/说明必填
- 减少类型与原因必须匹配
- 选择“其他”时补充说明必填

### 6) RBAC 与数据隔离
- 企业只能操作本企业数据
- 市级/省级按角色访问审核与查询接口

### 7) 审计日志
- 记录备案提交/审批、报表暂存/上报/退回等关键动作
- 日志包含操作人、角色、时间、原因、前后状态与 IP

## 技术栈
- FastAPI
- SQLAlchemy 2.x
- SQLite（默认）
- python-jose（JWT）
- passlib（pbkdf2_sha256）
- Pydantic v2

## 项目结构
```
.
├─ app/
│  ├─ main.py              # API 入口与核心业务逻辑
│  ├─ models.py            # 数据模型
│  ├─ schemas.py           # 请求/响应模型
│  ├─ auth.py              # 认证与令牌
│  ├─ dependencies.py      # 鉴权依赖与角色权限控制
│  ├─ database.py          # 数据库连接与会话
│  └─ config.py            # 配置项（调查期、密钥等）
├─ docs/
│  ├─ week1_project_plan.md
│  ├─ week1_gantt.mmd
│  ├─ week1_run_guide.md
│  └─ change_requests/
│     └─ CR-2026-03-31-week1-baseline.md
├─ requirements.txt
└─ SRS.docx
```

## 运行方式

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 启动服务
```bash
uvicorn app.main:app --reload
```

### 3. 打开接口文档
- Swagger: http://127.0.0.1:8000/docs
- OpenAPI: http://127.0.0.1:8000/openapi.json

## 环境变量
- APP_SECRET_KEY：JWT 密钥（生产环境务必修改）
- DATABASE_URL：数据库连接串（默认 sqlite:///./app.db）
- SURVEY_PERIOD_START：调查期开始日期（默认 2026-03-01）
- SURVEY_PERIOD_END：调查期结束日期（默认 2026-05-31）

## 默认测试账号（启动时自动初始化）
- 省级：province_admin / Passw0rd!
- 市级：city_reviewer / Passw0rd!
- 企业：enterprise_user / Passw0rd!
- 禁用账号：disabled_user / Passw0rd!

## 推荐演示流程
1. 企业登录：POST /auth/login
2. 企业提交备案：POST /filings/submit
3. 省级登录：POST /auth/login
4. 省级审批通过：POST /filings/{enterprise_id}/approve
5. 企业暂存报表：POST /reports/save
6. 企业上报报表：POST /reports/submit
7. 市级退回报表：POST /reports/{report_id}/city-reject
8. 省级查看日志：GET /audit-logs

## 关键文档
- 第一周项目计划：docs/week1_project_plan.md
- 第一周甘特图：docs/week1_gantt.mmd
- 第一周运行说明：docs/week1_run_guide.md
- 第一周变更单：docs/change_requests/CR-2026-03-31-week1-baseline.md

## 说明
本仓库当前是第一周基线版本，后续迭代将在此基础上继续补充市级审核、省级复核、统计报表与导出等能力。

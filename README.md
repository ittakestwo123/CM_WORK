# CM_WORK - 第二周迭代版本

## 项目简介
本项目是云南省企业就业失业数据采集系统的课程迭代实现。
当前版本为第二周，重点完成：
- 调查期管理（支持 1/2/3 月半月报，其他月份月报）
- 企业按调查期填报
- 市级审核 + 省级审核 + 省级上报的完整状态流转
- 审计日志与报表版本留痕

## 第二周核心能力

### 1) 认证与权限
- 企业、市级、省级账号登录
- JWT 鉴权
- RBAC 角色控制
- 市级按 city_code 执行辖区数据隔离

### 2) 调查期管理
- 省级可新增、修改调查期
- 支持字段：period_code、period_name、start_time、end_time、period_type、month_no、half_no、status
- 规则校验：
  - 1/2/3 月仅 HALF_MONTH（half_no=1/2）
  - 4-12 月仅 MONTH（half_no 为空）
  - 每企业填报以 period_code 为准

### 3) 企业备案
- 企业提交备案信息
- 组织机构代码唯一校验
- 省级审批通过/退回（退回原因必填）

### 4) 企业数据填报
- 仅已备案企业可填报
- 仅启用且当前时间处于调查期内可填报
- 支持暂存、上报
- 每企业每调查期唯一报表
- 保留人数与减员原因校验

### 5) 审核流转闭环
- 市级：待市审核 -> 待省审核 / 市退回
- 省级：待省审核 -> 省审核通过 / 省退回 -> 省已上报

### 6) 审计日志与留痕
- 记录操作人、角色、时间、动作、对象、原因、前后状态、IP
- 报表每次关键变更保存版本快照（不直接覆盖历史）

## 技术栈
- FastAPI
- SQLAlchemy 2.x
- SQLite（默认）
- python-jose（JWT）
- passlib（pbkdf2_sha256）
- Pydantic v2

## 项目结构
```text
.
├─ app/
│  ├─ main.py
│  ├─ models.py
│  ├─ schemas.py
│  ├─ auth.py
│  ├─ dependencies.py
│  ├─ database.py
│  └─ config.py
├─ docs/
│  ├─ week1_project_plan.md
│  ├─ week1_gantt.mmd
│  ├─ week1_run_guide.md
│  ├─ week2_project_plan.md
│  ├─ week2_run_guide.md
│  └─ change_requests/
│     ├─ CR-2026-03-31-week1-baseline.md
│     └─ CR-2026-04-07-week2-period-change.md
├─ scripts/
│  └─ smoke_week2.py
├─ requirements.txt
└─ 云南省企业就业失业数据采集系统工作说明书.doc
```

## 快速启动

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

## 默认账号
- 省级：province_admin / Passw0rd!
- 市级：city_reviewer / Passw0rd!
- 企业：enterprise_user / Passw0rd!

## 第二周关键接口
- 调查期管理：
  - GET /survey-periods
  - GET /survey-periods/current
  - POST /survey-periods
  - PUT /survey-periods/{period_id}
- 企业填报：
  - GET /reports/me
  - POST /reports/save
  - POST /reports/submit
- 市级审核：
  - GET /city/reports
  - GET /city/reports/{report_id}
  - POST /city/reports/{report_id}/approve
  - POST /city/reports/{report_id}/reject
- 省级审核：
  - GET /province/reports
  - GET /province/reports/{report_id}
  - POST /province/reports/{report_id}/approve
  - POST /province/reports/{report_id}/reject
  - POST /province/reports/{report_id}/submit
- 留痕与日志：
  - GET /reports/{report_id}/versions
  - GET /audit-logs

## 自动化冒烟
```bash
$env:PYTHONPATH='.'
.venv\Scripts\python.exe scripts\smoke_week2.py
```
成功输出：
SMOKE_OK: week2 closed loop verified

## 说明
- 第一周文档保留用于迭代历史对比。
- 第二周文档用于当前提交。

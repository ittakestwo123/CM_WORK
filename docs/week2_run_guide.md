# 第二周版本运行说明

## 1. 安装依赖
```bash
pip install -r requirements.txt
```

## 2. 启动服务
```bash
uvicorn app.main:app --reload
```

启动后访问：
- Swagger: http://127.0.0.1:8000/docs
- OpenAPI: http://127.0.0.1:8000/openapi.json

## 3. 默认账号
- 省级：province_admin / Passw0rd!
- 市级：city_reviewer / Passw0rd!
- 企业：enterprise_user / Passw0rd!

## 4. 第二周闭环演示顺序
1. 企业登录：POST /auth/login
2. 企业提交备案：POST /filings/submit
3. 省级审批备案：POST /filings/{enterprise_id}/approve
4. 查询当前调查期：GET /survey-periods/current
5. 企业暂存报表：POST /reports/save
6. 企业上报报表：POST /reports/submit
7. 市级查看本辖区待审：GET /city/reports
8. 市级审核通过：POST /city/reports/{report_id}/approve
9. 省级查看待省审：GET /province/reports
10. 省级审核通过：POST /province/reports/{report_id}/approve
11. 省级执行上报：POST /province/reports/{report_id}/submit
12. 查看审计日志：GET /audit-logs
13. 查看报表版本：GET /reports/{report_id}/versions

## 5. 调查期规则
- 1/2/3 月：仅允许 HALF_MONTH，且 half_no 为 1 或 2
- 4-12 月：仅允许 MONTH，且 half_no 为空
- 企业填报必须满足：
  - 企业已备案通过
  - 调查期状态为启用
  - 当前时间在调查期起止时间内

## 6. 自动化联调
```bash
$env:PYTHONPATH='.'
.venv\Scripts\python.exe scripts\smoke_week2.py
```
成功输出：
SMOKE_OK: week2 closed loop verified

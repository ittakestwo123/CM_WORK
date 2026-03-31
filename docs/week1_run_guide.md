# 第一周版本运行说明

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

## 3. 默认账号（启动时自动初始化）
- 省级：`province_admin` / `Passw0rd!`
- 市级：`city_reviewer` / `Passw0rd!`
- 企业：`enterprise_user` / `Passw0rd!`
- 禁用账号：`disabled_user` / `Passw0rd!`

## 4. 第一周闭环接口顺序（建议演示）
1. `POST /auth/login`（企业登录）
2. `POST /filings/submit`（企业提交备案）
3. `POST /auth/login`（省级登录）
4. `POST /filings/{enterprise_id}/approve`（省级审批通过）
5. `POST /reports/save`（企业暂存填报）
6. `POST /reports/submit`（企业上报，状态变更为待市审核）
7. `POST /auth/login`（市级登录）
8. `POST /reports/{report_id}/city-reject`（市级退回）
9. `GET /audit-logs`（省级查看审计日志）

## 5. 关键业务规则
- 企业仅能操作自身备案和填报。
- 企业填报前置条件：备案状态必须为“已备案”，且当前日期在调查期内。
- 报表提交校验：
  - 建档期/调查期就业人数必须为非负整数。
  - 若调查期小于建档期，必须填写减少类型、主要原因、主要原因说明。
  - 减少类型与主要原因必须匹配。
  - 若类型或原因为“其他”，必须填写补充说明。

## 6. 数据文件
- 默认数据库：`app.db`（项目根目录）
- 冒烟测试临时数据库（如执行测试脚本）：`test_week1.db`

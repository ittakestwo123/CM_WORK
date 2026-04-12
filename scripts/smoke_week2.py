from __future__ import annotations

import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_week2.db"
db_file = Path("test_week2.db")
if db_file.exists():
    db_file.unlink()

from fastapi.testclient import TestClient

from app.main import app


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


with TestClient(app) as client:
    def login(username: str, password: str) -> str:
        resp = client.post("/auth/login", json={"username": username, "password": password})
        assert resp.status_code == 200, resp.text
        return resp.json()["access_token"]

    province_token = login("province_admin", "Passw0rd!")
    enterprise_token = login("enterprise_user", "Passw0rd!")
    city_token = login("city_reviewer", "Passw0rd!")

    # 1) Use current active period to satisfy time-window constraints.
    resp = client.get("/survey-periods/current", headers=auth_headers(enterprise_token))
    assert resp.status_code == 200, resp.text
    current_periods = resp.json()
    assert len(current_periods) >= 1, "当前无可用调查期"
    period_code = current_periods[0]["period_code"]

    # 2) Enterprise filing submit -> province approve
    filing_payload = {
        "organization_code": "ORG260401",
        "name": "云南测试企业",
        "nature": "有限责任公司",
        "industry": "制造业",
        "business_scope": "生产与销售",
        "contact_person": "张三",
        "contact_address": "昆明市/五华区",
        "postal_code": "650000",
        "phone": "0871-1234567",
        "fax": "0871-7654321",
        "email": "demo@example.com",
    }
    resp = client.post("/filings/submit", json=filing_payload, headers=auth_headers(enterprise_token))
    assert resp.status_code == 200, resp.text
    enterprise_id = resp.json()["id"]

    resp = client.post(f"/filings/{enterprise_id}/approve", headers=auth_headers(province_token))
    assert resp.status_code == 200, resp.text

    # 3) Enterprise save + submit by period_code
    report_payload = {
        "period_code": period_code,
        "base_employment": 100,
        "survey_employment": 95,
        "decrease_type": "生产经营调整",
        "decrease_reason": "订单减少",
        "decrease_reason_detail": "季节性订单下降",
        "other_note": None,
    }
    resp = client.post("/reports/save", json=report_payload, headers=auth_headers(enterprise_token))
    assert resp.status_code == 200, resp.text
    report_id = resp.json()["id"]

    resp = client.post("/reports/submit", json=report_payload, headers=auth_headers(enterprise_token))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "待市审", resp.text

    # 4) City approve
    resp = client.post(f"/city/reports/{report_id}/approve", headers=auth_headers(city_token))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "待省审", resp.text

    # 5) Province approve + submit
    resp = client.post(f"/province/reports/{report_id}/approve", headers=auth_headers(province_token))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "省审通过", resp.text

    resp = client.post(f"/province/reports/{report_id}/submit", headers=auth_headers(province_token))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "已上报部委", resp.text

    # 6) Check versions + logs
    resp = client.get(f"/reports/{report_id}/versions", headers=auth_headers(province_token))
    assert resp.status_code == 200, resp.text
    assert len(resp.json()) >= 4, resp.text

    resp = client.get("/audit-logs", headers=auth_headers(province_token))
    assert resp.status_code == 200, resp.text
    assert len(resp.json()) > 0, resp.text

    print("SMOKE_OK: week2 closed loop verified")

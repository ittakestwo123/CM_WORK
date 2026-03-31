from __future__ import annotations

from datetime import date, datetime
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import config
from .auth import authenticate_user, create_access_token, hash_password
from .database import Base, engine, get_db
from .dependencies import get_current_user, require_roles
from .models import AuditLog, Enterprise, EmploymentReport, FilingStatus, ReportStatus, User, UserRole
from .schemas import (
    AuditLogOut,
    FilingOut,
    FilingPayload,
    FilingReviewIn,
    LoginIn,
    ReportOut,
    ReportPayload,
    ReportReviewIn,
    TokenOut,
    UserOut,
)


app = FastAPI(title="Employment Survey API", version="0.1.0")

DASHBOARD_BY_ROLE: dict[UserRole, str] = {
    UserRole.ENTERPRISE: "/dashboard/enterprise",
    UserRole.CITY: "/dashboard/city",
    UserRole.PROVINCE: "/dashboard/province",
}

DECREASE_REASON_MAP: dict[str, set[str]] = {
    "生产经营调整": {"订单减少", "生产线调整", "其他"},
    "组织结构优化": {"组织精简", "岗位合并", "其他"},
    "员工主动流动": {"个人原因离职", "退休", "其他"},
    "其他": {"其他"},
}

EDITABLE_REPORT_STATUSES = {
    ReportStatus.DRAFT,
    ReportStatus.CITY_REJECTED,
    ReportStatus.PROVINCE_REJECTED,
}


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        _seed_data(db)


def _seed_data(db: Session) -> None:
    province_user = db.scalar(select(User).where(User.username == "province_admin"))
    if province_user is None:
        db.add(
            User(
                username="province_admin",
                password_hash=hash_password("Passw0rd!"),
                role=UserRole.PROVINCE,
                is_active=True,
            )
        )
    else:
        province_user.password_hash = hash_password("Passw0rd!")
        province_user.role = UserRole.PROVINCE
        province_user.is_active = True

    city_user = db.scalar(select(User).where(User.username == "city_reviewer"))
    if city_user is None:
        db.add(
            User(
                username="city_reviewer",
                password_hash=hash_password("Passw0rd!"),
                role=UserRole.CITY,
                is_active=True,
            )
        )
    else:
        city_user.password_hash = hash_password("Passw0rd!")
        city_user.role = UserRole.CITY
        city_user.is_active = True

    enterprise_user = db.scalar(select(User).where(User.username == "enterprise_user"))
    if enterprise_user is None:
        enterprise = Enterprise(name="示例企业", filing_status=FilingStatus.NOT_SUBMITTED)
        db.add(enterprise)
        db.flush()

        db.add(
            User(
                username="enterprise_user",
                password_hash=hash_password("Passw0rd!"),
                role=UserRole.ENTERPRISE,
                is_active=True,
                enterprise_id=enterprise.id,
            )
        )
    else:
        enterprise_user.password_hash = hash_password("Passw0rd!")
        enterprise_user.role = UserRole.ENTERPRISE
        enterprise_user.is_active = True
        if enterprise_user.enterprise_id is None:
            enterprise = Enterprise(name="示例企业", filing_status=FilingStatus.NOT_SUBMITTED)
            db.add(enterprise)
            db.flush()
            enterprise_user.enterprise_id = enterprise.id

    disabled_user = db.scalar(select(User).where(User.username == "disabled_user"))
    if disabled_user is None:
        db.add(
            User(
                username="disabled_user",
                password_hash=hash_password("Passw0rd!"),
                role=UserRole.ENTERPRISE,
                is_active=False,
            )
        )
    else:
        disabled_user.password_hash = hash_password("Passw0rd!")
        disabled_user.role = UserRole.ENTERPRISE
        disabled_user.is_active = False

    db.commit()


def _enterprise_snapshot(item: Enterprise) -> dict[str, Any]:
    return {
        "id": item.id,
        "organization_code": item.organization_code,
        "name": item.name,
        "nature": item.nature,
        "industry": item.industry,
        "business_scope": item.business_scope,
        "contact_person": item.contact_person,
        "contact_address": item.contact_address,
        "postal_code": item.postal_code,
        "phone": item.phone,
        "fax": item.fax,
        "email": item.email,
        "filing_status": item.filing_status.value,
        "filing_reject_reason": item.filing_reject_reason,
    }


def _report_snapshot(item: EmploymentReport) -> dict[str, Any]:
    return {
        "id": item.id,
        "enterprise_id": item.enterprise_id,
        "survey_year": item.survey_year,
        "base_employment": item.base_employment,
        "survey_employment": item.survey_employment,
        "decrease_type": item.decrease_type,
        "decrease_reason": item.decrease_reason,
        "decrease_reason_detail": item.decrease_reason_detail,
        "other_note": item.other_note,
        "status": item.status.value,
    }


def _write_audit_log(
    db: Session,
    request: Request,
    operator: User,
    action_type: str,
    target_type: str,
    target_id: str,
    reason: str | None,
    before_state: dict[str, Any] | None,
    after_state: dict[str, Any] | None,
) -> None:
    ip_address = request.client.host if request.client else None
    log = AuditLog(
        operator_id=operator.id,
        operator_role=operator.role.value,
        action_type=action_type,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
    )
    db.add(log)


def _get_or_create_enterprise(db: Session, user: User) -> Enterprise:
    enterprise = db.get(Enterprise, user.enterprise_id) if user.enterprise_id else None
    if enterprise is not None:
        return enterprise

    enterprise = Enterprise(created_by_user_id=user.id, filing_status=FilingStatus.NOT_SUBMITTED)
    db.add(enterprise)
    db.flush()

    user.enterprise_id = enterprise.id
    db.flush()
    return enterprise


def _get_report(db: Session, enterprise_id: int, survey_year: int) -> EmploymentReport | None:
    stmt = select(EmploymentReport).where(
        EmploymentReport.enterprise_id == enterprise_id,
        EmploymentReport.survey_year == survey_year,
    )
    return db.scalar(stmt)


def _check_enterprise_can_report(enterprise: Enterprise) -> None:
    if enterprise.filing_status != FilingStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="企业未备案通过，不能填报")

    if not config.in_survey_period(date.today()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前不在调查期内，不能填报")


def _validate_submission(payload: ReportPayload) -> None:
    if payload.survey_employment >= payload.base_employment:
        return

    if not payload.decrease_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="就业人数减少时必须填写减少类型")
    if not payload.decrease_reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="就业人数减少时必须填写主要原因")
    if not payload.decrease_reason_detail:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="就业人数减少时必须填写主要原因说明")

    valid_reasons = DECREASE_REASON_MAP.get(payload.decrease_type)
    if valid_reasons is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="减少类型不在允许范围内")

    if payload.decrease_reason not in valid_reasons:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="减少类型与主要原因不匹配")

    if payload.decrease_type == "其他" or payload.decrease_reason == "其他":
        if not payload.other_note:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="选择其他时必须填写补充说明")


def _upsert_report_for_enterprise(
    db: Session,
    enterprise: Enterprise,
    payload: ReportPayload,
) -> tuple[EmploymentReport, dict[str, Any] | None]:
    report = _get_report(db, enterprise.id, payload.survey_year)

    before_state: dict[str, Any] | None = None
    if report is None:
        report = EmploymentReport(enterprise_id=enterprise.id, survey_year=payload.survey_year)
        db.add(report)
    else:
        if report.status not in EDITABLE_REPORT_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前报表状态不允许修改")
        before_state = _report_snapshot(report)

    report.base_employment = payload.base_employment
    report.survey_employment = payload.survey_employment
    report.decrease_type = payload.decrease_type
    report.decrease_reason = payload.decrease_reason
    report.decrease_reason_detail = payload.decrease_reason_detail
    report.other_note = payload.other_note

    if payload.survey_employment >= payload.base_employment:
        report.decrease_type = None
        report.decrease_reason = None
        report.decrease_reason_detail = None
        report.other_note = None

    return report, before_state


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已禁用")

    access_token = create_access_token(user)
    return TokenOut(
        access_token=access_token,
        role=user.role,
        dashboard=DASHBOARD_BY_ROLE[user.role],
    )


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return current_user


@app.get("/filings/me", response_model=FilingOut)
def get_my_filing(
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> FilingOut:
    enterprise = db.get(Enterprise, current_user.enterprise_id) if current_user.enterprise_id else None
    if enterprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="未找到企业备案信息")
    return enterprise


@app.post("/filings/submit", response_model=FilingOut)
def submit_filing(
    payload: FilingPayload,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> FilingOut:
    enterprise = _get_or_create_enterprise(db, current_user)

    if (
        enterprise.filing_status == FilingStatus.APPROVED
        and enterprise.organization_code
        and enterprise.organization_code != payload.organization_code
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="已备案企业不可修改组织机构代码")

    duplicate = db.scalar(
        select(Enterprise).where(
            Enterprise.organization_code == payload.organization_code,
            Enterprise.id != enterprise.id,
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="组织机构代码已存在")

    before_state = _enterprise_snapshot(enterprise)

    enterprise.organization_code = payload.organization_code
    enterprise.name = payload.name
    enterprise.nature = payload.nature
    enterprise.industry = payload.industry
    enterprise.business_scope = payload.business_scope
    enterprise.contact_person = payload.contact_person
    enterprise.contact_address = payload.contact_address
    enterprise.postal_code = payload.postal_code
    enterprise.phone = payload.phone
    enterprise.fax = payload.fax
    enterprise.email = payload.email

    enterprise.filing_status = FilingStatus.PENDING
    enterprise.filing_reject_reason = None
    enterprise.filing_submit_time = datetime.utcnow()

    db.flush()
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="filing_submit",
        target_type="enterprise_filing",
        target_id=str(enterprise.id),
        reason=None,
        before_state=before_state,
        after_state=_enterprise_snapshot(enterprise),
    )

    db.commit()
    db.refresh(enterprise)
    return enterprise


@app.get("/filings", response_model=list[FilingOut])
def list_filings(
    filing_status_value: FilingStatus | None = None,
    _: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> list[FilingOut]:
    stmt = select(Enterprise).order_by(Enterprise.updated_at.desc())
    if filing_status_value is not None:
        stmt = stmt.where(Enterprise.filing_status == filing_status_value)
    return list(db.scalars(stmt).all())


@app.get("/filings/{enterprise_id}", response_model=FilingOut)
def filing_detail(
    enterprise_id: int,
    _: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> FilingOut:
    enterprise = db.get(Enterprise, enterprise_id)
    if enterprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="备案信息不存在")
    return enterprise


@app.post("/filings/{enterprise_id}/approve", response_model=FilingOut)
def approve_filing(
    enterprise_id: int,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> FilingOut:
    enterprise = db.get(Enterprise, enterprise_id)
    if enterprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="备案信息不存在")
    if enterprise.filing_status != FilingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅待备案状态可审批通过")

    before_state = _enterprise_snapshot(enterprise)

    enterprise.filing_status = FilingStatus.APPROVED
    enterprise.filing_reject_reason = None
    enterprise.filing_review_time = datetime.utcnow()

    db.flush()
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="filing_approve",
        target_type="enterprise_filing",
        target_id=str(enterprise.id),
        reason=None,
        before_state=before_state,
        after_state=_enterprise_snapshot(enterprise),
    )

    db.commit()
    db.refresh(enterprise)
    return enterprise


@app.post("/filings/{enterprise_id}/reject", response_model=FilingOut)
def reject_filing(
    enterprise_id: int,
    payload: FilingReviewIn,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> FilingOut:
    enterprise = db.get(Enterprise, enterprise_id)
    if enterprise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="备案信息不存在")
    if enterprise.filing_status != FilingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅待备案状态可退回")

    reason = (payload.reason or "").strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="退回必须填写原因")

    before_state = _enterprise_snapshot(enterprise)

    enterprise.filing_status = FilingStatus.REJECTED
    enterprise.filing_reject_reason = reason
    enterprise.filing_review_time = datetime.utcnow()

    db.flush()
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="filing_reject",
        target_type="enterprise_filing",
        target_id=str(enterprise.id),
        reason=reason,
        before_state=before_state,
        after_state=_enterprise_snapshot(enterprise),
    )

    db.commit()
    db.refresh(enterprise)
    return enterprise


@app.get("/reports/me", response_model=list[ReportOut])
def my_reports(
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> list[ReportOut]:
    enterprise = db.get(Enterprise, current_user.enterprise_id) if current_user.enterprise_id else None
    if enterprise is None:
        return []

    stmt = (
        select(EmploymentReport)
        .where(EmploymentReport.enterprise_id == enterprise.id)
        .order_by(EmploymentReport.survey_year.desc())
    )
    return list(db.scalars(stmt).all())


@app.post("/reports/save", response_model=ReportOut)
def save_report(
    payload: ReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    enterprise = _get_or_create_enterprise(db, current_user)
    _check_enterprise_can_report(enterprise)

    report, before_state = _upsert_report_for_enterprise(db, enterprise, payload)
    report.status = ReportStatus.DRAFT
    report.updated_by_user_id = current_user.id

    db.flush()
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_save",
        target_type="employment_report",
        target_id=f"{report.enterprise_id}-{report.survey_year}",
        reason=None,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    db.refresh(report)
    return report


@app.post("/reports/submit", response_model=ReportOut)
def submit_report(
    payload: ReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    enterprise = _get_or_create_enterprise(db, current_user)
    _check_enterprise_can_report(enterprise)
    _validate_submission(payload)

    report, before_state = _upsert_report_for_enterprise(db, enterprise, payload)
    report.status = ReportStatus.PENDING_CITY_REVIEW
    report.updated_by_user_id = current_user.id
    report.last_submitted_at = datetime.utcnow()

    db.flush()
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_submit",
        target_type="employment_report",
        target_id=f"{report.enterprise_id}-{report.survey_year}",
        reason=None,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    db.refresh(report)
    return report


@app.get("/reports", response_model=list[ReportOut])
def list_reports(
    report_status: ReportStatus | None = None,
    current_user: User = Depends(require_roles(UserRole.CITY, UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> list[ReportOut]:
    stmt = select(EmploymentReport).order_by(EmploymentReport.updated_at.desc())
    if current_user.role == UserRole.CITY and report_status is None:
        stmt = stmt.where(EmploymentReport.status == ReportStatus.PENDING_CITY_REVIEW)
    elif report_status is not None:
        stmt = stmt.where(EmploymentReport.status == report_status)

    return list(db.scalars(stmt).all())


@app.post("/reports/{report_id}/city-reject", response_model=ReportOut)
def city_reject_report(
    report_id: int,
    payload: ReportReviewIn,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.CITY, UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = db.get(EmploymentReport, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报表不存在")
    if report.status != ReportStatus.PENDING_CITY_REVIEW:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅待市审核报表可退回")

    before_state = _report_snapshot(report)
    report.status = ReportStatus.CITY_REJECTED
    report.updated_by_user_id = current_user.id

    db.flush()
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_city_reject",
        target_type="employment_report",
        target_id=f"{report.enterprise_id}-{report.survey_year}",
        reason=payload.reason,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    db.refresh(report)
    return report


@app.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(
    action_type: str | None = None,
    _: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> list[AuditLogOut]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    if action_type:
        stmt = stmt.where(AuditLog.action_type == action_type)
    stmt = stmt.limit(200)
    return list(db.scalars(stmt).all())

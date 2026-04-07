from __future__ import annotations

from calendar import monthrange
from datetime import datetime
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, joinedload

from .auth import authenticate_user, create_access_token, hash_password
from .database import Base, engine, get_db
from .dependencies import get_current_user, require_roles
from .models import (
    AuditLog,
    EmploymentReport,
    Enterprise,
    FilingStatus,
    ReportStatus,
    ReportVersion,
    SurveyPeriod,
    SurveyPeriodStatus,
    SurveyPeriodType,
    User,
    UserRole,
)
from .schemas import (
    AuditLogOut,
    FilingOut,
    FilingPayload,
    FilingReviewIn,
    LoginIn,
    ReportOut,
    ReportPayload,
    ReportReviewIn,
    ReportVersionOut,
    SurveyPeriodOut,
    SurveyPeriodUpsertIn,
    TokenOut,
    UserOut,
)


app = FastAPI(title="Employment Survey API", version="0.2.0")

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
        try:
            _seed_data(db)
        except OperationalError:
            # Week2 introduces schema changes; recreate local DB when old schema exists.
            db.rollback()
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
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
                city_code=None,
            )
        )
    else:
        province_user.password_hash = hash_password("Passw0rd!")
        province_user.role = UserRole.PROVINCE
        province_user.is_active = True
        province_user.city_code = None

    city_user = db.scalar(select(User).where(User.username == "city_reviewer"))
    if city_user is None:
        db.add(
            User(
                username="city_reviewer",
                password_hash=hash_password("Passw0rd!"),
                role=UserRole.CITY,
                is_active=True,
                city_code="530100",
            )
        )
    else:
        city_user.password_hash = hash_password("Passw0rd!")
        city_user.role = UserRole.CITY
        city_user.is_active = True
        city_user.city_code = "530100"

    enterprise_user = db.scalar(select(User).where(User.username == "enterprise_user"))
    if enterprise_user is None:
        enterprise = Enterprise(
            name="示例企业",
            city_code="530100",
            city_name="昆明市",
            filing_status=FilingStatus.NOT_SUBMITTED,
        )
        db.add(enterprise)
        db.flush()

        db.add(
            User(
                username="enterprise_user",
                password_hash=hash_password("Passw0rd!"),
                role=UserRole.ENTERPRISE,
                is_active=True,
                enterprise_id=enterprise.id,
                city_code=enterprise.city_code,
            )
        )
    else:
        enterprise_user.password_hash = hash_password("Passw0rd!")
        enterprise_user.role = UserRole.ENTERPRISE
        enterprise_user.is_active = True
        if enterprise_user.enterprise_id is None:
            enterprise = Enterprise(
                name="示例企业",
                city_code=enterprise_user.city_code or "530100",
                city_name="昆明市",
                filing_status=FilingStatus.NOT_SUBMITTED,
            )
            db.add(enterprise)
            db.flush()
            enterprise_user.enterprise_id = enterprise.id
        else:
            enterprise = db.get(Enterprise, enterprise_user.enterprise_id)
            if enterprise is not None:
                if not enterprise.city_code:
                    enterprise.city_code = enterprise_user.city_code or "530100"
                if not enterprise.city_name:
                    enterprise.city_name = "昆明市"

    disabled_user = db.scalar(select(User).where(User.username == "disabled_user"))
    if disabled_user is None:
        db.add(
            User(
                username="disabled_user",
                password_hash=hash_password("Passw0rd!"),
                role=UserRole.ENTERPRISE,
                is_active=False,
                city_code="530100",
            )
        )
    else:
        disabled_user.password_hash = hash_password("Passw0rd!")
        disabled_user.role = UserRole.ENTERPRISE
        disabled_user.is_active = False
        disabled_user.city_code = "530100"

    db.flush()
    _seed_survey_periods(db)
    db.commit()


def _seed_survey_periods(db: Session) -> None:
    if db.scalar(select(SurveyPeriod.id).limit(1)) is not None:
        return

    year = datetime.utcnow().year
    defaults: list[SurveyPeriod] = []

    for month_no in (1, 2, 3):
        defaults.append(
            SurveyPeriod(
                period_code=f"{year}{month_no:02d}H1",
                period_name=f"{year}年{month_no}月上半月",
                start_time=datetime(year, month_no, 1, 0, 0, 0),
                end_time=datetime(year, month_no, 15, 23, 59, 59),
                period_type=SurveyPeriodType.HALF_MONTH,
                month_no=month_no,
                half_no=1,
                status=SurveyPeriodStatus.ENABLED,
            )
        )
        end_day = monthrange(year, month_no)[1]
        defaults.append(
            SurveyPeriod(
                period_code=f"{year}{month_no:02d}H2",
                period_name=f"{year}年{month_no}月下半月",
                start_time=datetime(year, month_no, 16, 0, 0, 0),
                end_time=datetime(year, month_no, end_day, 23, 59, 59),
                period_type=SurveyPeriodType.HALF_MONTH,
                month_no=month_no,
                half_no=2,
                status=SurveyPeriodStatus.ENABLED,
            )
        )

    current_month = datetime.utcnow().month
    if current_month in {1, 2, 3}:
        current_month = 4
    end_day = monthrange(year, current_month)[1]
    defaults.append(
        SurveyPeriod(
            period_code=f"{year}{current_month:02d}",
            period_name=f"{year}年{current_month}月",
            start_time=datetime(year, current_month, 1, 0, 0, 0),
            end_time=datetime(year, current_month, end_day, 23, 59, 59),
            period_type=SurveyPeriodType.MONTH,
            month_no=current_month,
            half_no=None,
            status=SurveyPeriodStatus.ENABLED,
        )
    )

    for period in defaults:
        db.add(period)


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
        "city_code": item.city_code,
        "city_name": item.city_name,
        "filing_status": item.filing_status.value,
        "filing_reject_reason": item.filing_reject_reason,
    }


def _report_snapshot(item: EmploymentReport) -> dict[str, Any]:
    return {
        "id": item.id,
        "enterprise_id": item.enterprise_id,
        "survey_period_id": item.survey_period_id,
        "period_code": item.period_code,
        "base_employment": item.base_employment,
        "survey_employment": item.survey_employment,
        "decrease_type": item.decrease_type,
        "decrease_reason": item.decrease_reason,
        "decrease_reason_detail": item.decrease_reason_detail,
        "other_note": item.other_note,
        "decrease_count": item.decrease_count,
        "status": item.status.value,
        "last_submitted_at": item.last_submitted_at.isoformat() if item.last_submitted_at else None,
    }


def _report_to_out(item: EmploymentReport) -> ReportOut:
    period = item.survey_period
    return ReportOut(
        id=item.id,
        enterprise_id=item.enterprise_id,
        survey_period_id=item.survey_period_id,
        period_code=item.period_code,
        period_name=period.period_name if period else None,
        period_type=period.period_type if period else None,
        base_employment=item.base_employment,
        survey_employment=item.survey_employment,
        decrease_type=item.decrease_type,
        decrease_reason=item.decrease_reason,
        decrease_reason_detail=item.decrease_reason_detail,
        other_note=item.other_note,
        decrease_count=item.decrease_count,
        status=item.status,
        last_submitted_at=item.last_submitted_at,
    )


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


def _save_report_version(db: Session, report: EmploymentReport, operator: User, action_type: str) -> None:
    db.flush()
    current_no = db.scalar(
        select(func.max(ReportVersion.version_no)).where(ReportVersion.report_id == report.id)
    )
    next_no = (current_no or 0) + 1
    db.add(
        ReportVersion(
            report_id=report.id,
            version_no=next_no,
            action_type=action_type,
            operator_id=operator.id,
            snapshot=_report_snapshot(report),
        )
    )


def _get_or_create_enterprise(db: Session, user: User) -> Enterprise:
    enterprise = db.get(Enterprise, user.enterprise_id) if user.enterprise_id else None
    if enterprise is not None:
        return enterprise

    enterprise = Enterprise(
        created_by_user_id=user.id,
        filing_status=FilingStatus.NOT_SUBMITTED,
        city_code=user.city_code or "530100",
        city_name="昆明市",
    )
    db.add(enterprise)
    db.flush()

    user.enterprise_id = enterprise.id
    db.flush()
    return enterprise


def _get_period_by_code(db: Session, period_code: str) -> SurveyPeriod:
    period = db.scalar(select(SurveyPeriod).where(SurveyPeriod.period_code == period_code))
    if period is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="调查期不存在")
    return period


def _get_report_with_relations(db: Session, report_id: int) -> EmploymentReport:
    stmt = (
        select(EmploymentReport)
        .options(joinedload(EmploymentReport.survey_period), joinedload(EmploymentReport.enterprise))
        .where(EmploymentReport.id == report_id)
    )
    report = db.scalar(stmt)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报表不存在")
    return report


def _check_enterprise_can_report(enterprise: Enterprise, period: SurveyPeriod) -> None:
    if enterprise.filing_status != FilingStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="企业未备案通过，不能填报")

    if period.status != SurveyPeriodStatus.ENABLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="调查期未启用，不能填报")

    now = datetime.utcnow()
    if not (period.start_time <= now <= period.end_time):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前不在所选调查期内，不能填报")


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


def _validate_period_payload(
    db: Session,
    payload: SurveyPeriodUpsertIn,
    exclude_period_id: int | None = None,
) -> None:
    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="调查期开始时间必须早于结束时间")

    if payload.start_time.year != payload.end_time.year or payload.start_time.month != payload.end_time.month:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="调查期必须位于同一年同一月份")

    if payload.start_time.month != payload.month_no:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="month_no 与开始时间月份不一致")

    if payload.month_no in {1, 2, 3}:
        if payload.period_type != SurveyPeriodType.HALF_MONTH:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="1/2/3月必须使用半月调查期")
        if payload.half_no not in {1, 2}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="1/2/3月必须指定 half_no 为 1 或 2")
    else:
        if payload.period_type != SurveyPeriodType.MONTH:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="4-12月仅允许创建月度调查期")
        if payload.half_no is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="月度调查期 half_no 必须为空")

    duplicate_code_stmt = select(SurveyPeriod).where(SurveyPeriod.period_code == payload.period_code)
    duplicate_code = db.scalar(duplicate_code_stmt)
    if duplicate_code is not None and duplicate_code.id != exclude_period_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="period_code 已存在")

    all_periods = list(db.scalars(select(SurveyPeriod)).all())
    year_no = payload.start_time.year
    same_month_periods = [
        p
        for p in all_periods
        if p.id != exclude_period_id and p.start_time.year == year_no and p.month_no == payload.month_no
    ]

    if payload.month_no in {1, 2, 3}:
        if len(same_month_periods) >= 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="1/2/3月最多允许两个调查期")
        if any(p.half_no == payload.half_no for p in same_month_periods):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该半月调查期已存在")
    else:
        if same_month_periods:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="4-12月每月仅允许一个调查期")

    for period in same_month_periods:
        overlaps = payload.start_time <= period.end_time and payload.end_time >= period.start_time
        if overlaps:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="调查期时间区间与现有记录重叠")


def _upsert_report_for_enterprise(
    db: Session,
    enterprise: Enterprise,
    payload: ReportPayload,
) -> tuple[EmploymentReport, dict[str, Any] | None]:
    period = _get_period_by_code(db, payload.period_code)
    _check_enterprise_can_report(enterprise, period)

    stmt = select(EmploymentReport).where(
        EmploymentReport.enterprise_id == enterprise.id,
        EmploymentReport.survey_period_id == period.id,
    )
    report = db.scalar(stmt)

    before_state: dict[str, Any] | None = None
    if report is None:
        report = EmploymentReport(
            enterprise_id=enterprise.id,
            survey_period_id=period.id,
            period_code=period.period_code,
        )
        db.add(report)
    else:
        if report.status not in EDITABLE_REPORT_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前报表状态不允许修改")
        before_state = _report_snapshot(report)

    report.period_code = period.period_code
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


def _assert_city_scope(current_user: User, report: EmploymentReport) -> None:
    if not current_user.city_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前市级账号未绑定辖区")

    if report.enterprise is None or report.enterprise.city_code != current_user.city_code:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅可操作本辖区企业报表")


def _list_city_reports(db: Session, current_user: User, status_filter: ReportStatus | None) -> list[ReportOut]:
    if not current_user.city_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前市级账号未绑定辖区")

    effective_status = status_filter or ReportStatus.PENDING_CITY_REVIEW
    stmt = (
        select(EmploymentReport)
        .join(EmploymentReport.enterprise)
        .options(joinedload(EmploymentReport.enterprise), joinedload(EmploymentReport.survey_period))
        .where(
            Enterprise.city_code == current_user.city_code,
            EmploymentReport.status == effective_status,
        )
        .order_by(EmploymentReport.updated_at.desc())
    )
    reports = list(db.scalars(stmt).all())
    return [_report_to_out(item) for item in reports]


def _list_province_reports(db: Session, status_filter: ReportStatus | None) -> list[ReportOut]:
    effective_status = status_filter or ReportStatus.CITY_APPROVED
    stmt = (
        select(EmploymentReport)
        .options(joinedload(EmploymentReport.enterprise), joinedload(EmploymentReport.survey_period))
        .where(EmploymentReport.status == effective_status)
        .order_by(EmploymentReport.updated_at.desc())
    )
    reports = list(db.scalars(stmt).all())
    return [_report_to_out(item) for item in reports]


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


@app.get("/survey-periods", response_model=list[SurveyPeriodOut])
def list_survey_periods(
    month_no: int | None = None,
    period_type: SurveyPeriodType | None = None,
    status_value: SurveyPeriodStatus | None = None,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SurveyPeriodOut]:
    stmt = select(SurveyPeriod).order_by(SurveyPeriod.start_time.desc())
    if month_no is not None:
        stmt = stmt.where(SurveyPeriod.month_no == month_no)
    if period_type is not None:
        stmt = stmt.where(SurveyPeriod.period_type == period_type)
    if status_value is not None:
        stmt = stmt.where(SurveyPeriod.status == status_value)
    return list(db.scalars(stmt).all())


@app.get("/survey-periods/current", response_model=list[SurveyPeriodOut])
def list_current_periods(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SurveyPeriodOut]:
    now = datetime.utcnow()
    stmt = (
        select(SurveyPeriod)
        .where(
            SurveyPeriod.start_time <= now,
            SurveyPeriod.end_time >= now,
            SurveyPeriod.status == SurveyPeriodStatus.ENABLED,
        )
        .order_by(SurveyPeriod.start_time.asc())
    )
    return list(db.scalars(stmt).all())


@app.post("/survey-periods", response_model=SurveyPeriodOut)
def create_survey_period(
    payload: SurveyPeriodUpsertIn,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> SurveyPeriodOut:
    _validate_period_payload(db, payload)

    period = SurveyPeriod(
        period_code=payload.period_code,
        period_name=payload.period_name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        period_type=payload.period_type,
        month_no=payload.month_no,
        half_no=payload.half_no,
        status=payload.status,
        created_by_user_id=current_user.id,
        updated_by_user_id=current_user.id,
    )
    db.add(period)
    db.flush()

    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="period_create",
        target_type="survey_period",
        target_id=str(period.id),
        reason=None,
        before_state=None,
        after_state={
            "period_code": period.period_code,
            "period_name": period.period_name,
            "period_type": period.period_type.value,
            "month_no": period.month_no,
            "half_no": period.half_no,
            "status": period.status.value,
        },
    )

    db.commit()
    db.refresh(period)
    return period


@app.put("/survey-periods/{period_id}", response_model=SurveyPeriodOut)
def update_survey_period(
    period_id: int,
    payload: SurveyPeriodUpsertIn,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> SurveyPeriodOut:
    period = db.get(SurveyPeriod, period_id)
    if period is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="调查期不存在")

    _validate_period_payload(db, payload, exclude_period_id=period.id)

    before_state = {
        "period_code": period.period_code,
        "period_name": period.period_name,
        "period_type": period.period_type.value,
        "month_no": period.month_no,
        "half_no": period.half_no,
        "status": period.status.value,
    }

    period.period_code = payload.period_code
    period.period_name = payload.period_name
    period.start_time = payload.start_time
    period.end_time = payload.end_time
    period.period_type = payload.period_type
    period.month_no = payload.month_no
    period.half_no = payload.half_no
    period.status = payload.status
    period.updated_by_user_id = current_user.id

    db.flush()
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="period_update",
        target_type="survey_period",
        target_id=str(period.id),
        reason=None,
        before_state=before_state,
        after_state={
            "period_code": period.period_code,
            "period_name": period.period_name,
            "period_type": period.period_type.value,
            "month_no": period.month_no,
            "half_no": period.half_no,
            "status": period.status.value,
        },
    )

    db.commit()
    db.refresh(period)
    return period


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
    if not enterprise.city_code:
        enterprise.city_code = current_user.city_code or "530100"
    if not enterprise.city_name:
        enterprise.city_name = "昆明市"

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
    period_code: str | None = None,
    report_status: ReportStatus | None = None,
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> list[ReportOut]:
    enterprise = db.get(Enterprise, current_user.enterprise_id) if current_user.enterprise_id else None
    if enterprise is None:
        return []

    stmt = (
        select(EmploymentReport)
        .options(joinedload(EmploymentReport.survey_period), joinedload(EmploymentReport.enterprise))
        .where(EmploymentReport.enterprise_id == enterprise.id)
        .order_by(EmploymentReport.updated_at.desc())
    )
    if period_code is not None:
        stmt = stmt.where(EmploymentReport.period_code == period_code)
    if report_status is not None:
        stmt = stmt.where(EmploymentReport.status == report_status)

    reports = list(db.scalars(stmt).all())
    return [_report_to_out(item) for item in reports]


@app.post("/reports/save", response_model=ReportOut)
def save_report(
    payload: ReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    enterprise = _get_or_create_enterprise(db, current_user)
    report, before_state = _upsert_report_for_enterprise(db, enterprise, payload)

    report.status = ReportStatus.DRAFT
    report.updated_by_user_id = current_user.id

    db.flush()
    _save_report_version(db, report, current_user, "report_save")
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_save",
        target_type="employment_report",
        target_id=str(report.id),
        reason=None,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    report = _get_report_with_relations(db, report.id)
    return _report_to_out(report)


@app.post("/reports/submit", response_model=ReportOut)
def submit_report(
    payload: ReportPayload,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    enterprise = _get_or_create_enterprise(db, current_user)
    _validate_submission(payload)

    report, before_state = _upsert_report_for_enterprise(db, enterprise, payload)
    report.status = ReportStatus.PENDING_CITY_REVIEW
    report.updated_by_user_id = current_user.id
    report.last_submitted_at = datetime.utcnow()

    db.flush()
    _save_report_version(db, report, current_user, "report_submit")
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_submit",
        target_type="employment_report",
        target_id=str(report.id),
        reason=None,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    report = _get_report_with_relations(db, report.id)
    return _report_to_out(report)


@app.get("/city/reports", response_model=list[ReportOut])
def list_city_reports(
    report_status: ReportStatus | None = None,
    current_user: User = Depends(require_roles(UserRole.CITY)),
    db: Session = Depends(get_db),
) -> list[ReportOut]:
    return _list_city_reports(db, current_user, report_status)


@app.get("/city/reports/{report_id}", response_model=ReportOut)
def city_report_detail(
    report_id: int,
    current_user: User = Depends(require_roles(UserRole.CITY)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    _assert_city_scope(current_user, report)
    return _report_to_out(report)


@app.post("/city/reports/{report_id}/approve", response_model=ReportOut)
def city_approve_report(
    report_id: int,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.CITY)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    _assert_city_scope(current_user, report)
    if report.status != ReportStatus.PENDING_CITY_REVIEW:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅待市审核报表可审核通过")

    before_state = _report_snapshot(report)

    report.status = ReportStatus.CITY_APPROVED
    report.city_reviewed_at = datetime.utcnow()
    report.updated_by_user_id = current_user.id

    db.flush()
    _save_report_version(db, report, current_user, "report_city_approve")
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_city_approve",
        target_type="employment_report",
        target_id=str(report.id),
        reason=None,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    report = _get_report_with_relations(db, report.id)
    return _report_to_out(report)


@app.post("/city/reports/{report_id}/reject", response_model=ReportOut)
def city_reject_report(
    report_id: int,
    payload: ReportReviewIn,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.CITY)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    _assert_city_scope(current_user, report)
    if report.status != ReportStatus.PENDING_CITY_REVIEW:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅待市审核报表可退回")

    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="退回必须填写原因")

    before_state = _report_snapshot(report)

    report.status = ReportStatus.CITY_REJECTED
    report.city_reviewed_at = datetime.utcnow()
    report.updated_by_user_id = current_user.id

    db.flush()
    _save_report_version(db, report, current_user, "report_city_reject")
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_city_reject",
        target_type="employment_report",
        target_id=str(report.id),
        reason=reason,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    report = _get_report_with_relations(db, report.id)
    return _report_to_out(report)


@app.get("/province/reports", response_model=list[ReportOut])
def list_province_reports(
    report_status: ReportStatus | None = None,
    _: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> list[ReportOut]:
    return _list_province_reports(db, report_status)


@app.get("/province/reports/{report_id}", response_model=ReportOut)
def province_report_detail(
    report_id: int,
    _: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    return _report_to_out(report)


@app.post("/province/reports/{report_id}/approve", response_model=ReportOut)
def province_approve_report(
    report_id: int,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    if report.status != ReportStatus.CITY_APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅待省审核报表可审核通过")

    before_state = _report_snapshot(report)

    report.status = ReportStatus.PROVINCE_APPROVED
    report.province_reviewed_at = datetime.utcnow()
    report.updated_by_user_id = current_user.id

    db.flush()
    _save_report_version(db, report, current_user, "report_province_approve")
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_province_approve",
        target_type="employment_report",
        target_id=str(report.id),
        reason=None,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    report = _get_report_with_relations(db, report.id)
    return _report_to_out(report)


@app.post("/province/reports/{report_id}/reject", response_model=ReportOut)
def province_reject_report(
    report_id: int,
    payload: ReportReviewIn,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    if report.status != ReportStatus.CITY_APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅待省审核报表可退回")

    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="退回必须填写原因")

    before_state = _report_snapshot(report)

    report.status = ReportStatus.PROVINCE_REJECTED
    report.province_reviewed_at = datetime.utcnow()
    report.updated_by_user_id = current_user.id

    db.flush()
    _save_report_version(db, report, current_user, "report_province_reject")
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_province_reject",
        target_type="employment_report",
        target_id=str(report.id),
        reason=reason,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    report = _get_report_with_relations(db, report.id)
    return _report_to_out(report)


@app.post("/province/reports/{report_id}/submit", response_model=ReportOut)
def province_submit_report(
    report_id: int,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    if report.status != ReportStatus.PROVINCE_APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅省审核通过报表可执行上报")

    before_state = _report_snapshot(report)

    report.status = ReportStatus.PROVINCE_SUBMITTED
    report.updated_by_user_id = current_user.id

    db.flush()
    _save_report_version(db, report, current_user, "report_province_submit")
    _write_audit_log(
        db=db,
        request=request,
        operator=current_user,
        action_type="report_province_submit",
        target_type="employment_report",
        target_id=str(report.id),
        reason=None,
        before_state=before_state,
        after_state=_report_snapshot(report),
    )

    db.commit()
    report = _get_report_with_relations(db, report.id)
    return _report_to_out(report)


@app.get("/reports", response_model=list[ReportOut])
def list_reports(
    report_status: ReportStatus | None = None,
    current_user: User = Depends(require_roles(UserRole.CITY, UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> list[ReportOut]:
    if current_user.role == UserRole.CITY:
        return _list_city_reports(db, current_user, report_status)
    return _list_province_reports(db, report_status)


@app.get("/reports/{report_id}", response_model=ReportOut)
def report_detail(
    report_id: int,
    current_user: User = Depends(require_roles(UserRole.CITY, UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> ReportOut:
    report = _get_report_with_relations(db, report_id)
    if current_user.role == UserRole.CITY:
        _assert_city_scope(current_user, report)
    return _report_to_out(report)


@app.post("/reports/{report_id}/city-reject", response_model=ReportOut)
def city_reject_report_compat(
    report_id: int,
    payload: ReportReviewIn,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.CITY)),
    db: Session = Depends(get_db),
) -> ReportOut:
    return city_reject_report(report_id, payload, request, current_user, db)


@app.get("/reports/{report_id}/versions", response_model=list[ReportVersionOut])
def list_report_versions(
    report_id: int,
    current_user: User = Depends(require_roles(UserRole.ENTERPRISE, UserRole.CITY, UserRole.PROVINCE)),
    db: Session = Depends(get_db),
) -> list[ReportVersionOut]:
    report = _get_report_with_relations(db, report_id)

    if current_user.role == UserRole.ENTERPRISE:
        if report.enterprise_id != current_user.enterprise_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅可查看本企业报表版本")
    elif current_user.role == UserRole.CITY:
        _assert_city_scope(current_user, report)

    stmt = (
        select(ReportVersion)
        .where(ReportVersion.report_id == report_id)
        .order_by(ReportVersion.version_no.desc())
    )
    return list(db.scalars(stmt).all())


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

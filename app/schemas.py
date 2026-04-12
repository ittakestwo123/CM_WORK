from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import FilingStatus, NoticeScope, ReportStatus, SurveyPeriodStatus, SurveyPeriodType, UserRole


class LoginIn(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    dashboard: str


class UserOut(BaseModel):
    id: int
    username: str
    name: str
    region: str
    role: UserRole
    is_active: bool
    is_activated: bool
    login_fail_count: int = 0
    locked_until: datetime | None = None
    city_code: str | None
    enterprise_id: int | None

    model_config = ConfigDict(from_attributes=True)


class FilingPayload(BaseModel):
    organization_code: str = Field(min_length=1, max_length=9, pattern=r"^[A-Za-z0-9]{1,9}$")
    name: str = Field(min_length=2, max_length=128)
    nature: str = Field(min_length=2, max_length=64)
    industry: str = Field(min_length=2, max_length=64)
    business_scope: str = Field(min_length=2, max_length=255)
    contact_person: str = Field(min_length=2, max_length=64)
    contact_address: str = Field(min_length=3, max_length=255, pattern=r"^[^/]{1,64}/[^/]{1,64}$")
    postal_code: str = Field(pattern=r"^\d{6}$")
    phone: str = Field(pattern=r"^[0-9\-]{7,20}$")
    fax: str | None = Field(default=None, pattern=r"^[0-9\-]{7,20}$")
    email: EmailStr | None = None


class FilingOut(BaseModel):
    id: int
    organization_code: str | None
    name: str | None
    nature: str | None
    industry: str | None
    business_scope: str | None
    contact_person: str | None
    contact_address: str | None
    postal_code: str | None
    phone: str | None
    fax: str | None
    email: str | None
    city_code: str | None
    city_name: str | None
    filing_status: FilingStatus
    filing_reject_reason: str | None
    filing_submit_time: datetime | None
    filing_review_time: datetime | None

    model_config = ConfigDict(from_attributes=True)


class FilingReviewIn(BaseModel):
    reason: str | None = Field(default=None, max_length=255)


class SurveyPeriodUpsertIn(BaseModel):
    period_code: str = Field(min_length=4, max_length=32)
    period_name: str = Field(min_length=2, max_length=64)
    start_time: datetime
    end_time: datetime
    period_type: SurveyPeriodType
    month_no: int = Field(ge=1, le=12)
    half_no: int | None = Field(default=None, ge=1, le=2)
    status: SurveyPeriodStatus = SurveyPeriodStatus.ENABLED


class SurveyPeriodOut(BaseModel):
    id: int
    period_code: str
    period_name: str
    start_time: datetime
    end_time: datetime
    period_type: SurveyPeriodType
    month_no: int
    half_no: int | None
    status: SurveyPeriodStatus

    model_config = ConfigDict(from_attributes=True)


class ReportPayload(BaseModel):
    period_code: str = Field(min_length=4, max_length=32)
    base_employment: int = Field(ge=0)
    survey_employment: int = Field(ge=0)
    decrease_type: str | None = Field(default=None, max_length=64)
    decrease_reason: str | None = Field(default=None, max_length=64)
    decrease_reason_detail: str | None = Field(default=None, max_length=255)
    other_note: str | None = Field(default=None, max_length=255)


class ReportOut(BaseModel):
    id: int
    enterprise_id: int
    enterprise_name: str | None = None
    region: str | None = None
    survey_period_id: int
    period_code: str
    period_name: str | None = None
    period_type: SurveyPeriodType | None = None
    base_employment: int
    survey_employment: int
    decrease_type: str | None
    decrease_reason: str | None
    decrease_reason_detail: str | None
    other_note: str | None
    decrease_count: int
    status: ReportStatus
    last_submitted_at: datetime | None
    city_reviewed_at: datetime | None = None
    province_reviewed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ReportReviewIn(BaseModel):
    reason: str = Field(min_length=1, max_length=255)


class ReportModifyIn(BaseModel):
    base_employment: int = Field(ge=0)
    survey_employment: int = Field(ge=0)
    decrease_type: str | None = Field(default=None, max_length=64)
    decrease_reason: str | None = Field(default=None, max_length=64)
    decrease_reason_detail: str | None = Field(default=None, max_length=255)
    other_note: str | None = Field(default=None, max_length=255)
    reason: str = Field(min_length=1, max_length=255)


class ReportVersionOut(BaseModel):
    id: int
    report_id: int
    version_no: int
    action_type: str
    operator_id: int | None
    snapshot: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogOut(BaseModel):
    id: int
    operator_id: int | None
    operator_role: str
    action_type: str
    target_type: str
    target_id: str
    reason: str | None
    before_state: dict | None
    after_state: dict | None
    ip_address: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OperationLogOut(BaseModel):
    id: int
    user_id: int | None
    user_name: str
    role: str
    operation_type: str
    target_type: str
    target_id: str
    old_value: dict | None
    new_value: dict | None
    reason: str | None
    operation_time: datetime
    ip_address: str | None

    model_config = ConfigDict(from_attributes=True)


class NoticeCreateIn(BaseModel):
    title: str = Field(min_length=2, max_length=50)
    content: str = Field(min_length=2, max_length=1000)


class NoticeUpdateIn(BaseModel):
    title: str = Field(min_length=2, max_length=50)
    content: str = Field(min_length=2, max_length=1000)


class NoticeOut(BaseModel):
    id: int
    title: str
    content: str
    scope: NoticeScope
    city_code: str | None
    publisher_name: str
    publisher_role: str
    read_count: int
    read: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CitySummaryItemOut(BaseModel):
    city: str
    enterprise_count: int
    base_total: int
    survey_total: int
    change_total: int


class ProvinceSummaryOut(BaseModel):
    period_code: str
    enterprise_total: int
    base_total: int
    survey_total: int
    change_total: int
    by_city: list[CitySummaryItemOut]


class CompareMetricOut(BaseModel):
    metric: str
    value_a: float
    value_b: float
    ratio: str


class CompareCityOut(BaseModel):
    city: str
    base_a: int
    base_b: int
    survey_a: int
    survey_b: int
    report_count_a: int
    report_count_b: int


class ProvinceCompareOut(BaseModel):
    period_code_a: str
    period_code_b: str
    by_city: list[CompareCityOut]
    metrics: list[CompareMetricOut]


class TrendPointOut(BaseModel):
    period_code: str
    period_name: str
    base_total: int
    survey_total: int
    change_total: int
    change_ratio: float


class ProvinceTrendOut(BaseModel):
    points: list[TrendPointOut]


class MultiDimItemOut(BaseModel):
    dimension: str
    value: str
    enterprise_count: int
    base_total: int
    survey_total: int
    change_total: int
    decrease_total: int
    change_ratio: float


class ProvinceMultiDimOut(BaseModel):
    period_code: str
    dimension: str
    items: list[MultiDimItemOut]


class SamplingCityOut(BaseModel):
    city: str
    enterprise_count: int
    ratio: float


class ProvinceSamplingOut(BaseModel):
    period_code: str
    total_enterprises: int
    city_count: int
    by_city: list[SamplingCityOut]


class ReportExportRowOut(BaseModel):
    report_id: int
    unit_name: str
    account: str | None
    role: str
    user_type: str
    city: str | None
    county: str | None
    area: str | None
    unit_nature: str | None
    industry: str | None
    status: ReportStatus
    period_code: str
    period_name: str | None
    stat_month: int | None
    stat_quarter: int | None
    base_employment: int
    survey_employment: int
    updated_at: datetime


class SystemUserOut(BaseModel):
    id: int
    username: str
    role: UserRole
    custom_role_id: int | None = None
    custom_role_name: str | None = None
    is_active: bool
    is_activated: bool
    login_fail_count: int
    locked_until: datetime | None
    city_code: str | None
    enterprise_id: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SystemUserCreateIn(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole
    custom_role_id: int | None = None
    is_active: bool = True
    is_activated: bool = True
    city_code: str | None = Field(default=None, pattern=r"^\d{6}$")
    enterprise_id: int | None = None


class SystemUserUpdateIn(BaseModel):
    role: UserRole | None = None
    custom_role_id: int | None = None
    is_active: bool | None = None
    is_activated: bool | None = None
    city_code: str | None = Field(default=None, pattern=r"^\d{6}$")
    enterprise_id: int | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)


class SystemUserRoleChangeIn(BaseModel):
    new_role: UserRole
    custom_role_id: int | None = None
    reason: str = Field(min_length=1, max_length=255)


class SystemRoleOut(BaseModel):
    id: str
    name: str
    scope: UserRole
    is_builtin: bool
    assigned_user_count: int
    permissions: list[str]


class SystemRoleCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=64)
    scope: UserRole
    permissions: list[str] = Field(default_factory=list)


class SystemRoleUpdateIn(BaseModel):
    name: str = Field(min_length=2, max_length=64)
    permissions: list[str] = Field(default_factory=list)


class SystemRoleDeleteOut(BaseModel):
    allowed: bool
    reason: str | None = None
    assigned_user_count: int = 0


class SystemMonitorOut(BaseModel):
    total_users: int
    active_users: int
    enterprises: int
    reports: int
    notices: int
    pending_review_count: int
    cpu_usage: int
    memory_usage: int
    disk_usage: int
    api_latency_ms: int
    warning_level: str


class SystemMonitorSnapshotOut(BaseModel):
    id: int
    cpu_usage: int
    memory_usage: int
    disk_usage: int
    active_users: int
    pending_review_count: int
    api_latency_ms: int
    warning_level: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PasswordChangeIn(BaseModel):
    old_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class NationalPushPreviewOut(BaseModel):
    period_code: str
    report_count: int
    enterprise_count: int
    payload: list[dict[str, Any]]


class NationalPushResultOut(BaseModel):
    batch_id: str
    pushed_count: int
    failed_count: int
    status: str
    attempt_count: int


class NationalPushApiConfigIn(BaseModel):
    api_key: str = Field(min_length=8, max_length=255)
    enabled: bool = True


class NationalPushApiConfigOut(BaseModel):
    enabled: bool
    api_key_masked: str
    updated_at: datetime


class NationalPushExecuteIn(BaseModel):
    period_code: str | None = Field(default=None, max_length=32)
    simulate_http_status: int | None = Field(default=None)


class NationalPushRecordOut(BaseModel):
    id: int
    batch_id: str
    period_code: str
    report_count: int
    pushed_count: int
    failed_count: int
    status: str
    attempt_count: int
    last_error_code: int | None
    last_error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NationalPushLogOut(BaseModel):
    id: int
    batch_id: str
    attempt_no: int
    status: str
    status_code: int | None
    message: str
    detail: dict[str, Any] | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import FilingStatus, ReportStatus, SurveyPeriodStatus, SurveyPeriodType, UserRole


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
    role: UserRole
    is_active: bool
    city_code: str | None
    enterprise_id: int | None

    model_config = ConfigDict(from_attributes=True)


class FilingPayload(BaseModel):
    organization_code: str = Field(min_length=8, max_length=32)
    name: str = Field(min_length=2, max_length=128)
    nature: str = Field(min_length=2, max_length=64)
    industry: str = Field(min_length=2, max_length=64)
    business_scope: str = Field(min_length=2, max_length=255)
    contact_person: str = Field(min_length=2, max_length=64)
    contact_address: str = Field(min_length=2, max_length=255)
    postal_code: str = Field(pattern=r"^\d{6}$")
    phone: str = Field(pattern=r"^[0-9\-]{7,20}$")
    fax: str | None = Field(default=None, pattern=r"^[0-9\-]{7,20}$")
    email: EmailStr


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

    model_config = ConfigDict(from_attributes=True)


class ReportReviewIn(BaseModel):
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

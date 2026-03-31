from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import FilingStatus, ReportStatus, UserRole


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
    filing_status: FilingStatus
    filing_reject_reason: str | None
    filing_submit_time: datetime | None
    filing_review_time: datetime | None

    model_config = ConfigDict(from_attributes=True)


class FilingReviewIn(BaseModel):
    reason: str | None = Field(default=None, max_length=255)


class ReportPayload(BaseModel):
    survey_year: int = Field(ge=2000, le=2100)
    base_employment: int = Field(ge=0)
    survey_employment: int = Field(ge=0)
    decrease_type: str | None = Field(default=None, max_length=64)
    decrease_reason: str | None = Field(default=None, max_length=64)
    decrease_reason_detail: str | None = Field(default=None, max_length=255)
    other_note: str | None = Field(default=None, max_length=255)


class ReportOut(BaseModel):
    id: int
    enterprise_id: int
    survey_year: int
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

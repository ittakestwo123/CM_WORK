from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserRole(str, Enum):
    ENTERPRISE = "enterprise"
    CITY = "city"
    PROVINCE = "province"


class FilingStatus(str, Enum):
    NOT_SUBMITTED = "未备案"
    PENDING = "待备案"
    APPROVED = "已备案"
    REJECTED = "备案退回"


class ReportStatus(str, Enum):
    DRAFT = "草稿"
    PENDING_CITY_REVIEW = "待市审核"
    CITY_REJECTED = "市退回"
    CITY_APPROVED = "待省审核"
    PROVINCE_REJECTED = "省退回"
    PROVINCE_APPROVED = "省审核通过"
    PROVINCE_SUBMITTED = "省已上报"


class SurveyPeriodType(str, Enum):
    MONTH = "MONTH"
    HALF_MONTH = "HALF_MONTH"


class SurveyPeriodStatus(str, Enum):
    ENABLED = "启用"
    DISABLED = "停用"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    city_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    enterprise_id: Mapped[int | None] = mapped_column(ForeignKey("enterprises.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    enterprise = relationship("Enterprise", back_populates="users", foreign_keys=[enterprise_id])
    logs = relationship("AuditLog", back_populates="operator")


class Enterprise(Base):
    __tablename__ = "enterprises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_code: Mapped[str | None] = mapped_column(String(32), unique=True, index=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    nature: Mapped[str | None] = mapped_column(String(64), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(64), nullable=True)
    business_scope: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contact_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fax: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(128), nullable=True)
    city_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    city_name: Mapped[str | None] = mapped_column(String(64), nullable=True)

    filing_status: Mapped[FilingStatus] = mapped_column(
        SqlEnum(FilingStatus),
        nullable=False,
        default=FilingStatus.NOT_SUBMITTED,
        index=True,
    )
    filing_reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    filing_submit_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    filing_review_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    users = relationship("User", back_populates="enterprise", foreign_keys="User.enterprise_id")
    reports = relationship("EmploymentReport", back_populates="enterprise", cascade="all, delete-orphan")


class SurveyPeriod(Base):
    __tablename__ = "survey_periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    period_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    period_name: Mapped[str] = mapped_column(String(64), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    period_type: Mapped[SurveyPeriodType] = mapped_column(SqlEnum(SurveyPeriodType), nullable=False)
    month_no: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    half_no: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[SurveyPeriodStatus] = mapped_column(
        SqlEnum(SurveyPeriodStatus),
        nullable=False,
        default=SurveyPeriodStatus.ENABLED,
        index=True,
    )
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    reports = relationship("EmploymentReport", back_populates="survey_period")


class EmploymentReport(Base):
    __tablename__ = "employment_reports"
    __table_args__ = (UniqueConstraint("enterprise_id", "survey_period_id", name="uq_report_enterprise_period"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    enterprise_id: Mapped[int] = mapped_column(ForeignKey("enterprises.id"), nullable=False, index=True)
    survey_period_id: Mapped[int] = mapped_column(ForeignKey("survey_periods.id"), nullable=False, index=True)
    period_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    base_employment: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    survey_employment: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    decrease_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    decrease_reason: Mapped[str | None] = mapped_column(String(64), nullable=True)
    decrease_reason_detail: Mapped[str | None] = mapped_column(String(255), nullable=True)
    other_note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[ReportStatus] = mapped_column(
        SqlEnum(ReportStatus),
        nullable=False,
        default=ReportStatus.DRAFT,
        index=True,
    )
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    last_submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    city_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    province_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    enterprise = relationship("Enterprise", back_populates="reports")
    survey_period = relationship("SurveyPeriod", back_populates="reports")
    versions = relationship("ReportVersion", back_populates="report", cascade="all, delete-orphan")

    @property
    def decrease_count(self) -> int:
        return max(self.base_employment - self.survey_employment, 0)


class ReportVersion(Base):
    __tablename__ = "report_versions"
    __table_args__ = (UniqueConstraint("report_id", "version_no", name="uq_report_version_no"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("employment_reports.id"), nullable=False, index=True)
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    operator_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    report = relationship("EmploymentReport", back_populates="versions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    operator_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    operator_role: Mapped[str] = mapped_column(String(32), nullable=False)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_id: Mapped[str] = mapped_column(String(64), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    before_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    operator = relationship("User", back_populates="logs")

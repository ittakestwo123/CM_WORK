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
    PENDING_CITY_REVIEW = "待市审"
    CITY_REJECTED = "市审退回"
    CITY_APPROVED = "待省审"
    PROVINCE_REJECTED = "省审退回"
    PROVINCE_APPROVED = "省审通过"
    PROVINCE_SUBMITTED = "已上报部委"


class SurveyPeriodType(str, Enum):
    MONTH = "MONTH"
    HALF_MONTH = "HALF_MONTH"


class SurveyPeriodStatus(str, Enum):
    ENABLED = "启用"
    DISABLED = "停用"


class NoticeScope(str, Enum):
    PROVINCE = "province"
    CITY = "city"


class CustomRole(Base):
    __tablename__ = "custom_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    scope: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), nullable=False, index=True)
    permissions: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    is_builtin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    created_by_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    users = relationship("User", back_populates="custom_role", foreign_keys="User.custom_role_id")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_activated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    login_fail_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    city_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    enterprise_id: Mapped[int | None] = mapped_column(ForeignKey("enterprises.id"), nullable=True, index=True)
    custom_role_id: Mapped[int | None] = mapped_column(ForeignKey("custom_roles.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    enterprise = relationship("Enterprise", back_populates="users", foreign_keys=[enterprise_id])
    custom_role = relationship("CustomRole", back_populates="users", foreign_keys=[custom_role_id])
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
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

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


class OperationLog(Base):
    __tablename__ = "operation_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    user_name: Mapped[str] = mapped_column(String(64), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    operation_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_id: Mapped[str] = mapped_column(String(64), nullable=False)
    old_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    operation_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Notice(Base):
    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    scope: Mapped[NoticeScope] = mapped_column(SqlEnum(NoticeScope), nullable=False, index=True)
    city_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    publisher_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    publisher_name: Mapped[str] = mapped_column(String(64), nullable=False)
    publisher_role: Mapped[str] = mapped_column(String(32), nullable=False)
    read_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    reads = relationship("NoticeRead", back_populates="notice", cascade="all, delete-orphan")


class NoticeRead(Base):
    __tablename__ = "notice_reads"
    __table_args__ = (UniqueConstraint("notice_id", "user_id", name="uq_notice_user_read"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    notice_id: Mapped[int] = mapped_column(ForeignKey("notices.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    notice = relationship("Notice", back_populates="reads")


class NationalPushApiConfig(Base):
    __tablename__ = "national_push_api_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    api_key: Mapped[str] = mapped_column(String(255), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class NationalPushRecord(Base):
    __tablename__ = "national_push_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    period_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    report_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pushed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    request_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    logs = relationship("NationalPushLog", back_populates="record", cascade="all, delete-orphan")


class NationalPushLog(Base):
    __tablename__ = "national_push_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("national_push_records.id"), nullable=False, index=True)
    batch_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    attempt_no: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    detail: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    record = relationship("NationalPushRecord", back_populates="logs")


class SystemMonitorSnapshot(Base):
    __tablename__ = "system_monitor_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cpu_usage: Mapped[int] = mapped_column(Integer, nullable=False)
    memory_usage: Mapped[int] = mapped_column(Integer, nullable=False)
    disk_usage: Mapped[int] = mapped_column(Integer, nullable=False)
    active_users: Mapped[int] = mapped_column(Integer, nullable=False)
    pending_review_count: Mapped[int] = mapped_column(Integer, nullable=False)
    api_latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    warning_level: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)

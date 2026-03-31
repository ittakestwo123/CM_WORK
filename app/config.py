from __future__ import annotations

from datetime import date
import os


SECRET_KEY = os.getenv("APP_SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 8 * 60

SURVEY_PERIOD_START = date.fromisoformat(os.getenv("SURVEY_PERIOD_START", "2026-03-01"))
SURVEY_PERIOD_END = date.fromisoformat(os.getenv("SURVEY_PERIOD_END", "2026-05-31"))


def in_survey_period(target_date: date) -> bool:
    return SURVEY_PERIOD_START <= target_date <= SURVEY_PERIOD_END

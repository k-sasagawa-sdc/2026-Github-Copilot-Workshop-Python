from dataclasses import asdict, dataclass
from datetime import datetime


VALID_MODES = {"focus", "short_break", "long_break"}


@dataclass(frozen=True)
class SessionRecord:
    mode: str
    planned_seconds: int
    actual_seconds: int
    started_at: str
    ended_at: str
    completed: bool

    def to_dict(self):
        return asdict(self)

    @classmethod
    def from_dict(cls, data):
        errors = validate_session_payload(data or {})
        if errors:
            raise ValueError(errors)

        return cls(**data)


def validate_session_payload(payload):
    errors = {}
    mode = payload.get("mode")

    if mode not in VALID_MODES:
        errors["mode"] = "mode は focus, short_break, long_break のいずれかにしてください。"

    for key in ("planned_seconds", "actual_seconds"):
        value = payload.get(key)
        if not isinstance(value, int):
            errors[key] = "整数で指定してください。"
            continue
        if value < 0:
            errors[key] = "0 以上で指定してください。"

    completed = payload.get("completed")
    if not isinstance(completed, bool):
        errors["completed"] = "completed は true または false にしてください。"

    for key in ("started_at", "ended_at"):
        value = payload.get(key)
        if not isinstance(value, str):
            errors[key] = "ISO 8601 文字列で指定してください。"
            continue

        try:
            datetime.fromisoformat(value)
        except ValueError:
            errors[key] = "ISO 8601 形式で指定してください。"

    return errors
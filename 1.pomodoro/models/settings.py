from dataclasses import asdict, dataclass


DEFAULT_SETTINGS_VALUES = {
    "focus_minutes": 25,
    "short_break_minutes": 5,
    "long_break_minutes": 15,
    "long_break_interval": 4,
}


@dataclass(frozen=True)
class AppSettings:
    focus_minutes: int = DEFAULT_SETTINGS_VALUES["focus_minutes"]
    short_break_minutes: int = DEFAULT_SETTINGS_VALUES["short_break_minutes"]
    long_break_minutes: int = DEFAULT_SETTINGS_VALUES["long_break_minutes"]
    long_break_interval: int = DEFAULT_SETTINGS_VALUES["long_break_interval"]

    def to_dict(self):
        return asdict(self)

    @classmethod
    def defaults(cls):
        return cls()

    @classmethod
    def from_dict(cls, data):
        payload = {**DEFAULT_SETTINGS_VALUES, **(data or {})}
        errors = validate_settings_payload(payload)
        if errors:
            raise ValueError(errors)

        return cls(**payload)


def validate_settings_payload(payload):
    errors = {}
    rules = {
        "focus_minutes": (1, 120),
        "short_break_minutes": (1, 60),
        "long_break_minutes": (1, 90),
        "long_break_interval": (1, 12),
    }

    for key, (minimum, maximum) in rules.items():
        value = payload.get(key)

        if not isinstance(value, int):
            errors[key] = "整数で指定してください。"
            continue

        if value < minimum or value > maximum:
            errors[key] = f"{minimum} から {maximum} の範囲で指定してください。"

    return errors
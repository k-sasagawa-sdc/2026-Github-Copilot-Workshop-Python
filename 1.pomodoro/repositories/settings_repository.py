from datetime import datetime

from models.settings import AppSettings
from repositories.database import get_connection


def fetch_settings(database_path):
    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT focus_minutes, short_break_minutes, long_break_minutes, long_break_interval FROM settings WHERE id = 1"
        ).fetchone()

    if row is None:
        return AppSettings.defaults()

    return AppSettings(
        focus_minutes=row["focus_minutes"],
        short_break_minutes=row["short_break_minutes"],
        long_break_minutes=row["long_break_minutes"],
        long_break_interval=row["long_break_interval"],
    )


def save_settings(database_path, settings):
    timestamp = datetime.utcnow().isoformat()

    with get_connection(database_path) as connection:
        connection.execute(
            """
            INSERT INTO settings (
                id,
                focus_minutes,
                short_break_minutes,
                long_break_minutes,
                long_break_interval,
                updated_at
            ) VALUES (1, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                focus_minutes = excluded.focus_minutes,
                short_break_minutes = excluded.short_break_minutes,
                long_break_minutes = excluded.long_break_minutes,
                long_break_interval = excluded.long_break_interval,
                updated_at = excluded.updated_at
            """,
            (
                settings.focus_minutes,
                settings.short_break_minutes,
                settings.long_break_minutes,
                settings.long_break_interval,
                timestamp,
            ),
        )
        connection.commit()

    return settings
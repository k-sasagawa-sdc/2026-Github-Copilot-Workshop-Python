from datetime import datetime

from repositories.database import get_connection


def save_session(database_path, session):
    with get_connection(database_path) as connection:
        cursor = connection.execute(
            """
            INSERT INTO sessions (
                mode,
                planned_seconds,
                actual_seconds,
                started_at,
                ended_at,
                completed
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                session.mode,
                session.planned_seconds,
                session.actual_seconds,
                session.started_at,
                session.ended_at,
                int(session.completed),
            ),
        )
        connection.commit()

    payload = session.to_dict()
    payload["id"] = cursor.lastrowid
    return payload


def list_sessions_between(database_path, started_at, ended_at):
    if isinstance(started_at, datetime):
        started_at = started_at.isoformat()
    if isinstance(ended_at, datetime):
        ended_at = ended_at.isoformat()

    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            SELECT id, mode, planned_seconds, actual_seconds, started_at, ended_at, completed
            FROM sessions
            WHERE ended_at >= ? AND ended_at <= ?
            ORDER BY ended_at ASC
            """,
            (started_at, ended_at),
        ).fetchall()

    return [dict(row) for row in rows]
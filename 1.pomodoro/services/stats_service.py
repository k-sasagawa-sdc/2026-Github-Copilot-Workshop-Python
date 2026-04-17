from datetime import date, datetime, time, timedelta


def build_stats(sessions, today=None):
    if today is None:
        today = date.today()
    elif isinstance(today, str):
        today = date.fromisoformat(today)

    start_of_week = today - timedelta(days=6)
    daily_buckets = {}
    total_week_completed_sessions = 0
    total_week_focus_minutes = 0
    today_completed_sessions = 0
    today_focus_minutes = 0

    for offset in range(7):
        current_day = start_of_week + timedelta(days=offset)
        key = current_day.isoformat()
        daily_buckets[key] = {
            "date": key,
            "completed_sessions": 0,
            "focus_minutes": 0,
        }

    for session in sessions:
        ended_at = datetime.fromisoformat(session["ended_at"])
        session_day = ended_at.date().isoformat()

        if session_day not in daily_buckets:
            continue

        if session["mode"] == "focus":
            focus_minutes = int(session["actual_seconds"] / 60)
            daily_buckets[session_day]["focus_minutes"] += focus_minutes
            total_week_focus_minutes += focus_minutes

            if session_day == today.isoformat():
                today_focus_minutes += focus_minutes

            if session["completed"]:
                daily_buckets[session_day]["completed_sessions"] += 1
                total_week_completed_sessions += 1

                if session_day == today.isoformat():
                    today_completed_sessions += 1

    return {
        "today_completed_sessions": today_completed_sessions,
        "today_focus_minutes": today_focus_minutes,
        "week_completed_sessions": total_week_completed_sessions,
        "week_focus_minutes": total_week_focus_minutes,
        "weekly_activity": list(daily_buckets.values()),
    }


def get_stats_range(today=None):
    if today is None:
        today = date.today()
    elif isinstance(today, str):
        today = date.fromisoformat(today)

    start_of_week = datetime.combine(today - timedelta(days=6), time.min)
    end_of_day = datetime.combine(today, time.max)
    return start_of_week, end_of_day
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import tempfile
import unittest


WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
APP_PATH = WORKSPACE_ROOT / "1.pomodoro" / "app.py"


def load_app_module():
    spec = spec_from_file_location("pomodoro_app", APP_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError(f"アプリケーションモジュールを読み込めません: {APP_PATH}")

    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ApiTest(unittest.TestCase):
    def setUp(self):
        module = load_app_module()
        create_app = getattr(module, "create_app", None)
        self.temp_dir = tempfile.TemporaryDirectory()
        database_path = Path(self.temp_dir.name) / "pomodoro-test.db"

        self.assertTrue(callable(create_app))

        app = create_app(
            {
                "TESTING": True,
                "DATABASE_PATH": str(database_path),
            }
        )
        self.client = app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_get_settings_returns_default_values(self):
        response = self.client.get("/api/settings")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "focus_minutes": 25,
                "short_break_minutes": 5,
                "long_break_minutes": 15,
                "long_break_interval": 4,
            },
        )

    def test_put_settings_persists_values(self):
        response = self.client.put(
            "/api/settings",
            json={
                "focus_minutes": 30,
                "short_break_minutes": 7,
                "long_break_minutes": 20,
                "long_break_interval": 3,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["focus_minutes"], 30)

        second_response = self.client.get("/api/settings")
        self.assertEqual(second_response.get_json()["long_break_interval"], 3)

    def test_put_settings_rejects_invalid_values(self):
        response = self.client.put(
            "/api/settings",
            json={
                "focus_minutes": 0,
                "short_break_minutes": 7,
                "long_break_minutes": 20,
                "long_break_interval": 3,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("errors", response.get_json())

    def test_post_session_records_and_stats_returns_aggregates(self):
        save_response = self.client.post(
            "/api/sessions",
            json={
                "mode": "focus",
                "planned_seconds": 1500,
                "actual_seconds": 1500,
                "completed": True,
                "started_at": "2026-04-17T09:00:00",
                "ended_at": "2026-04-17T09:25:00",
            },
        )

        self.assertEqual(save_response.status_code, 201)

        stats_response = self.client.get("/api/stats?today=2026-04-17")
        stats = stats_response.get_json()

        self.assertEqual(stats_response.status_code, 200)
        self.assertEqual(stats["today_completed_sessions"], 1)
        self.assertEqual(stats["today_focus_minutes"], 25)
        self.assertEqual(len(stats["weekly_activity"]), 7)
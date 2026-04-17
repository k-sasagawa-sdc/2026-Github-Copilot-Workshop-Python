from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
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


class HomePageTest(unittest.TestCase):
    def setUp(self):
        module = load_app_module()
        create_app = getattr(module, "create_app", None)

        self.assertTrue(
            callable(create_app),
            "1.pomodoro/app.py に create_app() を定義してください。",
        )

        app = create_app()
        self.client = app.test_client()

    def test_get_root_returns_ok(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)

    def test_root_contains_pomodoro_title(self):
        response = self.client.get("/")

        self.assertIn("Pomodoro", response.get_data(as_text=True))

    def test_root_contains_timer_display(self):
        response = self.client.get("/")

        self.assertIn('id="timer-display"', response.get_data(as_text=True))

    def test_root_contains_mode_display(self):
        response = self.client.get("/")

        self.assertIn('id="mode-display"', response.get_data(as_text=True))

    def test_root_contains_primary_controls(self):
        response = self.client.get("/")
        body = response.get_data(as_text=True)

        self.assertIn('id="start-button"', body)
        self.assertIn('id="pause-button"', body)
        self.assertIn('id="reset-button"', body)
from datetime import date
from pathlib import Path
import sys

from flask import Flask, jsonify, render_template, request


BASE_DIR = Path(__file__).resolve().parent

if str(BASE_DIR) not in sys.path:
	sys.path.insert(0, str(BASE_DIR))

from models.session import SessionRecord, validate_session_payload
from models.settings import AppSettings, validate_settings_payload
from repositories.database import initialize_database
from repositories.session_repository import list_sessions_between, save_session
from repositories.settings_repository import fetch_settings, save_settings
from services.stats_service import build_stats, get_stats_range


def create_app(config=None):
	app = Flask(
		__name__,
		template_folder=str(BASE_DIR / "templates"),
		static_folder=str(BASE_DIR / "static"),
		instance_path=str(BASE_DIR / "instance"),
	)
	app.config.update(
		DATABASE_PATH=str(BASE_DIR / "instance" / "pomodoro.db"),
	)

	if config:
		app.config.update(config)

	initialize_database(app.config["DATABASE_PATH"])

	def current_settings():
		return fetch_settings(app.config["DATABASE_PATH"])

	def current_stats(reference_day=None):
		start_at, end_at = get_stats_range(reference_day)
		sessions = list_sessions_between(app.config["DATABASE_PATH"], start_at, end_at)
		return build_stats(sessions, today=reference_day)

	@app.get("/")
	def index():
		return render_template(
			"index.html",
			page_title="Pomodoro Timer App",
			initial_settings=current_settings().to_dict(),
			initial_stats=current_stats(date.today().isoformat()),
		)

	@app.get("/api/settings")
	def get_settings():
		return jsonify(current_settings().to_dict())

	@app.put("/api/settings")
	def put_settings():
		payload = request.get_json(silent=True) or {}
		errors = validate_settings_payload(payload)

		if errors:
			return jsonify({"errors": errors}), 400

		settings = AppSettings.from_dict(payload)
		save_settings(app.config["DATABASE_PATH"], settings)
		return jsonify(settings.to_dict())

	@app.post("/api/sessions")
	def post_session():
		payload = request.get_json(silent=True) or {}
		errors = validate_session_payload(payload)

		if errors:
			return jsonify({"errors": errors}), 400

		session = SessionRecord.from_dict(payload)
		return jsonify(save_session(app.config["DATABASE_PATH"], session)), 201

	@app.get("/api/stats")
	def get_stats():
		reference_day = request.args.get("today") or date.today().isoformat()
		return jsonify(current_stats(reference_day))

	return app


app = create_app()


if __name__ == "__main__":
	app.run(debug=True)

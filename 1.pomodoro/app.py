from pathlib import Path

from flask import Flask, render_template


BASE_DIR = Path(__file__).resolve().parent


def create_app():
	app = Flask(
		__name__,
		template_folder=str(BASE_DIR / "templates"),
		static_folder=str(BASE_DIR / "static"),
	)

	@app.get("/")
	def index():
		return render_template("index.html", page_title="Pomodoro Timer App")

	return app


app = create_app()


if __name__ == "__main__":
	app.run(debug=True)

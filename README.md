# Pomodoro Timer App

Flask と JavaScript で構成したポモドーロタイマーです。集中、短休憩、長休憩、自動モード切り替え、設定保存、SQLite 永続化、統計表示までを 1 画面で扱えます。

## 主な機能

- 集中、短休憩、長休憩の自動サイクル
- 開始、一時停止、再開、スキップ、リセット
- localStorage と Flask API を併用した設定保存
- SQLite への設定とセッション履歴の永続化
- 今日と今週の統計表示
- ブラウザ通知、完了音、モード別テーマ、進捗リング

## 起動方法

1. 仮想環境を有効化します
2. Flask アプリを起動します

```bash
/workspaces/2026-Github-Copilot-Workshop-Python/.venv/bin/python 1.pomodoro/app.py
```

ブラウザで http://127.0.0.1:5000 を開いて確認できます。

## テスト

JavaScript テスト:

```bash
node --test tests/test_state_machine.js tests/test_timer.js
```

Python テスト:

```bash
/workspaces/2026-Github-Copilot-Workshop-Python/.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
```

## API

- GET /api/settings
- PUT /api/settings
- POST /api/sessions
- GET /api/stats

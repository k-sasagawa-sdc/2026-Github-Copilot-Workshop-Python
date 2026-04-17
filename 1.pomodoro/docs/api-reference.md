# API リファレンス

Pomodoro タイマーアプリが提供する REST API の仕様です。

---

## 共通事項

- ベース URL: `/`
- リクエスト/レスポンスの Content-Type: `application/json`
- エラーレスポンス形式:

````json
{
  "errors": {
    "<フィールド名>": "<エラーメッセージ>"
  }
}
````

---

## エンドポイント一覧

### GET /

メイン画面の HTML を返します。

**テンプレート変数**

| 変数名 | 型 | 説明 |
|---|---|---|
| `page_title` | string | ページタイトル（`"Pomodoro Timer App"` 固定） |
| `initial_settings` | object | 初期設定値（`AppSettings` の JSON） |
| `initial_stats` | object | 今日を基準とした統計データ |

---

### GET /api/settings

現在のタイマー設定を取得します。

**レスポンス: 200 OK**

````json
{
  "focus_minutes": 25,
  "short_break_minutes": 5,
  "long_break_minutes": 15,
  "long_break_interval": 4
}
````

---

### PUT /api/settings

タイマー設定を更新します。

**リクエストボディ**

````json
{
  "focus_minutes": 25,
  "short_break_minutes": 5,
  "long_break_minutes": 15,
  "long_break_interval": 4
}
````

**バリデーションルール**

| フィールド | 型 | 範囲 |
|---|---|---|
| `focus_minutes` | integer | 1 〜 120 |
| `short_break_minutes` | integer | 1 〜 60 |
| `long_break_minutes` | integer | 1 〜 90 |
| `long_break_interval` | integer | 1 〜 12 |

**レスポンス: 200 OK**

更新後の設定オブジェクトを返します。

**レスポンス: 400 Bad Request**

バリデーションエラー時は `errors` オブジェクトを返します。

````json
{
  "errors": {
    "focus_minutes": "1 から 120 の範囲で指定してください。"
  }
}
````

---

### POST /api/sessions

完了したセッションを記録します。

**リクエストボディ**

````json
{
  "mode": "focus",
  "planned_seconds": 1500,
  "actual_seconds": 1500,
  "started_at": "2024-01-01T10:00:00",
  "ended_at": "2024-01-01T10:25:00",
  "completed": true
}
````

**フィールド仕様**

| フィールド | 型 | 説明 |
|---|---|---|
| `mode` | string | `focus` / `short_break` / `long_break` のいずれか |
| `planned_seconds` | integer | 予定していた秒数（0 以上） |
| `actual_seconds` | integer | 実際に経過した秒数（0 以上） |
| `started_at` | string | セッション開始日時（ISO 8601） |
| `ended_at` | string | セッション終了日時（ISO 8601） |
| `completed` | boolean | セッションが完了したかどうか |

**レスポンス: 201 Created**

保存されたセッションデータ（`id` を含む）を返します。

````json
{
  "id": 1,
  "mode": "focus",
  "planned_seconds": 1500,
  "actual_seconds": 1500,
  "started_at": "2024-01-01T10:00:00",
  "ended_at": "2024-01-01T10:25:00",
  "completed": true
}
````

**レスポンス: 400 Bad Request**

バリデーションエラー時は `errors` オブジェクトを返します。

---

### GET /api/stats

統計データを取得します。

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `today` | string | 任意 | 基準日（ISO 8601 形式: `YYYY-MM-DD`）。省略時はサーバーの今日の日付を使用 |

**レスポンス: 200 OK**

````json
{
  "today_completed_sessions": 3,
  "today_focus_minutes": 75,
  "week_completed_sessions": 15,
  "week_focus_minutes": 375,
  "weekly_activity": [
    {
      "date": "2024-01-01",
      "completed_sessions": 3,
      "focus_minutes": 75
    }
  ]
}
````

**レスポンスフィールド**

| フィールド | 型 | 説明 |
|---|---|---|
| `today_completed_sessions` | integer | 今日の完了セッション数（`focus` モードのみ） |
| `today_focus_minutes` | integer | 今日の集中時間（分） |
| `week_completed_sessions` | integer | 直近 7 日間の完了セッション数 |
| `week_focus_minutes` | integer | 直近 7 日間の集中時間（分） |
| `weekly_activity` | array | 直近 7 日間の日別データ（基準日を含む過去 7 日分） |

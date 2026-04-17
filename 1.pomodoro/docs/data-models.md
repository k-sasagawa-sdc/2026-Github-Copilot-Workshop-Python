# データモデル仕様

Pomodoro タイマーアプリで使用するデータモデルとデータベーススキーマを説明します。

---

## Python データモデル

### AppSettings

タイマーの設定値を表す不変データクラスです。

**定義ファイル**: `models/settings.py`

````python
@dataclass(frozen=True)
class AppSettings:
    focus_minutes: int        # 集中時間（分）
    short_break_minutes: int  # 短休憩時間（分）
    long_break_minutes: int   # 長休憩時間（分）
    long_break_interval: int  # 長休憩までのセッション数
````

**デフォルト値**

| フィールド | デフォルト値 |
|---|---|
| `focus_minutes` | 25 |
| `short_break_minutes` | 5 |
| `long_break_minutes` | 15 |
| `long_break_interval` | 4 |

**バリデーションルール**

| フィールド | 型 | 有効範囲 |
|---|---|---|
| `focus_minutes` | integer | 1 〜 120 |
| `short_break_minutes` | integer | 1 〜 60 |
| `long_break_minutes` | integer | 1 〜 90 |
| `long_break_interval` | integer | 1 〜 12 |

**主なメソッド**

| メソッド | 説明 |
|---|---|
| `to_dict()` | 辞書に変換して返す |
| `from_dict(data)` | 辞書からインスタンスを生成（バリデーションあり） |
| `defaults()` | デフォルト値のインスタンスを返す |

---

### SessionRecord

完了したポモドーロセッションを表す不変データクラスです。

**定義ファイル**: `models/session.py`

````python
@dataclass(frozen=True)
class SessionRecord:
    mode: str             # セッションの種類
    planned_seconds: int  # 予定していた秒数
    actual_seconds: int   # 実際に経過した秒数
    started_at: str       # 開始日時（ISO 8601）
    ended_at: str         # 終了日時（ISO 8601）
    completed: bool       # 完了したかどうか
````

**mode の有効値**

| 値 | 説明 |
|---|---|
| `focus` | 集中セッション |
| `short_break` | 短休憩 |
| `long_break` | 長休憩 |

**バリデーションルール**

| フィールド | 型 | 制約 |
|---|---|---|
| `mode` | string | `focus` / `short_break` / `long_break` のいずれか |
| `planned_seconds` | integer | 0 以上 |
| `actual_seconds` | integer | 0 以上 |
| `started_at` | string | ISO 8601 形式の日時文字列 |
| `ended_at` | string | ISO 8601 形式の日時文字列 |
| `completed` | boolean | `true` または `false` |

**主なメソッド**

| メソッド | 説明 |
|---|---|
| `to_dict()` | 辞書に変換して返す |
| `from_dict(data)` | 辞書からインスタンスを生成（バリデーションあり） |

---

## データベーススキーマ（SQLite）

**データベースファイル**: `instance/pomodoro.db`

### settings テーブル

タイマー設定を 1 行で管理します（`id = 1` の単一レコード）。

````sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    focus_minutes INTEGER NOT NULL,
    short_break_minutes INTEGER NOT NULL,
    long_break_minutes INTEGER NOT NULL,
    long_break_interval INTEGER NOT NULL,
    updated_at TEXT NOT NULL
)
````

| カラム | 型 | 説明 |
|---|---|---|
| `id` | INTEGER | 常に `1`（シングルトン制約） |
| `focus_minutes` | INTEGER | 集中時間（分） |
| `short_break_minutes` | INTEGER | 短休憩時間（分） |
| `long_break_minutes` | INTEGER | 長休憩時間（分） |
| `long_break_interval` | INTEGER | 長休憩までのセッション数 |
| `updated_at` | TEXT | 最終更新日時（ISO 8601） |

レコードが存在しない場合、`fetch_settings()` は `AppSettings.defaults()` のデフォルト値を返します。  
保存は `INSERT OR REPLACE`（UPSERT）で行われます。

---

### sessions テーブル

完了したポモドーロセッションを蓄積します。

````sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    planned_seconds INTEGER NOT NULL,
    actual_seconds INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    completed INTEGER NOT NULL
)
````

| カラム | 型 | 説明 |
|---|---|---|
| `id` | INTEGER | 自動採番の主キー |
| `mode` | TEXT | `focus` / `short_break` / `long_break` |
| `planned_seconds` | INTEGER | 予定秒数 |
| `actual_seconds` | INTEGER | 実経過秒数 |
| `started_at` | TEXT | 開始日時（ISO 8601） |
| `ended_at` | TEXT | 終了日時（ISO 8601） |
| `completed` | INTEGER | 完了フラグ（`1` = 完了、`0` = 未完了） |

`completed` カラムは SQLite の制約上 INTEGER として保存されますが、Python 側では `bool` として扱われます（保存時に `int()` で変換）。

統計取得時は `ended_at` の範囲でフィルタリングされます。

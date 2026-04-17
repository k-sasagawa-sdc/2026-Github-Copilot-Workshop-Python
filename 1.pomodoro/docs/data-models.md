# データモデル仕様

## 現状（Phase 1 MVP）

現在の実装ではデータの永続化は行われておらず、バックエンド側のデータモデルは存在しない。
タイマー状態はすべてブラウザ側のJavaScriptメモリ上で管理される。

---

## フロントエンド上の状態モデル

### タイマー状態（`TIMER_STATUS`）

`timer.js` 内で定義されているタイマーの状態。

| 値        | 説明                           |
| --------- | ------------------------------ |
| `idle`    | タイマーが停止または未開始     |
| `running` | タイマーが動作中               |
| `paused`  | タイマーが一時停止中           |

### タイマー内部状態

`createCountdownTimer()` が管理する内部変数。

| 変数               | 型       | 説明                               |
| ------------------ | -------- | ---------------------------------- |
| `status`           | string   | 現在のタイマー状態（`TIMER_STATUS`） |
| `startedAtMs`      | number \| null | タイマー開始時のタイムスタンプ（ms） |
| `remainingSeconds` | number   | 残り時間（秒）                     |
| `intervalId`       | number \| null | `setInterval` のID          |
| `durationSeconds`  | number   | タイマー全体の時間（秒）。初期値はHTMLの `data-focus-seconds` 属性から取得（デフォルト: `1500`） |

---

## 将来のデータモデル（未実装）

以下のテーブルは設計上計画されているが、現時点では未実装である。

### `settings` テーブル

| カラム名                | 型      | 説明                           |
| ----------------------- | ------- | ------------------------------ |
| `focus_minutes`         | integer | 作業時間（分）                 |
| `short_break_minutes`   | integer | 短休憩時間（分）               |
| `long_break_minutes`    | integer | 長休憩時間（分）               |
| `long_break_interval`   | integer | 長休憩に入るまでの作業回数     |
| `updated_at`            | datetime | 最終更新日時                  |

### `sessions` テーブル

| カラム名           | 型       | 説明                                      |
| ------------------ | -------- | ----------------------------------------- |
| `id`               | integer  | セッションID                              |
| `type`             | string   | セッション種別（`focus` / `short_break` / `long_break`） |
| `planned_seconds`  | integer  | 予定時間（秒）                            |
| `actual_seconds`   | integer  | 実績時間（秒）                            |
| `started_at`       | datetime | 開始日時                                  |
| `ended_at`         | datetime | 終了日時                                  |
| `completed`        | boolean  | セッションが正常完了したかどうか          |

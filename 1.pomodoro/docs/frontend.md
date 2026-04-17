# フロントエンドモジュール仕様

Pomodoro タイマーアプリのフロントエンドは、責務ごとに分割された JavaScript モジュールで構成されます。

---

## モジュール概要

| ファイル | グローバル変数 | 役割 |
|---|---|---|
| `state-machine.js` | `window.PomodoroStateMachine` | ポモドーロ状態機械 |
| `timer.js` | `window.PomodoroTimer` | カウントダウンタイマーエンジン |
| `ui.js` | `window.PomodoroUi` | DOM 更新コントローラー |
| `storage.js` | `window.PomodoroStorage` | API 通信・ローカルストレージ管理 |
| `app.js` | — | エントリーポイント・モジュール連携 |

スクリプトは `index.html` に `defer` 属性付きで読み込まれます。

---

## state-machine.js

**グローバル変数**: `window.PomodoroStateMachine`

ポモドーロタイマーの状態と遷移ルールを管理する有限状態機械です。

### モード定義

| 定数 | 値 | 説明 |
|---|---|---|
| `MODES.focus` | `"focus"` | 集中セッション |
| `MODES.shortBreak` | `"short_break"` | 短休憩 |
| `MODES.longBreak` | `"long_break"` | 長休憩 |

### 状態定義

| 定数 | 値 | 説明 |
|---|---|---|
| `STATES.idle` | `"idle"` | 待機中 |
| `STATES.paused` | `"paused"` | 一時停止中 |
| `STATES.focusRunning` | `"focus_running"` | 集中セッション実行中 |
| `STATES.shortBreakRunning` | `"short_break_running"` | 短休憩実行中 |
| `STATES.longBreakRunning` | `"long_break_running"` | 長休憩実行中 |

### `createPomodoroStateMachine(options)`

**引数**

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `options.longBreakInterval` | number | `4` | 長休憩までの集中セッション数 |

**戻り値のメソッド**

| メソッド | 説明 |
|---|---|
| `dispatch(eventName)` | イベントを送信して状態を遷移させる。現在の状態を返す |
| `getMode()` | 現在のモード（`focus` / `short_break` / `long_break`）を返す |
| `getState()` | 現在の状態文字列を返す |
| `isRunning()` | タイマーが実行中かどうかを返す |
| `getCompletedFocusSessions()` | 完了した集中セッション数を返す |
| `setLongBreakInterval(n)` | 長休憩間隔を動的に変更する |

**受け付けるイベント**

| イベント | 遷移条件 | 説明 |
|---|---|---|
| `start` | `idle` → `focus_running` | タイマーを開始する |
| `pause` | `*_running` → `paused` | タイマーを一時停止する |
| `resume` | `paused` → `*_running` | タイマーを再開する |
| `complete` | `*_running` → 次のモードの `*_running` | セッション完了、次モードへ遷移 |
| `skip` | `*_running` / `paused` → 次のモードの `*_running` | 現在のセッションをスキップ |
| `reset` | 任意 → `idle` | フォーカスモードの待機状態へリセット |

**次モード決定ロジック**

- 現在のモードが `focus` の場合: 完了した集中セッション数が `longBreakInterval` の倍数なら `long_break`、それ以外は `short_break`
- 現在のモードが `short_break` または `long_break` の場合: `focus`

---

## timer.js

**グローバル変数**: `window.PomodoroTimer`

カウントダウンタイマーのエンジンです。`setInterval` ベースですが、残り時間は開始時刻と現在時刻の差分から再計算するため、ブラウザの非アクティブ化から復帰した際も正確な時間を維持します。

### `createCountdownTimer(options)`

**引数**

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `options.durationSeconds` | number | 必須 | 初期タイマー時間（秒） |
| `options.onTick` | function | `() => {}` | 毎秒呼ばれるコールバック。引数: `remainingSeconds` |
| `options.onComplete` | function | `() => {}` | タイマー完了時のコールバック |

**戻り値のメソッド**

| メソッド | 説明 |
|---|---|
| `start()` | タイマーを開始する（実行中の場合は無視） |
| `pause()` | タイマーを一時停止する |
| `resume()` | 一時停止中のタイマーを再開する |
| `reset()` | タイマーを初期状態に戻す（`onTick` を呼び出す） |
| `setDuration(seconds)` | タイマー時間を設定してリセットする |
| `getDurationSeconds()` | 設定されたタイマー時間（秒）を返す |
| `getRemainingSeconds()` | 残り時間（秒）を返す |
| `getStatus()` | 現在のステータス（`"idle"` / `"running"` / `"paused"`）を返す |
| `sync()` | 実行中の場合、現在時刻から残り時間を再計算して `onTick` を呼び出す |

### `formatRemainingTime(totalSeconds)`

秒数を `"MM:SS"` 形式の文字列に変換します。

````javascript
formatRemainingTime(1500) // => "25:00"
formatRemainingTime(65)   // => "01:05"
````

---

## ui.js

**グローバル変数**: `window.PomodoroUi`

DOM 要素の更新を担当するコントローラーです。

### `createUiController(elements)`

DOM 要素のマップを受け取り、UI 更新メソッドを持つオブジェクトを返します。

**引数**

`elements` は `app.js` の `findTimerElements()` が返す DOM 要素のマップです。

**戻り値のメソッド**

| メソッド | 説明 |
|---|---|
| `renderTime(textValue)` | タイマー表示（`#timer-display`）を更新する |
| `renderMode(mode)` | モード名・説明・`body[data-mode]` を更新する |
| `renderState(state)` | 状態テキスト・ボタン有効/無効を更新する |
| `renderProgress(remainingSeconds, durationSeconds)` | プログレスリングと進捗パーセントを更新する |
| `renderCycle(completedFocusSessions, interval)` | 完了セッション数・長休憩までの残りを更新する |
| `renderSettings(settings)` | 設定フォームの入力値を更新する |
| `renderSettingsStatus(message, isError)` | 設定保存のステータスメッセージを表示する |
| `renderStats(stats)` | 統計（今日・今週の完了数・集中時間・週間サマリー）を更新する |
| `renderStatus(message)` | スクリーンリーダー向けのライブリージョンにメッセージを設定する |

**ボタン有効/無効ルール**

| ボタン | 有効な状態 |
|---|---|
| 開始ボタン | `idle` または `paused` |
| 一時停止ボタン | `*_running`（`_running` で終わる状態） |
| スキップボタン | `idle` 以外 |
| リセットボタン | `idle` 以外 |

開始ボタンのラベルは `paused` 状態のとき「再開」、それ以外は「開始」と表示されます。

---

## storage.js

**グローバル変数**: `window.PomodoroStorage`

Flask API との通信と localStorage への設定キャッシュを管理します。

### 設定管理

| メソッド | 説明 |
|---|---|
| `readInitialSettings()` | ページに埋め込まれた `#initial-settings` JSON を読む（フォールバック: デフォルト値） |
| `loadSettings()` | `/api/settings` から設定を取得し、localStorage にキャッシュする。API 失敗時は localStorage → `#initial-settings` の順でフォールバック |
| `saveSettings(settings)` | クライアント側バリデーション後、localStorage と `/api/settings`（PUT）に保存する |
| `loadLocalSettings()` | localStorage から設定を読む |
| `saveLocalSettings(settings)` | localStorage に設定を保存する |
| `validateSettings(settings)` | クライアント側バリデーションを行い、エラーオブジェクトを返す |

### セッション・統計管理

| メソッド | 説明 |
|---|---|
| `saveSession(session)` | `/api/sessions`（POST）にセッションデータを送信する |
| `loadStats(today)` | `/api/stats?today=<date>` から統計を取得する。失敗時は `#initial-stats` にフォールバック |
| `readInitialStats()` | ページに埋め込まれた `#initial-stats` JSON を読む |

### localStorage キー

| キー | 値 |
|---|---|
| `pomodoro-settings` | 設定オブジェクトの JSON |

---

## app.js（エントリーポイント）

`DOMContentLoaded` イベント後に各モジュールを初期化し、イベントリスナーを登録します。

### 初期化フロー

1. 各モジュールの API を取得
2. `readInitialSettings()` / `readInitialStats()` で初期値を同期的に取得
3. `createPomodoroStateMachine()` で状態機械を生成
4. `createCountdownTimer()` でタイマーを生成
5. `createUiController()` で UI コントローラーを生成
6. ボタンとフォームにイベントリスナーを登録
7. `loadSettings()` / `loadStats()` で非同期に最新データを取得して表示を更新

### イベントハンドラー

| 要素 | イベント | 処理 |
|---|---|---|
| 開始ボタン | `click` | `idle` → タイマー開始、`paused` → タイマー再開 |
| 一時停止ボタン | `click` | タイマーを一時停止 |
| スキップボタン | `click` | 現在のセッションをスキップして次のモードへ |
| リセットボタン | `click` | フォーカスモードの待機状態へリセット |
| 設定フォーム | `submit` | 設定を保存し、タイマーと UI を更新 |
| `document` | `visibilitychange` | ページ復帰時に `timer.sync()` を呼び出して時刻を補正 |

### 通知機能

セッション完了時に以下を実行します。

- Web Audio API で短い完了音（660 Hz / 0.18 秒）を再生
- Notification API でブラウザ通知を送信（権限がある場合）

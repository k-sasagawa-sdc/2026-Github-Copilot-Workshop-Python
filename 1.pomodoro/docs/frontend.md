# フロントエンドモジュール仕様

## 概要

フロントエンドはバニラJavaScriptで実装されており、ビルドツールは使用しない。
責務に応じて `timer.js`（タイマーエンジン）と `app.js`（UI制御）に分割されている。

---

## `static/js/timer.js`

タイマーの核となるエンジンモジュール。`window.PomodoroTimer` としてグローバルに公開される。
Node.js環境では `module.exports` としてエクスポートされるため、テストから利用可能。

### 公開API（`window.PomodoroTimer`）

| 関数名                     | 説明                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `formatRemainingTime(totalSeconds)` | 秒数を `MM:SS` 形式の文字列に変換する          |
| `calculateRemainingSeconds({durationSeconds, startedAtMs, nowMs})` | 開始時刻と現在時刻の差分から残り時間（秒）を計算する |
| `createCountdownTimer(options)` | カウントダウンタイマーオブジェクトを生成して返す    |

### `createCountdownTimer(options)`

**パラメータ**

| オプション          | 型       | デフォルト値            | 説明                                      |
| ------------------- | -------- | ----------------------- | ----------------------------------------- |
| `durationSeconds`   | number   | （必須）                | タイマーの全体時間（秒）                  |
| `now`               | function | `() => Date.now()`      | 現在時刻を返す関数（テスト用に差し替え可）|
| `onTick`            | function | `() => {}`              | 1秒ごとに呼ばれるコールバック。引数: `remainingSeconds` |
| `scheduleRepeating` | function | `setInterval` ラッパー  | インターバルのスケジューリング関数        |
| `cancelRepeating`   | function | `clearInterval` ラッパー | インターバルのキャンセル関数             |

**戻り値**

タイマーオブジェクト（以下のメソッドを持つ）：

| メソッド              | 説明                                                          |
| --------------------- | ------------------------------------------------------------- |
| `start()`             | タイマーを開始する。すでに `running` の場合は無視する        |
| `pause()`             | タイマーを一時停止する。`running` でない場合は無視する       |
| `getRemainingSeconds()` | 現在の残り時間（秒）を返す                                 |
| `getStatus()`         | 現在のステータス（`idle` / `running` / `paused`）を返す      |

**タイマーの動作**

1. `start()` が呼ばれると、開始時刻（`startedAtMs`）を記録し、`setInterval`（1000ms）を開始する
2. 各tickで `now() - startedAtMs` から経過時間を計算し、残り時間を更新する
3. `onTick(remainingSeconds)` を呼び出す
4. 残り時間が `0` になると、インターバルを停止しステータスを `idle` に戻す
5. `pause()` が呼ばれると、残り時間を確定してインターバルを停止し、ステータスを `paused` に変更する

> **注意:** `pause()` 後に `start()` を呼んでも、残り時間は `durationSeconds` からリセットされる（再開機能は未実装）。

---

## `static/js/app.js`

DOMとタイマーエンジンを接続するアプリケーション初期化モジュール。

### 関数

#### `findTimerElements()`

DOMから必要な要素を取得して返す。

| 取得する要素ID  | 変数名         |
| --------------- | -------------- |
| `timer-display` | `timerDisplay` |
| `start-button`  | `startButton`  |
| `pause-button`  | `pauseButton`  |

いずれかの要素が見つからない場合は `null` を返す。

#### `renderRemainingTime(timerDisplay, formatRemainingTime, remainingSeconds)`

`timerDisplay.textContent` を `formatRemainingTime(remainingSeconds)` の結果で更新する。

#### `bindTimerControls({ timer, startButton, pauseButton })`

ボタンにクリックイベントを登録する。

| ボタン        | 呼ばれるメソッド |
| ------------- | ---------------- |
| `startButton` | `timer.start()`  |
| `pauseButton` | `timer.pause()`  |

### 初期化処理（`DOMContentLoaded`）

1. `window.PomodoroTimer` と DOM要素の存在を確認する
2. `timerDisplay.dataset.focusSeconds`（デフォルト: `1500`）からタイマー時間を取得する
3. `createCountdownTimer()` でタイマーを生成する（`onTick` にrender関数を設定）
4. 初期表示として `render(focusSeconds)` を呼ぶ
5. `bindTimerControls()` でボタンイベントを登録する

---

## `templates/index.html`

### タイマー設定値

`#timer-display` 要素の `data-focus-seconds` 属性でフォーカス時間（秒）を設定する。

```html
<p id="timer-display" data-focus-seconds="1500">25:00</p>
```

現在の値: `1500`（= 25分）

### 操作ボタン

| ボタンID        | ラベル     | 機能         |
| --------------- | ---------- | ------------ |
| `start-button`  | 開始       | タイマー開始 |
| `pause-button`  | 一時停止   | 一時停止     |
| `reset-button`  | リセット   | （未実装）   |

> **注意:** `reset-button` はHTMLに存在するが、`app.js` にはイベントハンドラが登録されておらず、現在は機能しない。

---

## `static/css/style.css`

### CSSカスタムプロパティ（テーマカラー）

| 変数名           | 値          | 用途                   |
| ---------------- | ----------- | ---------------------- |
| `--bg`           | `#f6efe5`   | 背景色                 |
| `--panel`        | `#fffaf4`   | カード・パネル背景色   |
| `--text`         | `#1f2933`   | テキスト色             |
| `--accent`       | `#c8553d`   | アクセントカラー（ボタン・ラベル） |
| `--accent-soft`  | `#efc8b1`   | ソフトアクセント（サブボタン） |

### レイアウト

- **2カラムグリッド**: ヒーローパネル（最大360px）+ タイマーパネル
- **タイマーパネル**: タイマーカード（2行スパン）+ 設定パネル + 統計パネル
- **レスポンシブ**: 640px以下で1カラムに切り替わる

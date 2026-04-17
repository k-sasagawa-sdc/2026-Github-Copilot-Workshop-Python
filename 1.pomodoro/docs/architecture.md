# アーキテクチャ概要

Pomodoro タイマーアプリの現在の実装アーキテクチャを説明します。

---

## 全体構成

Flask をバックエンド、HTML/CSS/JavaScript をフロントエンドとして構成する Web アプリケーションです。

- **サーバーサイド**: Flask でサーバーレンダリングを行い、API を提供
- **クライアントサイド**: JavaScript でタイマー動作・UI 更新を処理
- **データベース**: SQLite でセッション記録・設定を永続化

---

## ディレクトリ構成

````text
1.pomodoro/
  app.py                        # Flask アプリケーションファクトリー・ルーティング
  models/
    session.py                  # セッションレコードモデル・バリデーション
    settings.py                 # アプリ設定モデル・バリデーション
  repositories/
    database.py                 # DB 接続・テーブル初期化
    session_repository.py       # セッションの保存・取得
    settings_repository.py      # 設定の保存・取得
  services/
    stats_service.py            # 統計集計ロジック
  static/
    css/
      style.css                 # スタイルシート
    js/
      app.js                    # エントリーポイント・イベント登録
      state-machine.js          # ポモドーロ状態機械
      timer.js                  # カウントダウンタイマーエンジン
      ui.js                     # DOM 更新コントローラー
      storage.js                # API 通信・ローカルストレージ管理
  templates/
    index.html                  # メイン画面テンプレート
  instance/
    pomodoro.db                 # SQLite データベース（実行時生成）
````

---

## レイヤー設計

### Presentation 層（フロントエンド）

- `templates/index.html`: Jinja2 テンプレートでページ構造を定義
- `static/css/style.css`: スタイル定義
- `static/js/`: タイマー操作・UI 更新を担当する JavaScript モジュール群

### Application 層（Flask ルーティング）

- `app.py` の `create_app()` 関数がアプリケーションファクトリーとして機能
- 各 API エンドポイントがリクエストのバリデーションと処理の呼び出しを行う

### Domain 層（モデル）

- `models/session.py`: セッションデータの型定義・バリデーションルール
- `models/settings.py`: 設定データの型定義・デフォルト値・バリデーションルール

### Infrastructure 層（リポジトリ・サービス）

- `repositories/`: SQLite への読み書きを抽象化
- `services/stats_service.py`: セッションデータから統計を集計

---

## データフロー

### 画面初期表示

```
ブラウザ → GET / → app.py
  → fetch_settings() → settings_repository
  → build_stats() → stats_service / session_repository
  → render_template("index.html", initial_settings, initial_stats)
```

初期設定・初期統計は `<script type="application/json">` タグに埋め込まれ、JS がサーバーへのリクエストなしに即時表示する。

### セッション完了時

```
タイマー完了 → storage.js:saveSession()
  → POST /api/sessions → app.py → session_repository → SQLite
  → storage.js:loadStats() → GET /api/stats → stats_service → UI 更新
```

### 設定変更時

```
設定フォーム送信 → storage.js:saveSettings()
  → クライアントバリデーション
  → PUT /api/settings → app.py → settings_repository → SQLite
  → ローカルストレージにも保存（オフライン対応）
```

---

## 設定の永続化戦略

設定は二重化して保存されます。

1. **サーバー側（SQLite）**: `settings` テーブルに保存（`id = 1` の単一レコード）
2. **クライアント側（localStorage）**: キー `pomodoro-settings` で保存

API リクエストが失敗した場合はローカルストレージの値を、それも存在しない場合はサーバーサイドレンダリング時の初期値を使用します。

---

## アプリケーション起動

````python
# アプリケーションファクトリー
app = create_app()

# ローカル開発
if __name__ == "__main__":
    app.run(debug=True)
````

`create_app()` 呼び出し時に `initialize_database()` が実行され、`instance/pomodoro.db` にテーブルが作成されます（既存の場合はスキップ）。

カスタム設定は `create_app(config={...})` で渡すことができます（主にテスト用途）。

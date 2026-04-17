# API リファレンス

## 概要

現在の実装は **Phase 1 MVP** であり、Flask はHTML画面の配信のみを担当している。
REST API エンドポイントはまだ実装されていない。

---

## 実装済みエンドポイント

### `GET /`

メイン画面を返す。

**レスポンス**

- ステータスコード: `200 OK`
- Content-Type: `text/html`
- レンダリングテンプレート: `templates/index.html`
- テンプレート変数:
  - `page_title`: `"Pomodoro Timer App"`

**例**

```
GET / HTTP/1.1
Host: localhost:5000
```

---

## 未実装エンドポイント（将来計画）

以下のエンドポイントは設計上計画されているが、現時点では未実装である。

| メソッド | パス             | 概要                   |
| -------- | ---------------- | ---------------------- |
| GET      | `/api/settings`  | タイマー設定を取得する |
| PUT      | `/api/settings`  | タイマー設定を更新する |
| POST     | `/api/sessions`  | セッション記録を保存する |
| GET      | `/api/stats`     | 統計データを取得する   |

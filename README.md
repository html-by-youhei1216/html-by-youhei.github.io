# HTML Playground

**HTML Playground** は、HTMLを楽しく学べる日本語対応の **Web学習アプリ** です。ブラウザを開くだけで、Swift Playgrounds のようなステップ形式の学習体験ができます。

![Platform](https://img.shields.io/badge/platform-Web-blue)
![Language](https://img.shields.io/badge/UI-日本語-red)
![License](https://img.shields.io/badge/license-MIT-green)

## 特徴

- **ブラウザですぐ使える** — インストール不要、PC・タブレット・スマホ対応
- **完全日本語UI** — レッスン、ヘルプ、エラーメッセージすべて日本語
- **12章の内蔵レッスン** — 解説・練習・クイズ付き
- **リアルタイムプレビュー** — 入力と同時に更新（PC / タブレット / スマホ表示）
- **HTMLエディタ** — シンタックスハイライト、行番号、タグ補完、コード整形
- **練習問題** — 自動採点、ヒント機能（初級・中級・上級）
- **進捗保存** — ブラウザの localStorage に自動保存

## 使い方

### Webアプリ（メイン）

1. [Netlify](https://app.netlify.com/) にデプロイ、またはローカルで `public` フォルダを配信
2. **`/app.html`** を開く
3. サイドバーからレッスン・エディタ・練習問題を選んで学習開始

ローカル確認:

```bash
cd public
python3 -m http.server 8080
# http://localhost:8080/app.html を開く
```

### macOS アプリ（オプション）

`HTMLPlayground/` フォルダに Xcode プロジェクトも含まれています。

```bash
open HTMLPlayground/HTMLPlayground.xcodeproj
```

## プロジェクト構成

```
html学習/
├── netlify.toml              # Netlify 設定
├── public/                   # 公開ディレクトリ
│   ├── index.html            # ランディングページ
│   ├── app.html              # Webアプリ本体 ★
│   ├── css/
│   │   ├── style.css         # ランディング用
│   │   └── app.css           # アプリ用
│   ├── js/
│   │   ├── main.js           # ランディング用
│   │   └── app/              # Webアプリ（ES Modules）
│   │       ├── main.js       # ルーター
│   │       ├── views.js      # 各画面
│   │       ├── storage.js    # 進捗・プロジェクト保存
│   │       ├── utils.js      # HTML整形・採点
│   │       └── editor.js     # エディタ・プレビュー
│   └── data/                 # レッスンJSON（12章）
│       ├── lessons.json
│       ├── exercises.json
│       └── snippets.json
└── HTMLPlayground/           # macOS ネイティブ版（オプション）
```

## Netlify で公開

1. GitHub に push
2. Netlify → **Import an existing project**
3. 設定（`netlify.toml` で自動検出）:
   - **Publish directory:** `public`
4. **Deploy**

公開 URL:
- `/` — ランディングページ
- `/app.html` または `/app` — **HTML Playground Webアプリ**

## 内蔵レッスン（全12章）

| 章 | タイトル | 難易度 |
|----|---------|--------|
| 1 | HTMLとは | 初級 |
| 2 | HTML文書の基本構造 | 初級 |
| 3 | 見出しタグ | 初級 |
| 4 | 段落タグ | 初級 |
| 5 | リンク | 初級 |
| 6 | 画像 | 初級 |
| 7 | リスト | 中級 |
| 8 | 表 | 中級 |
| 9 | フォーム | 中級 |
| 10 | セマンティックHTML | 中級 |
| 11 | アクセシビリティ | 上級 |
| 12 | レスポンシブデザイン入門 | 上級 |

## 技術仕様

- **HTML / CSS / JavaScript**（Vanilla JS、ES Modules）
- **localStorage** — 進捗・プロジェクト・設定の永続化
- **iframe srcdoc** — リアルタイム HTML プレビュー
- **Netlify** — 静的ホスティング

## ライセンス

MIT License

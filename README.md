# GitHub アップロード用フォルダ

このフォルダの**中身すべて**を GitHub リポジトリのルートにアップロードしてください。

## フォルダ構成

```
upload/                          ← このフォルダの中身を GitHub へ
├── README.md                    ← この説明書
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy-pages.yml     ← 自動デプロイ設定
└── docs/                        ← Webサイト本体（GitHub Pages）
    ├── .nojekyll                ← 必須（Jekyll 無効化）
    ├── index.html               ← トップページ
    ├── app.html                 ← HTML Playground アプリ ★
    ├── css/
    ├── js/
    ├── data/
    └── images/
```

## アップロード手順

### 方法A: GitHub ウェブサイト（ドラッグ＆ドロップ）

1. [GitHub](https://github.com/) で新しいリポジトリを作成
2. **「uploading an existing file」** をクリック
3. **`upload` フォルダの中身**（`.github`、`docs`、`.gitignore`）をドラッグ＆ドロップ  
   ※ `upload` フォルダ自体ではなく、**中身**をアップロード
4. **Commit changes**

### 方法B: ターミナル（git）

```bash
cd upload
git init
git add .
git commit -m "Initial commit: HTML Playground"
git branch -M main
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git push -u origin main
```

## GitHub Pages の設定

1. リポジトリ → **Settings** → **Pages**
2. **Source:** **GitHub Actions** を選択
3. **Actions** タブで「Deploy GitHub Pages」が成功するのを待つ（1〜3分）

## 公開 URL

リポジトリ名が `html-playground` の場合:

| ページ | URL |
|--------|-----|
| トップ | `https://ユーザー名.github.io/html-playground/` |
| アプリ | `https://ユーザー名.github.io/html-playground/app.html` |

## 注意

- **`docs/.nojekyll`** は削除しないでください
- リポジトリのルートに `docs/` フォルダがある構成にしてください
- macOS アプリ（`HTMLPlayground/`）はこのフォルダに含まれていません（Web版のみ）

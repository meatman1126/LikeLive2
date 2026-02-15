# ブログ作成・編集画面 実装ドキュメント

## 概要

ブログの作成画面（`create/page.tsx`）と編集画面（`edit/[id]/page.tsx`）は、**note.com のエディタ UI を参考にした、執筆に集中できるミニマルなデザイン**で実装されている。従来のフォーム型レイアウトから、ヘッダーバー + 執筆エリア + 公開設定パネル（ドロワー）の 3 ゾーン構成に刷新した。

---

## ファイル構成

```
likelive2/src/app/blog/
├── create/
│   └── page.tsx              # ブログ新規作成画面
├── edit/
│   └── [id]/
│       └── page.tsx          # ブログ編集画面
└── README.md                 # 本ドキュメント

likelive2/src/app/components/
├── TiptapEditor.tsx          # Tiptap リッチテキストエディタ
├── tiptap.css                # TiptapEditor のスタイル
├── ThumbnailCropper.tsx      # サムネイル画像クロップコンポーネント
└── BlogContentRenderer.tsx   # ブログ本文の閲覧用レンダラー

likelive2/src/app/actions/
├── blog-actions.ts           # ブログ関連の Server Actions
├── user-actions.ts           # getMyArtistsAction() を含む
├── file-actions.ts           # saveFileAction() ファイルアップロード
└── index.ts                  # Actions のバレルエクスポート

prisma/schema.prisma          # Blog, BlogArtist, Artist モデル定義
```

---

## UI アーキテクチャ

### 3 ゾーン構成

```
┌──────────────────────────────────────────────────┐
│  ← 戻る                        下書き保存  [公開] │ ← ヘッダーバー (sticky top-0 z-30)
├──────────────────────────────────────────────────┤
│                                                  │
│  タイトル (text-2xl md:text-3xl, ボーダーなし)      │ ← 執筆エリア (max-w-3xl 中央配置)
│  ──────────────────────                          │
│  TiptapEditor (本文)                              │
│                                                  │
└──────────────────────────────────────────────────┘

「公開」ボタン押下 → 公開設定パネルがスライドイン

┌────────────────────┐
│  公開設定      [×]  │ ← パネルヘッダー
│                    │
│  サムネイル画像     │ ← パネルコンテンツ (overflow-y-auto)
│  カテゴリ          │
│  関連アーティスト   │
│                    │
│  [公開する]        │ ← パネルフッター (border-t 固定)
│  [下書き保存]      │
└────────────────────┘
```

### レスポンシブ対応

| 要素 | PC (md 以上) | SP (md 未満) |
|------|-------------|-------------|
| ヘッダー戻るボタン | `← 戻る` (アイコン+テキスト) | `←` (アイコンのみ) |
| ヘッダー下書き保存 | 表示 (`hidden md:inline-flex`) | 非表示 (パネル内で操作) |
| タイトルフォント | `text-3xl` | `text-2xl` |
| 執筆エリアパディング | `py-12` | `py-8` |
| 公開設定パネル | 右ドロワー `md:w-[420px]` | フルスクリーン `w-full` |

---

## 主要コンポーネントの役割

### ヘッダーバー

- **sticky 配置**: `sticky top-0 z-30` で常に画面上部に固定
- **半透明背景**: `bg-white/95 backdrop-blur` でスクロール時にコンテンツが透ける
- **左側**: 戻るリンク (作成画面: `/me`、編集画面: `/blog/${blogId}`)
- **右側**: 「下書き保存」ボタン (PC のみ、直接保存) + 「公開」ボタン (パネルを開く)

### 執筆エリア

- **タイトル**: `<textarea>` で自動リサイズ、ボーダーなし、大きなフォント、プレースホルダーのみで誘導
- **区切り線**: タイトルと本文を `h-px bg-gray-200` で視覚的に分離
- **TiptapEditor**: ラベルなしで直接配置。ツールバー + BubbleMenu + 画像アップロード機能

### 公開設定パネル (ドロワー)

- **トリガー**: ヘッダーの「公開」ボタン押下で `isSettingsPanelOpen = true`
- **アニメーション**: `translate-x-full` ↔ `translate-x-0` (duration-300 ease-in-out)
- **オーバーレイ**: `bg-black/30` の半透明背景、クリックでパネルを閉じる
- **スクロールロック**: パネル表示中は `document.body.style.overflow = "hidden"`
- **パネル構造**: ヘッダー (タイトル+閉じるボタン) / コンテンツ (スクロール可能) / フッター (アクションボタン、border-t 固定)

---

## 状態管理

### 作成画面 (create/page.tsx) の state

| state | 型 | 用途 |
|-------|----|------|
| `title` | `string` | 記事タイトル |
| `category` | `"DIARY" \| "REPORT" \| "OTHER"` | カテゴリ |
| `relatedArtists` | `any[]` | 選択済み関連アーティスト |
| `availableArtists` | `any[]` | 選択可能なアーティスト |
| `selectedImage` | `string \| null` | クロップ前の画像 Data URL |
| `croppedImageUrl` | `string \| null` | クロップ済み画像 URL |
| `thumbnailPreview` | `string \| null` | サムネイルプレビュー表示用 URL |
| `thumbnailFile` | `File \| null` | 未クロップのサムネイルファイル |
| `isSettingsPanelOpen` | `boolean` | 公開設定パネルの開閉状態 |
| `isCategoryOpen` | `boolean` | カテゴリドロップダウンの開閉 |
| `isArtistDropdownOpen` | `boolean` | アーティストドロップダウンの開閉 |
| `isPending` | `boolean` (useTransition) | 保存処理中フラグ |

### 編集画面 (edit/[id]/page.tsx) の追加 state

| state | 型 | 用途 |
|-------|----|------|
| `blogId` | `number \| null` | 編集対象ブログの ID |
| `contentJson` | `unknown` | 既存コンテンツの JSON (TiptapEditor に渡す) |
| `status` | `"DRAFT" \| "PUBLISHED" \| "ARCHIVED"` | 現在のブログステータス |
| `existingThumbnail` | `string \| null` | 既存のサムネイル URL |
| `isLoading` | `boolean` | 初期データ読み込み中フラグ |

---

## データフロー

### ブログ作成フロー

```
1. ページ表示 → getMyArtistsAction() でアーティスト一覧を取得
2. ユーザーがタイトル・本文を入力
3. 「公開」ボタン → 公開設定パネルが開く
4. パネルでサムネイル・カテゴリ・関連アーティストを設定
5. 「公開する」or「下書き保存」ボタン:
   a. croppedImageUrl があれば → fetch → blob → File → saveFileAction() でアップロード
   b. editorRef.current.getJSON() でコンテンツ取得
   c. createBlogAction() で保存
   d. router.push("/me") で遷移
```

### ブログ編集フロー

```
1. ページ表示 → Promise.all([getBlogByIdAction(), getMyArtistsAction()])
2. 既存データを各 state にセット、TiptapEditor に content を渡す
3. ユーザーが編集
4. 「更新/公開」ボタン → 公開設定パネル
5. パネルで設定を確認・変更
6. アクションボタン（ステータスにより異なる）:
   - DRAFT/ARCHIVED: 「公開する」/「下書き保存」
   - PUBLISHED: 「更新する」/「公開を停止」
7. updateBlogAction() or unpublishBlogAction() で保存
8. router.push(`/blog/${blogId}`) で遷移
```

### アーティスト選択のデータ管理

`relatedArtists`（選択済み）と `availableArtists`（未選択）の 2 配列で管理。アーティストは追加時に `availableArtists` → `relatedArtists` へ移動、削除時はその逆。ドロップダウンには `availableArtists` のみ表示。

---

## カスタムドロップダウンの実装方針

ネイティブの `<select>` 要素はブラウザ間でスタイルの差異が大きく、SP でのドロップダウン位置ずれや文字サイズの問題があったため、カテゴリ選択とアーティスト選択の両方でカスタムドロップダウンを使用している。

- **カテゴリ**: 選択中の項目にチェックマーク表示、`py-3` で十分なタップ領域
- **アーティスト**: 画像 + 名前を表示、選択でドロップダウンを閉じて一覧に追加
- **外側クリックで閉じる**: `useRef` + `document.addEventListener("mousedown")` で実装

---

## 依存コンポーネント詳細

### TiptapEditor

- **ファイル**: `src/app/components/TiptapEditor.tsx` + `tiptap.css`
- **ライブラリ**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`
- **アイコン**: `@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons`
- **機能**: 固定ツールバー (Undo/Redo, Bold, Italic, Underline, Strike, Code, H1-H3, Lists, Blockquote, HR, Image) + BubbleMenu (テキスト選択時) + 画像アップロード
- **ref 経由アクセス**: `useImperativeHandle` で `editor` インスタンスを公開、親から `ref.current?.getJSON()` でコンテンツ取得
- **コンテンツ形式**: Tiptap JSON (ProseMirror 準拠)。保存時に `JSON.stringify()` で文字列化

### ThumbnailCropper

- **ファイル**: `src/app/components/ThumbnailCropper.tsx`
- **ライブラリ**: `react-easy-crop`, `@mui/material` (Slider)
- **固定アスペクト比**: 16:9
- **出力**: `getCroppedImg()` ユーティリティで blob URL を生成し `onCropComplete` コールバックで親に返す

---

## DB モデル (参考)

```prisma
model Blog {
  id              Int          @id @default(autoincrement())
  title           String       @db.VarChar(255)
  content         Json
  status          BlogStatus   // DRAFT | PUBLISHED | ARCHIVED
  category        BlogCategory // DIARY | REPORT | OTHER
  authorId        Int
  thumbnailUrl    String?
  viewCount       Int          @default(0)
  likeCount       Int          @default(0)
  commentCount    Int          @default(0)
  // ... timestamps, relations
}

model BlogArtist {
  id       Int
  blogId   Int
  artistId String
  // blog: Blog, artist: Artist
}

model Artist {
  id       String   @id  // Spotify ID
  name     String?
  imageUrl String?
}
```

---

## デザイン方針と意思決定の経緯

### 1. note.com 参考の 3 ゾーン構成を採用した理由

**問題**: 従来のカード型フォーム（shadow-md の白いカードにすべてのフィールドを縦積み）は、記事作成画面というより管理画面のフォームに見え、執筆への集中を妨げていた。

**決定**: note.com のエディタ UI を参考に「執筆エリアには最小限のもの（タイトル + 本文）のみ配置し、設定項目は公開設定パネルに分離する」という構成を採用した。

### 2. ラジオボタンではなくボタンで公開/下書きを選択する設計

**問題**: 公開設定にラジオボタンを使用すると、「ステータスを選択してからボタンを押す」2 段階操作になり冗長。

**決定**: ラジオボタンを廃止し、「公開する」「下書き保存」をそれぞれ独立したボタンとして配置。ボタン押下が直接アクションにつながり、操作が明快。

### 3. カスタムドロップダウンを採用した理由

**問題**: ネイティブ `<select>` のドロップダウン位置がずれる、選択肢が小さくて読みづらいという SP での問題。

**決定**: カテゴリ・アーティスト選択ともに、`absolute z-10` のカスタムドロップダウンに統一。十分なパディング（`py-3`）とフォントサイズで操作性を確保。

### 4. アーティスト選択のチェックボックスを廃止した理由

**問題**: チェックボックス付きマルチセレクトドロップダウンは、選択状態がドロップダウン内でしか確認できず、一覧性に欠ける。

**決定**: ドロップダウンで選択 → 一覧に追加 → ×で削除、の直感的な UI に変更。選択済みアーティストは画像 + 名前 + ×アイコンの行として常時表示。

---

## 今後のエンハンス候補・既知の改善点

### UI/UX

- [ ] **Escape キーでパネルを閉じる**: 現在はオーバーレイクリックと×ボタンのみ
- [ ] **自動下書き保存**: 一定間隔で自動的に下書き保存する機能（note.com にもある）
- [ ] **パネル内 ThumbnailCropper の幅対応**: パネル幅 420px 内でクロッパーが適切に動作するか要検証
- [ ] **画像ドラッグ&ドロップ**: TiptapEditor への画像ドラッグ&ドロップ対応
- [ ] **タイトル文字数カウンター表示**: maxLength=50 に対する残り文字数の表示
- [ ] **公開設定パネルの閉じ確認**: 設定変更後にパネルを閉じる際の確認ダイアログ

### コード品質

- [ ] **`any` 型の排除**: `relatedArtists` / `availableArtists` の `any[]` を `Artist` 型に置換
- [ ] **共通コンポーネントの抽出**: 作成画面と編集画面で重複しているパネル内 UI（サムネイル、カテゴリ、アーティスト）を共通コンポーネントに切り出す
- [ ] **カスタムドロップダウンのコンポーネント化**: カテゴリ用・アーティスト用のドロップダウンをそれぞれ再利用可能なコンポーネントにする
- [ ] **エラーハンドリングの改善**: `alert()` ではなくトースト通知やインラインエラー表示に変更

### 機能追加

- [ ] **タグ機能**: Blog モデルに `tags` フィールドは存在するが UI 未実装
- [ ] **セットリスト機能**: Blog モデルに `setlist` フィールド (Json?) は存在するが UI 未実装
- [ ] **プレビュー機能**: 公開前に記事の見た目を確認できるプレビューモード
- [ ] **下書き一覧からの再編集**: ダッシュボードから下書きを選んで編集に遷移するフロー

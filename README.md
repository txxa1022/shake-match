# Shake Match — プロトタイプ (v0.3)

位置情報マッチングアプリのプロトタイプです。  
シェイク検知 → 近接ユーザー表示 → proximity_matches 連携メッセージまで実装しています。

## 実装済み

| 機能 | 状態 |
|------|------|
| シェイク検知 + 近接表示 | ✅ |
| **Neon (PostgreSQL + PostGIS) 近接検索** | ✅ (`DATABASE_URL` 設定時) |
| **モックデータフォールバック** | ✅ (`DATABASE_URL` 未設定時) |
| プロフィール作成 → `users` テーブル登録 | ✅ |
| シェイク時 `user_locations` upsert | ✅ |
| メッセージ / ブロック / 通報 | ✅ |
| DEMO_MODE 認証・KYCバイパス | ✅ |

## セットアップ

```bash
cd ~/Projects/shake-match
npm install
npm run dev
```

`.env.local` の例:

```env
DEMO_MODE=true
# DATABASE_URL=postgresql://...  # Neon 利用時のみ（サーバー専用）
```

> **重要: DEMO_MODE はローカル/非公開デモ専用です。**  
> **本番デプロイ時は必ず `false` にし、KYC・認証チェックを有効化してください。**

---

## Neon (PostgreSQL + PostGIS) の設定

### 1. Neon プロジェクト作成

1. [Neon Console](https://console.neon.tech/) でプロジェクトを作成
2. **SQL Editor** を開く
3. `db/schema.sql` の内容をすべて実行（PostGIS 拡張 + テーブル + RPC 関数）

> Neon で PostGIS を使うには、プロジェクト作成時に PostGIS 対応リージョンを選ぶか、  
> `create extension if not exists postgis;` が成功することを確認してください。

### 2. 接続文字列を設定

Neon ダッシュボード → **Connection Details** → **Connection string** をコピーし、  
`.env.local` に貼り付けます（**サーバー専用。`NEXT_PUBLIC_` プレフィックスは付けない**）:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 3. 再起動

```bash
npm run dev
```

DB 接続は **API Routes 経由のみ**です。フロントエンドに `DATABASE_URL` は渡しません。

---

## 動作確認手順

### A. モックデータ版（`DATABASE_URL` 未設定）

1. `.env.local` から `DATABASE_URL` を削除またはコメントアウト
2. `npm run dev`
3. トップ画面で「タップで検索」→ 固定8人のモックユーザーが表示される
4. メッセージ送信も従来どおり動作（`id=me` のデモユーザー）

### B. Neon 版（`DATABASE_URL` 設定済み）

1. `db/schema.sql` を Neon SQL Editor で実行済みであること
2. `.env.local` に `DATABASE_URL` と `DEMO_MODE=true` を設定
3. `npm run dev`
4. **プロフィール作成**: `/profile` でニックネーム等を登録  
   → `users` に insert（DEMO_MODE 中は `is_adult_verified=true`）
5. **別ブラウザ/シークレット**で2人目のプロフィールを作成（テスト用）
6. 各ユーザーでシェイク/「タップで検索」  
   → 現在地が `user_locations` に upsert され、PostGIS で近接ユーザーが返る
7. カードの「メッセージ」からチャット送信を確認

> 近接検索は `is_adult_verified = true` かつ `user_locations` に位置があるユーザーのみ対象です。  
> シェイクしていないユーザーは検索結果に出ません。

---

## プロジェクト構成

```
src/
  lib/
    db.ts              # Neon 接続（DATABASE_URL）
    nearbySearch.ts    # PostGIS 検索 or モックフォールバック
    userLocations.ts   # user_locations upsert
    users.ts           # プロフィール CRUD
  app/
    api/
      nearby/route.ts  # 近接検索 + 位置 upsert
      profile/route.ts # プロフィール登録
    profile/page.tsx   # プロフィール作成画面
db/
  schema.sql           # Neon 用スキーマ + PostGIS 関数
```

## デプロイ時の環境変数 (Vercel)

| Name | Value | Environment | 備考 |
|------|-------|-------------|------|
| `DEMO_MODE` | `true` | Preview のみ | 非公開デモ用 |
| `DEMO_MODE` | `false` または未設定 | Production | 本番 |
| `DATABASE_URL` | Neon 接続文字列 | Production / Preview | **サーバー専用** |

---

## 次のステップ

1. KYC フロー実装 + `DEMO_MODE=false` で認証ガード有効化
2. `proximity_matches` / `messages` を Neon に移行（現在はインメモリ）
3. JWT 認証（`X-User-Id` ヘッダーを置き換え）

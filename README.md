# Shake Match — プロトタイプ (v0.2)

位置情報マッチングアプリのプロトタイプです。  
シェイク検知 → 近接ユーザー表示 → **proximity_matches 連携メッセージ**まで実装しています。

## 実装済み

| 機能 | 状態 |
|------|------|
| シェイク検知 (`DeviceMotionEvent`) | ✅ |
| iOS Safari 向けモーション許可フロー | ✅ |
| シェイク不可時の「タップで検索」代替UI | ✅ |
| 位置情報取得 + Haversine 近接検索 | ✅ |
| プロフィールカードカルーセル + 絞り込み | ✅ |
| **proximity_matches 記録**（シェイク時に24h有効） | ✅ |
| **メッセージ送信**（近接表示ユーザーのみ） | ✅ |
| **チャット一覧 / 1:1チャット画面** | ✅ |
| **ブロック / 通報** | ✅ |
| PWA manifest | ✅ |

## 未実装 (本番 v1.0)

- KYC / 認証
- Supabase 実データ連携（現在はインメモリストア）
- いいね / 相互マッチング
- プッシュ通知

## セットアップ

```bash
cd ~/Projects/shake-match
npm install
npm run dev
```

`.env.local` に `DEMO_MODE=true` が設定済みです。  
トップページを開くとログイン・KYC を経由せず、いきなりシェイク/近接表示画面が表示されます。

> **重要: DEMO_MODE はローカル/非公開デモ専用です。**  
> **本番デプロイ時は必ず `false` にし、KYC・認証チェックを有効化してください。**

### DEMO_MODE の動作

| 項目 | DEMO_MODE=true | DEMO_MODE=false（本番想定） |
|------|----------------|------------------------------|
| 認証トークン | 不要 | Bearer トークン必須 |
| KYC (`is_adult_verified`) | スキップ | 必須 |
| ログインユーザー | `id=me`, `name=デモユーザー` | セッション/JWT から解決 |
| トップ画面 | シェイク画面を即表示 | 「はじめる」→ 認証/KYC フロー（今後実装） |

スマートフォン実機テストでは **HTTPS** が必須です。

## 使い方（メッセージ機能の動作確認）

1. `npm run dev` で起動 → トップ画面ですぐシェイク/「タップで検索」が使える
2. 表示されたカードの「メッセージ」をタップ → チャット画面へ
3. メッセージを送信（**シェイクで表示された相手のみ、24時間以内**）
4. 下部ナビの「チャット」から一覧を確認

シェイクせずに直接 `/chats/u1` 等へアクセスしても、proximity_matches がないため送信は **403** で拒否されます。

## プロジェクト構成

```
src/
  app/
    api/
      nearby/route.ts      # 近接検索 + proximity_matches 記録
      messages/route.ts    # 会話一覧 / メッセージ送信
      messages/[userId]/   # スレッド取得
      blocks/route.ts      # ブロック
      reports/route.ts     # 通報
    chats/                 # チャット一覧・詳細画面
  components/
    ShakeDiscovery.tsx
    ChatList.tsx / ChatThread.tsx
    BottomNav.tsx
  lib/
    store.ts               # インメモリ DB（proximity_matches, messages 等）
    conversations.ts       # 会話一覧ロジック
supabase/
  schema.sql               # 本番用スキーマ
```

## API

### `POST /api/nearby`

シェイク検索時に `proximity_matches` を記録します（`X-User-Id` ヘッダー、デフォルト `me`）。

### `POST /api/messages`

```json
{ "receiverId": "u1", "content": "こんにちは！" }
```

送信前に以下をバックエンドで検証:
- `proximity_matches` に有効なレコードがあるか（24h以内）
- ブロックされていないか

### `GET /api/messages/[userId]`

スレッド取得 + 既読処理。

## 仕様書との対応

| 仕様書セクション | 状態 |
|------------------|------|
| 4.3 メッセージ送信範囲の制御 | **実装済み** |
| 4.4 proximity_matches / messages | **実装済み**（インメモリ） |
| 4.5 ブロック / 通報 | **実装済み** |

## 次のステップ

1. Supabase 接続（`store.ts` → PostGIS + DB）
2. KYC フロー実装 + `DEMO_MODE=false` で認証ガードを有効化
3. 認証（`X-User-Id` ヘッダーを JWT セッションに置き換え）
4. プッシュ通知

## デプロイ時の環境変数

### ローカル (`npm run dev`)

`.env.local`:

```env
DEMO_MODE=true
```

### Vercel（非公開デモ用）

Project Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DEMO_MODE` | `true` | Preview / Development のみ |

非公開デモ URL（Preview デプロイ）でのみ `true` にし、**Production には設定しない**か `false` にしてください。

### Vercel（本番）

| Name | Value | Environment |
|------|-------|-------------|
| `DEMO_MODE` | `false` | Production |

または Production 環境には `DEMO_MODE` を追加しない（未設定 = 本番チェック有効）。

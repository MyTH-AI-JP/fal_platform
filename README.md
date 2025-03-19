# Fal Platform

Fal Platform は、ユーザー認証とサブスクリプション決済機能を備えた Web アプリケーションです。ユーザーは、Google、GitHub、メールアドレスを使用してログイン・会員登録を行い、ログイン後のマイページに自分のアカウント情報（アイコン、ユーザー名など）を確認できます。また、Stripe による無料プランおよび月額 20$ / 100$ の有料プランで、Fal AI の画像生成 API を利用した画像生成が提供されます。

## 技術スタック

- **Next.js**: フロントエンドおよびバックエンド（API Routes）を統合するフレームワーク
- **Clerk**: ユーザー認証（Google、GitHub、メールアドレスなど）および会員管理
- **Supabase**: データベース（ユーザーの利用状況、サブスクリプション状況、API コール数などの管理）
- **Stripe**: サブスクリプション決済（無料プラン、月額 20$、月額 100$）
- **Fal AI**: 画像生成 API
- **Vercel**: デプロイ先

## 機能

- ユーザー認証（Google、GitHub、メールアドレス）
- サブスクリプション管理（無料プラン、月額 20$、月額 100$）
- 画像生成（Fal AI の Stable Diffusion 3.5 Large モデルを使用）
- API コール数の管理（プランに応じた上限設定）

## セットアップ手順

### 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定します：

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/mypage
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/mypage

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Fal AI
FAL_AI_API_KEY=your_fal_ai_api_key
```

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### Supabase のセットアップ

1. Supabase プロジェクトを作成
2. `src/lib/supabase/schema.sql` の SQL を実行してテーブルを作成

### Clerk のセットアップ

1. Clerk プロジェクトを作成
2. OAuth プロバイダー（Google、GitHub）を設定
3. 環境変数に API キーを設定

### Stripe のセットアップ

1. Stripe アカウントを作成
2. 商品とプランを作成（無料、月額 20$、月額 100$）
3. Webhook を設定（`/api/stripe/webhook` エンドポイント向け）
4. 環境変数に API キーを設定

### Fal AI のセットアップ

1. Fal AI アカウントを作成
2. API キーを取得
3. 環境変数に API キーを設定

## デプロイ

Vercel にデプロイする場合：

1. GitHub リポジトリを Vercel に連携
2. 環境変数を Vercel プロジェクト設定に追加
3. デプロイを実行

## 開発者

- [tsubouchi](https://github.com/tsubouchi)

## ライセンス

MIT

# 認証システム

## 概要

Google OAuth 2.0を使用したBearerトークンベースの認証システムです。

## 主要なコンポーネント

### 1. Google Token Verifier (`google-token-verifier.ts`)
- Google OAuthトークンを検証
- トークンからGoogleのユーザーID（sub）を取得

### 2. Google Service (`google-service.ts`)
- Google APIからユーザー情報を取得
- アクセストークンを使用してユーザー情報を取得

### 3. Auth Middleware (`auth-middleware.ts`)
- リクエストヘッダーからBearerトークンを取得
- トークンを検証して認証コンテキストを返す
- `requireAuth()`: 認証が必要なAPI Routeで使用

### 4. User Context (`user-context.ts`)
- 現在のユーザー情報を取得
- `getCurrentUser()`: 現在のユーザーを取得
- `getCurrentUserId()`: 現在のユーザーIDを取得

## 使用方法

### API Routeでの認証

```typescript
import { NextRequest } from 'next/server';
import { createGetHandler } from '@/lib/utils/api-handler';
import { getCurrentUser } from '@/lib/auth/user-context';

async function handler(req: NextRequest) {
  const user = await getCurrentUser(req);
  // ユーザー情報を使用
  return user;
}

export const GET = createGetHandler(handler);
```

### 認証ヘルパーの使用

```typescript
import { withAuth } from '@/lib/utils/auth-helper';

const handler = withAuth(async (req, user) => {
  // userは既に認証済み
  return { message: `Hello, ${user.displayName}` };
});
```

## API エンドポイント

### POST `/api/auth/login/after`
ログイン後のユーザー情報取得。初回ログイン時は自動的にユーザーを登録します。

**リクエストヘッダー:**
```
Authorization: Bearer <access_token>
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "displayName": "User Name",
    "subject": "google_user_id",
    ...
  }
}
```

### GET `/api/user/me`
現在ログインしているユーザー情報を取得します。

**リクエストヘッダー:**
```
Authorization: Bearer <access_token>
```

### POST `/api/oauth/callback`
Google OAuth認証コードをアクセストークンに交換します。

**リクエストボディ:**
```json
{
  "code": "authorization_code"
}
```

### POST `/api/oauth/refresh`
リフレッシュトークンを使用してアクセストークンを更新します。

**リクエストボディ:**
```json
{
  "refresh_token": "refresh_token"
}
```

## 環境変数

以下の環境変数を設定する必要があります：

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/callback
```


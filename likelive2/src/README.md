# LikeLive2 バックエンド構造

## ディレクトリ構成

```
src/
├── app/
│   ├── api/              # Next.js API Routes
│   │   ├── auth/         # 認証関連エンドポイント
│   │   ├── users/        # ユーザー関連エンドポイント
│   │   ├── blogs/        # ブログ関連エンドポイント
│   │   ├── comments/     # コメント関連エンドポイント
│   │   ├── artists/      # アーティスト関連エンドポイント
│   │   ├── notifications/ # 通知関連エンドポイント
│   │   ├── follows/      # フォロー関連エンドポイント
│   │   ├── files/        # ファイルアップロード関連
│   │   └── spotify/      # Spotify連携関連
│   └── ...
├── lib/
│   ├── prisma/
│   │   └── client.ts     # Prisma Clientのシングルトンインスタンス
│   ├── auth/             # 認証関連ユーティリティ（今後実装）
│   ├── services/          # ビジネスロジック（今後実装）
│   └── utils/             # 共通ユーティリティ
│       ├── errors.ts     # カスタムエラークラス
│       ├── api-response.ts # APIレスポンスフォーマット
│       ├── api-handler.ts # API Routeハンドラー
│       ├── logger.ts      # ロガー
│       ├── pagination.ts  # ページネーション
│       ├── sort.ts        # ソート処理
│       └── request.ts     # リクエスト処理
├── types/
│   └── api.ts            # API関連の型定義
└── ...
```

## 主要なユーティリティ

### Prisma Client
```typescript
import { prisma } from '@/lib/prisma/client';

// 使用例
const users = await prisma.user.findMany();
```

### エラーハンドリング
```typescript
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors';

throw new NotFoundError('User not found');
```

### API Routeハンドラー
```typescript
import { createGetHandler } from '@/lib/utils/api-handler';

export const GET = createGetHandler(async (req, { params }) => {
  // ハンドラー実装
});
```

### ページネーション
```typescript
import { getPaginationParams, createPaginationResult } from '@/lib/utils/pagination';

const { page, limit } = getPaginationParams(req);
const result = createPaginationResult(data, total, page, limit);
```

## 次のステップ

フェーズ2: 認証システムの移行から開始してください。


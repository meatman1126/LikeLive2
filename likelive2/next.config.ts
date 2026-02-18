import { config } from "dotenv";
import type { NextConfig } from "next";
import { resolve } from "path";

// 環境変数ファイルを読み込む
// .env.dev (開発環境) または .env.prod (本番環境)
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "production" ? ".env.prod" : ".env.dev";
config({ path: resolve(__dirname, envFile) });

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Server Actionsのボディサイズ制限を設定（デフォルトは1MB）
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // Prisma Query Engine をサーバーバンドルに含める（Vercel 用）
    outputFileTracingIncludes: {
      "/**": ["./generated/prisma/**/*.node"],
    },
  },
  // 画像の外部ホスト設定
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
        pathname: "/**",
      },
    ],
  },
  // Prismaクライアントのパス解決（Webpack用）
  // 注意: Next.js 16のTurbopackでは、Prismaクライアントとの互換性問題が報告されています
  // 現時点では、`npm run build --webpack`でWebpackを使用することを推奨します
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prismaクライアントのパス解決
      config.resolve.alias = {
        ...config.resolve.alias,
        "@prisma/client/runtime/library": require.resolve(
          "@prisma/client/runtime/library"
        ),
      };
    }
    return config;
  },
  // Turbopack設定（空の設定でエラーを回避）
  // 注意: Prismaクライアントのパス解決はTurbopackでは未対応の可能性があります
  turbopack: {},
};

export default nextConfig;

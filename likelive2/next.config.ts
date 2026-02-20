import { config } from "dotenv";
import type { NextConfig } from "next";
import path from "path";
import { resolve } from "path";

// Prisma Query Engine を .next にコピーする Webpack プラグイン（Vercel 用）
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

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
  },
  // モノレポで lockfile が複数ある場合、トレースルートをこのアプリに固定（Vercel で Engine が含まれないのを防ぐ）
  outputFileTracingRoot: path.join(__dirname),
  // Prisma Query Engine (.so.node) をサーバーバンドルに含める（Next.js 16 でトップレベル）
  outputFileTracingIncludes: {
    "/**": [
      "./generated/prisma/**/*.node",
      "./generated/prisma/**/*.so.node",
    ],
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
  // Prisma: パス解決 + Query Engine を .next にコピー（Vercel 用）
  // 注意: Next.js 16のTurbopackでは、Prismaクライアントとの互換性問題が報告されています
  // 現時点では、`npm run build --webpack`でWebpackを使用することを推奨します
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...(config.plugins ?? []), new PrismaPlugin()];
      config.resolve.alias = {
        ...config.resolve.alias,
        "@prisma/client/runtime/library":
          require.resolve("@prisma/client/runtime/library"),
      };
    }
    return config;
  },
  // Turbopack設定（空の設定でエラーを回避）
  // 注意: Prismaクライアントのパス解決はTurbopackでは未対応の可能性があります
  turbopack: {},
};

export default nextConfig;

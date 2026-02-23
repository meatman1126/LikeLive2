/**
 * 環境変数の設定とバリデーション
 */

/**
 * 環境変数を取得し、必須の場合は存在チェックを行う
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * 環境変数の設定
 */
export const env = {
  // Node Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Database
  databaseUrl: getEnv('DATABASE_URL'),
  
  // Google OAuth
  googleClientId: getEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
  oauthRedirectUri: getEnv('OAUTH_REDIRECT_URI'),
  
  // CORS
  corsAllowOrigin: getEnv('CORS_ALLOW_ORIGIN', 'http://localhost:3000'),
  
  // File Storage
  storageType: getEnv('STORAGE_TYPE', 'supabase') as 'local' | 's3' | 'supabase',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  
  // Supabase
  supabaseUrl: getEnv('SUPABASE_URL'),
  supabasePublishableKey: getEnv('SUPABASE_PUBLISHABLE_KEY'),
  supabaseSecretKey: getEnv('SUPABASE_SECRET_KEY'),
  supabaseStorageBucket: getEnv('SUPABASE_STORAGE_BUCKET', 'uploads'),
  
  // Spotify
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,

  // Cron Jobs
  cronSecret: process.env.CRON_SECRET,
} as const;


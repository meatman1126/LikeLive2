import { buildGoogleAuthUrl } from "@/lib/utils/auth-helper";

export default function LoginPage() {
  const authUrl = buildGoogleAuthUrl();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">ログイン</h1>
      <p className="text-sm text-zinc-600">
        Googleアカウントでログインします。
      </p>
      <a
        href={authUrl}
        className="inline-flex w-fit items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Googleでログイン
      </a>
    </main>
  );
}

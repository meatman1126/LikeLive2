export default function ProfileEditLoading() {
  return (
    <div className="container mx-auto p-4 font-sans">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-white px-6 py-12">
        {/* タイトル */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
        </div>

        <div className="space-y-6">
          {/* プロフィール画像と自己紹介 セクション */}
          <section className="rounded-lg border border-black/[.08] bg-white p-6 text-sm shadow-lg">
            <div className="flex flex-col md:flex-row md:items-start mb-6">
              {/* プロフィール画像プレースホルダー */}
              <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                <div className="w-32 h-32 animate-pulse rounded-full bg-gray-200" />
              </div>
              {/* 入力欄プレースホルダー */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200 mb-2" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-gray-100" />
                </div>
                <div>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200 mb-2" />
                  <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
                </div>
              </div>
            </div>
          </section>

          {/* 好きなアーティスト セクション */}
          <section className="rounded-lg border border-black/[.08] bg-white p-6 text-sm shadow-lg">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200 mb-4" />
            {/* 検索バープレースホルダー */}
            <div className="mb-4 flex gap-2">
              <div className="flex-1 h-10 animate-pulse rounded-md bg-gray-100" />
              <div className="h-10 w-16 animate-pulse rounded-md bg-gray-200" />
            </div>
            {/* アーティスト一覧プレースホルダー */}
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-black/[.08] bg-gray-50 p-3"
                >
                  <div className="w-12 h-12 animate-pulse rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 h-4 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </section>

          {/* ボタンプレースホルダー */}
          <div className="flex justify-center gap-4">
            <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
            <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
          </div>
        </div>
      </main>
    </div>
  );
}

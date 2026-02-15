"use client";

import { searchUsersAction } from "@/app/actions";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";

function UserSearchFormAndResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordParam = searchParams.get("keyword") || "";

  const [searchTerm, setSearchTerm] = useState(keywordParam);
  const [searchResults, setSearchResults] = useState<
    {
      id: number;
      displayName: string | null;
      profileImageUrl: string | null;
      selfIntroduction?: string | null;
    }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setErrorMessage("検索ワードを入力してください");
      return;
    }

    setErrorMessage("");
    startTransition(async () => {
      try {
        const result = await searchUsersAction(searchTerm.trim(), 1, 50);
        setSearchResults(result.data || []);
        router.push(
          `/user/search?keyword=${encodeURIComponent(searchTerm.trim())}`
        );
      } catch (error) {
        console.error("検索エラー:", error);
        setErrorMessage("検索に失敗しました");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim() !== "") {
      setErrorMessage("");
    }
  };

  useEffect(() => {
    if (keywordParam) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-700">ユーザー検索</h1>

      <div className="flex flex-col gap-3">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="user-search-keyword"
        >
          キーワード
        </label>
        <div className="flex gap-2">
          <input
            id="user-search-keyword"
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="アーティスト名、ユーザー名で検索..."
            className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-1 ${
              errorMessage
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 focus:border-green-500 focus:ring-green-500"
            }`}
            disabled={isPending}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isPending}
            className="flex-shrink-0 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
          >
            {isPending ? "検索中..." : "検索"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}

      <p className="text-sm text-gray-500">
        アーティスト名やユーザー名で検索できます。
      </p>

      {searchResults.length > 0 ? (
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold text-gray-600">検索結果</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {searchResults.map((user) => (
              <Link
                key={user.id}
                href={`/user/${user.id}`}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                  {user.profileImageUrl ? (
                    <Image
                      src={normalizeImageUrl(user.profileImageUrl)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-2xl text-gray-400">👤</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-800">
                    {user.displayName ?? "unknown"}
                  </p>
                  {user.selfIntroduction ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
                      {user.selfIntroduction}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : searchTerm.trim() ? (
        <p className="mt-8 text-sm text-gray-500">検索結果が0件です。</p>
      ) : null}
    </section>
  );
}

export function UserSearchContent() {
  return (
    <Suspense
      fallback={
        <section className="space-y-4">
          <h1 className="text-xl font-semibold text-gray-700">ユーザー検索</h1>
          <p className="text-sm text-gray-500">読み込み中...</p>
        </section>
      }
    >
      <UserSearchFormAndResults />
    </Suspense>
  );
}

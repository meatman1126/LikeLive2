"use client";

import { UserRegistrationModal } from "@/app/components/UserRegistrationModal";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReleaseWithArtist } from "@/lib/services/release-service";

type Props = {
  isFirstLogin: boolean;
  initialUsername: string | null;
  interestBlogs: any[];
  recommendedUsers: any[];
  drafts: any[];
  initialReleases: ReleaseWithArtist[];
  releasesTotal: number;
};

const RELEASE_LIMIT = 10;

const RELEASE_TYPE_LABELS: Record<string, string> = {
  album: "アルバム",
  single: "シングル",
  ep: "EP",
  compilation: "コンピレーション",
};

function formatReleaseDate(
  releaseNormalized: Date | null,
  raw: string,
  precision: string
): string {
  if (!releaseNormalized) return raw;
  const d = new Date(releaseNormalized);
  if (precision === "day") {
    return d.toLocaleDateString("ja-JP");
  } else if (precision === "month") {
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  } else {
    return `${d.getFullYear()}年`;
  }
}

export function DashboardClient({
  isFirstLogin,
  initialUsername,
  interestBlogs,
  recommendedUsers,
  drafts,
  initialReleases,
  releasesTotal,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(isFirstLogin);
  const [releases, setReleases] = useState<ReleaseWithArtist[]>(initialReleases);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/dashboard/releases?limit=${RELEASE_LIMIT}&offset=${releases.length}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const newReleases: ReleaseWithArtist[] = data.items.map((item: any) => ({
        id: item.release.id,
        spotifyReleaseId: item.release.spotifyReleaseId,
        spotifyArtistId: item.artist.spotifyArtistId,
        name: item.release.name,
        releaseType: item.release.type,
        releaseDateRaw: item.release.releaseDate,
        releaseDatePrecision: item.release.releaseDatePrecision,
        releaseDateNormalized: item.release.releaseDate
          ? new Date(item.release.releaseDate)
          : null,
        coverImageUrl: item.release.coverImageUrl,
        spotifyUrl: item.release.spotifyUrl,
        createdBy: "",
        createdAt: new Date(),
        updatedBy: "",
        updatedAt: new Date(),
        artist: {
          id: item.artist.spotifyArtistId,
          name: item.artist.name,
          imageUrl: item.artist.imageUrl,
          createdBy: "",
          createdAt: new Date(),
          updatedBy: "",
          updatedAt: new Date(),
        },
      }));
      setReleases((prev) => [...prev, ...newReleases]);
    } catch (e) {
      console.error("Failed to load more releases:", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const hasMore = releases.length < releasesTotal;

  return (
    <>
      {isFirstLogin && (
        <UserRegistrationModal
          initialUsername={initialUsername}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      <div className="container mx-auto p-4 font-sans">
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 bg-white px-6 py-12">
          {/* おすすめの新着投稿 */}
          <section className="space-y-4">
            <h2 className="text-xl text-gray-700 font-semibold">
              おすすめの新着投稿
            </h2>
            {interestBlogs.length === 0 ? (
              <p className="text-sm text-gray-700">
                おすすめの投稿はまだありません。
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {interestBlogs.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.id}`}
                    className="block rounded-lg border border-black/[.08] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                  >
                    {blog.thumbnailUrl ? (
                      <div className="relative mb-4 h-36 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={normalizeImageUrl(blog.thumbnailUrl)}
                          alt={`${blog.title}のサムネイル`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 flex h-36 w-full items-center justify-center rounded-t-lg bg-zinc-100 dark:bg-zinc-800">
                        <span className="text-sm text-zinc-500">画像なし</span>
                      </div>
                    )}

                    <h3 className="mb-4 text-xl font-bold text-gray-700">
                      {blog.title}
                    </h3>

                    <div className="mb-4 flex items-center">
                      {blog.author?.profileImageUrl ? (
                        <div className="relative mr-4 h-10 w-10 overflow-hidden rounded-full border-2 border-gray-300">
                          <Image
                            src={normalizeImageUrl(blog.author.profileImageUrl)}
                            alt={`${blog.author.displayName}のアイコン`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-300">
                          <span className="text-lg">👤</span>
                        </div>
                      )}
                      <div className="flex flex-1 items-center justify-between">
                        <p className="font-semibold text-gray-700">
                          {blog.author?.displayName ?? "unknown"}
                        </p>
                      </div>
                    </div>

                    <p className="text-right text-sm text-gray-500">
                      投稿日:{" "}
                      {new Date(blog.blogCreatedTime).toLocaleDateString(
                        "ja-JP",
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* お気に入りアーティストの最新リリース */}
          <section className="space-y-4">
            <h2 className="text-xl text-gray-700 font-semibold">
              お気に入りアーティストの最新リリース
            </h2>
            {releases.length === 0 ? (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-600">
                  お気に入りアーティストを追加すると新譜がここに出ます
                </p>
                <Link
                  href="/me"
                  className="inline-block rounded-lg bg-blue-500 px-6 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                >
                  アーティストを追加する
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {releases.map((release) => (
                    <a
                      key={release.spotifyReleaseId}
                      href={release.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-2 rounded-lg border border-black/[.08] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* ジャケット画像 */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                        {release.coverImageUrl ? (
                          <Image
                            src={normalizeImageUrl(release.coverImageUrl)}
                            alt={`${release.name}のジャケット`}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-2xl text-gray-400">♪</span>
                          </div>
                        )}
                      </div>

                      {/* リリース情報 */}
                      <div className="flex flex-col gap-1 min-w-0">
                        {/* アーティスト名 */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {release.artist.imageUrl && (
                            <div className="relative h-4 w-4 flex-shrink-0 overflow-hidden rounded-full">
                              <Image
                                src={normalizeImageUrl(release.artist.imageUrl)}
                                alt={release.artist.name ?? ""}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="truncate text-xs text-gray-500">
                            {release.artist.name ?? "Unknown"}
                          </span>
                        </div>

                        {/* リリース名 */}
                        <p className="truncate text-sm font-semibold text-gray-800 leading-snug">
                          {release.name}
                        </p>

                        {/* 種別 & 日付 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            {RELEASE_TYPE_LABELS[release.releaseType] ??
                              release.releaseType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatReleaseDate(
                              release.releaseDateNormalized,
                              release.releaseDateRaw,
                              release.releaseDatePrecision
                            )}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* もっと見るボタン */}
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isLoadingMore ? "読み込み中..." : "もっと見る"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* おすすめのユーザ */}
          <section className="space-y-4">
            <h2 className="text-xl text-gray-700 font-semibold">
              おすすめのユーザ
            </h2>
            {recommendedUsers.length === 0 ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-700">
                  共通のアーティストが好きなユーザはまだいないみたいです。
                </p>
                <p className="text-sm text-gray-700">
                  興味のあるアーティストを追加してみましょう
                </p>
                <Link
                  href="/me"
                  className="inline-block rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  プロフィール設定
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  共通のアーティストが好きなユーザ
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {recommendedUsers.map((user) => (
                    <Link
                      key={user.userId}
                      href={`/user/${user.userId}`}
                      className="block rounded-lg border border-black/[.08] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                    >
                      <div className="mb-4 flex items-center">
                        {user.profileImageUrl ? (
                          <div className="relative mr-4 h-10 w-10 overflow-hidden rounded-full border-2 border-gray-300">
                            <Image
                              src={normalizeImageUrl(user.profileImageUrl)}
                              alt={`${user.displayName}のアイコン`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-300">
                            <span className="text-lg">👤</span>
                          </div>
                        )}
                        <div className="flex flex-1 items-center justify-between">
                          <p className="font-semibold text-gray-700">
                            {user.displayName}
                          </p>
                          {user.isFollow && (
                            <span className="text-xs text-gray-500">
                              フォロー中
                            </span>
                          )}
                        </div>
                      </div>
                      {user.selfIntroduction && (
                        <p className="text-sm text-gray-700">
                          {user.selfIntroduction}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 作成途中の記事 */}
          {drafts.length > 0 && (
            <section className="space-y-4 text-gray-700">
              <h2 className="text-xl font-semibold">作成途中の記事</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {drafts.map((draft) => (
                  <Link
                    key={draft.id}
                    href={`/blog/${draft.id}`}
                    className="block rounded-lg border border-black/[.08] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                  >
                    <h3 className="text-xl font-bold">
                      {draft.title || "無題"}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
